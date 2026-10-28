package com.anylearn.backend.service.sticker;

import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.referral.ReferralRules;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Trades between two friends: one for one, the same rarity, a duplicate for a sticker the other lacks. One trade per pair in
 * `sticker/trade_window_days`, a weekly limit and a limit of different partners per month. Only players who really played
 * ({@link StickerService#eligible}) and are not blocked can trade. Every failure is an {@link IllegalStateException} with a text for the person.
 */
@Service
@RequiredArgsConstructor
public class StickerTradeService {

    private static final String ROUTE = "/fun/sticker";

    private final JdbcTemplate jdbc;
    private final StickerService stickers;
    private final StickerSettings settings;
    private final RiskService risk;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final GameEventService gameEvents;

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    String rarityOf(long stickerId) {
        List<String> rows = jdbc.query("SELECT rarity FROM sticker_defs WHERE id = ?", (rs, i) -> rs.getString("rarity"), stickerId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    String nameOf(long userId) {
        List<String> rows = jdbc.query("SELECT name FROM users WHERE id = ?", (rs, i) -> rs.getString("name"), userId);
        return rows.isEmpty() || rows.get(0) == null ? "Một người bạn" : rows.get(0);
    }

    /** Everything about who may trade with whom, checked again when the other side accepts. */
    /** Not blocked and played enough (account age and check-in days). */
    void checkEligible(long userId, boolean self) {
        String who = self ? "Bạn" : "Người nhận";
        if (risk.blocked(userId)) throw new IllegalStateException(who + " đang bị tạm khóa quyền đổi sticker");
        if (!stickers.eligible(userId)) {
            throw new IllegalStateException(self
                    ? "Bạn cần dùng anyLEARN thêm vài ngày (và điểm danh đủ " + settings.number("eligible_checkins") + " ngày) mới đổi được sticker"
                    : "Người nhận chưa đủ điều kiện đổi sticker");
        }
    }

    private void checkPerson(long userId, boolean self) {
        String who = self ? "Bạn" : "Người nhận";
        checkEligible(userId, self);
        LocalDateTime since = stickers.now().minusDays(7);
        int week = count("SELECT COUNT(*) FROM sticker_trades WHERE status = 'done' AND (a_user = ? OR b_user = ?) AND created_at > ?", userId, userId, Timestamp.valueOf(since));
        if (week >= settings.number("trade_week_limit")) throw new IllegalStateException(who + " đã đổi tối đa " + settings.number("trade_week_limit") + " lần trong tuần này");
    }

    private void checkPair(long a, long b) {
        List<Timestamp> last = jdbc.query("SELECT created_at FROM sticker_trades WHERE pair_key = ? AND status = 'done' ORDER BY created_at DESC LIMIT 1",
                (rs, i) -> rs.getTimestamp("created_at"), StickerRules.pairKey(a, b));
        if (!last.isEmpty() && StickerRules.pairBlocked(last.get(0).toLocalDateTime(), stickers.now(), settings.number("trade_window_days"))) {
            throw new IllegalStateException("Hai bạn chỉ đổi với nhau 1 lần trong " + settings.number("trade_window_days") + " ngày");
        }
        LocalDateTime monthAgo = stickers.now().minusDays(30);
        for (long person : new long[]{a, b}) {
            int known = count("SELECT COUNT(*) FROM sticker_trades WHERE status = 'done' AND created_at > ? AND pair_key = ?", Timestamp.valueOf(monthAgo), StickerRules.pairKey(a, b));
            if (known > 0) continue;
            int partners = count("SELECT COUNT(DISTINCT CASE WHEN a_user = ? THEN b_user ELSE a_user END) FROM sticker_trades WHERE status = 'done' AND created_at > ? AND (a_user = ? OR b_user = ?)",
                    person, Timestamp.valueOf(monthAgo), person, person);
            if (partners >= settings.number("trade_month_partners")) {
                throw new IllegalStateException((person == a ? "Bạn" : "Người nhận") + " đã đổi với " + settings.number("trade_month_partners") + " người khác nhau trong tháng này");
            }
        }
    }

    private void checkSides(long fromUser, long toUser, long give, long want) {
        String giveRarity = rarityOf(give);
        String wantRarity = rarityOf(want);
        String problem = StickerRules.tradeProblem(fromUser, toUser, giveRarity, wantRarity);
        if (problem != null) throw new IllegalStateException(problem);
        if (stickers.tradable(fromUser, give) < 1) throw new IllegalStateException("Bạn không có sticker trùng này để đổi (sticker nhận từ gói quà được khóa đổi vài ngày)");
        if (stickers.ownedCount(fromUser, want) > 0) throw new IllegalStateException("Bạn đã có sticker muốn nhận rồi");
        if (stickers.tradable(toUser, want) < 1) throw new IllegalStateException("Người nhận không còn sticker trùng đó để đổi");
        if (stickers.ownedCount(toUser, give) > 0) throw new IllegalStateException("Người nhận đã có sticker bạn định đưa");
    }

    /**
     * Every rule of a trade between two people, checked again at the moment it happens (offer accepted, market "Đổi"):
     * eligibility, blocks, weekly limit, the pair window, the monthly partners and the stickers themselves.
     * {@code fromIsSelf} says whose side is "you" in the messages (the person pressing the button).
     */
    void checkTrade(long from, long to, long give, long want, boolean fromIsSelf) {
        checkPerson(from, fromIsSelf);
        checkPerson(to, !fromIsSelf);
        checkPair(from, to);
        checkSides(from, to, give, want);
    }

    /** Moves the two stickers, writes the trade row and the game events of both sides. Returns the trade id. */
    long transfer(long from, long to, long give, long want) {
        if (!stickers.takeOne(from, give, 1) || !stickers.takeOne(to, want, 1)) throw new IllegalStateException("Một trong hai sticker không còn để đổi");
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("INSERT INTO sticker_trades (a_user, b_user, pair_key, a_sticker, b_sticker) VALUES (?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, from);
            ps.setLong(2, to);
            ps.setString(3, StickerRules.pairKey(from, to));
            ps.setLong(4, give);
            ps.setLong(5, want);
            return ps;
        }, keys);
        long tradeId = keys.getKey().longValue();
        stickers.grant(from, want, "trade", "t" + tradeId, null);
        stickers.grant(to, give, "trade", "t" + tradeId, null);
        gameEvents.record(from, GameEventService.GAME_STICKER, "trade", "Đổi với #" + to + " (giao dịch " + tradeId + ")", 0);
        gameEvents.record(to, GameEventService.GAME_STICKER, "trade", "Đổi với #" + from + " (giao dịch " + tradeId + ")", 0);
        return tradeId;
    }

    /** Sends an offer to the person with this phone. */
    @Transactional
    public Map<String, Object> offer(long fromUser, String toPhone, long give, long want) {
        if (!settings.enabled()) throw new IllegalStateException("Sticker đang tạm đóng");
        String phone = ReferralRules.cleanCode(toPhone);
        Long toUser = phone == null ? null : userRepository.findByPhone(phone).map(u -> u.getId()).orElse(null);
        if (toUser == null) throw new IllegalStateException("Không tìm thấy người dùng với số điện thoại này");
        var target = userRepository.findById(toUser).orElseThrow();
        if (target.getIsChild() != null && target.getIsChild() == 1) throw new IllegalStateException("Không tìm thấy người dùng với số điện thoại này");
        checkPerson(fromUser, true);
        checkPerson(toUser, false);
        checkPair(fromUser, toUser);
        checkSides(fromUser, toUser, give, want);
        if (count("SELECT COUNT(*) FROM sticker_offers WHERE from_user = ? AND status = 'pending'", fromUser) >= 5) {
            throw new IllegalStateException("Bạn đang có 5 lời mời đổi chưa được trả lời");
        }
        if (count("SELECT COUNT(*) FROM sticker_offers WHERE from_user = ? AND to_user = ? AND give_sticker = ? AND want_sticker = ? AND status = 'pending'", fromUser, toUser, give, want) > 0) {
            throw new IllegalStateException("Bạn đã gửi lời mời này rồi");
        }
        KeyHolder keys = new GeneratedKeyHolder();
        LocalDateTime expires = stickers.now().plusHours(settings.number("offer_hours"));
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("INSERT INTO sticker_offers (from_user, to_user, give_sticker, want_sticker, expires_at) VALUES (?, ?, ?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, fromUser);
            ps.setLong(2, toUser);
            ps.setLong(3, give);
            ps.setLong(4, want);
            ps.setTimestamp(5, Timestamp.valueOf(expires));
            return ps;
        }, keys);
        Map<String, Object> giveDef = stickers.view(give);
        Map<String, Object> wantDef = stickers.view(want);
        notificationService.createNotification(toUser, "sticker_offer", "Lời mời đổi sticker",
                nameOf(fromUser) + " muốn đổi " + giveDef.get("name") + " lấy " + wantDef.get("name") + " của bạn.", ROUTE);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", keys.getKey() == null ? null : keys.getKey().longValue());
        out.put("toName", nameOf(toUser));
        return out;
    }

    private Map<String, Object> offerRow(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM sticker_offers WHERE id = ?", id);
        if (rows.isEmpty()) throw new IllegalStateException("Không tìm thấy lời mời");
        return rows.get(0);
    }

    private static long num(Object o) {
        return ((Number) o).longValue();
    }

    /** The receiver agrees: everything is checked again, then the two stickers change hands. */
    @Transactional
    public Map<String, Object> accept(long userId, long offerId) {
        Map<String, Object> offer = offerRow(offerId);
        if (num(offer.get("to_user")) != userId) throw new IllegalStateException("Lời mời này không dành cho bạn");
        if (!"pending".equals(offer.get("status"))) throw new IllegalStateException("Lời mời này đã được xử lý");
        long from = num(offer.get("from_user"));
        long give = num(offer.get("give_sticker"));
        long want = num(offer.get("want_sticker"));
        if (((Timestamp) offer.get("expires_at")).toLocalDateTime().isBefore(stickers.now())) {
            jdbc.update("UPDATE sticker_offers SET status = 'expired', decided_at = NOW() WHERE id = ?", offerId);
            throw new IllegalStateException("Lời mời đã hết hạn");
        }
        checkTrade(from, userId, give, want, false);
        long tradeId = transfer(from, userId, give, want);
        jdbc.update("UPDATE sticker_offers SET status = 'accepted', decided_at = NOW() WHERE id = ?", offerId);
        // the same stickers cannot be promised twice
        jdbc.update("UPDATE sticker_offers SET status = 'cancelled', decided_at = NOW() WHERE status = 'pending' AND ((from_user = ? AND give_sticker = ?) OR (from_user = ? AND give_sticker = ?))", from, give, userId, want);
        Map<String, Object> giveDef = stickers.view(give);
        Map<String, Object> wantDef = stickers.view(want);
        notificationService.createNotification(from, "sticker_trade", "Đổi sticker thành công",
                nameOf(userId) + " đã đồng ý. Bạn nhận được " + wantDef.get("name") + ".", ROUTE);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("tradeId", tradeId);
        out.put("received", giveDef);
        return out;
    }

    @Transactional
    public void decline(long userId, long offerId) {
        Map<String, Object> offer = offerRow(offerId);
        if (num(offer.get("to_user")) != userId) throw new IllegalStateException("Lời mời này không dành cho bạn");
        if (!"pending".equals(offer.get("status"))) throw new IllegalStateException("Lời mời này đã được xử lý");
        jdbc.update("UPDATE sticker_offers SET status = 'declined', decided_at = NOW() WHERE id = ?", offerId);
    }

    @Transactional
    public void cancel(long userId, long offerId) {
        Map<String, Object> offer = offerRow(offerId);
        if (num(offer.get("from_user")) != userId) throw new IllegalStateException("Đây không phải lời mời của bạn");
        if (!"pending".equals(offer.get("status"))) throw new IllegalStateException("Lời mời này đã được xử lý");
        jdbc.update("UPDATE sticker_offers SET status = 'cancelled', decided_at = NOW() WHERE id = ?", offerId);
    }

    /** Pending offers sent to and by the person, with the stickers and the other side's name. Expired ones are marked first. */
    public Map<String, Object> offersOf(long userId) {
        jdbc.update("UPDATE sticker_offers SET status = 'expired', decided_at = NOW() WHERE status = 'pending' AND expires_at < NOW()");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("incoming", offerList("SELECT * FROM sticker_offers WHERE to_user = ? AND status = 'pending' ORDER BY id DESC", userId, true));
        out.put("outgoing", offerList("SELECT * FROM sticker_offers WHERE from_user = ? AND status = 'pending' ORDER BY id DESC", userId, false));
        return out;
    }

    private List<Map<String, Object>> offerList(String sql, long userId, boolean incoming) {
        List<Map<String, Object>> rows = new ArrayList<>();
        for (Map<String, Object> row : jdbc.queryForList(sql, userId)) {
            long other = num(row.get(incoming ? "from_user" : "to_user"));
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", num(row.get("id")));
            m.put("otherName", nameOf(other));
            m.put("give", stickers.view(num(row.get("give_sticker"))));
            m.put("want", stickers.view(num(row.get("want_sticker"))));
            m.put("expiresAt", ((Timestamp) row.get("expires_at")).toLocalDateTime().toString());
            rows.add(m);
        }
        return rows;
    }

    /** Admin: undoes a finished trade by giving each side its sticker back; fails when one of them no longer holds what they got. */
    @Transactional
    public void adminCancel(long tradeId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM sticker_trades WHERE id = ?", tradeId);
        if (rows.isEmpty()) throw new IllegalStateException("Không tìm thấy giao dịch");
        Map<String, Object> t = rows.get(0);
        if (!"done".equals(t.get("status"))) throw new IllegalStateException("Giao dịch này đã được hủy");
        long a = num(t.get("a_user"));
        long b = num(t.get("b_user"));
        long aGave = num(t.get("a_sticker"));
        long bGave = num(t.get("b_sticker"));
        if (!stickers.takeOne(a, bGave, 0)) throw new IllegalStateException("Người đổi thứ nhất không còn sticker đã nhận, không hoàn tác được");
        if (!stickers.takeOne(b, aGave, 0)) {
            stickers.grant(a, bGave, "admin", "undo-t" + tradeId, null);
            throw new IllegalStateException("Người đổi thứ hai không còn sticker đã nhận, không hoàn tác được");
        }
        stickers.grant(a, aGave, "admin", "undo-t" + tradeId, null);
        stickers.grant(b, bGave, "admin", "undo-t" + tradeId, null);
        jdbc.update("UPDATE sticker_trades SET status = 'cancelled' WHERE id = ?", tradeId);
        gameEvents.record(a, GameEventService.GAME_STICKER, "trade_undo", "Admin hủy giao dịch " + tradeId, 0);
        gameEvents.record(b, GameEventService.GAME_STICKER, "trade_undo", "Admin hủy giao dịch " + tradeId, 0);
    }
}
