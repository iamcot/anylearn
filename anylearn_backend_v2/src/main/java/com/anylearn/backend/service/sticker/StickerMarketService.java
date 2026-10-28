package com.anylearn.backend.service.sticker;

import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.quiz.QuizBoardRules;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.*;

/**
 * The sticker market (plan 15, part B): "I have a, b, c and need x". A listing locks the offered copies (see
 * {@link StickerService#tradable}); another eligible player presses "Đổi", picks one of them and the trade runs through the same checks and
 * transfer as an accepted offer ({@link StickerTradeService}). No coins. Failures are {@link IllegalStateException}s with a text for the person.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StickerMarketService {

    private static final String ROUTE = "/fun/sticker/market";
    private static final int PAGE_SIZE = 20;
    private static final int MATCH_WINDOW = 300;

    private final JdbcTemplate jdbc;
    private final StickerService stickers;
    private final StickerTradeService trades;
    private final StickerSettings settings;
    private final NotificationService notificationService;
    private final GameEventService gameEvents;

    private static long num(Object o) {
        return ((Number) o).longValue();
    }

    /** Lazy expiry: listings past their time stop counting as locks at once (the lock query checks the date), this only fixes the status. */
    @Transactional
    public int expireDue() {
        return jdbc.update("UPDATE sticker_listings SET status = 'expired' WHERE status = 'open' AND expires_at <= ?", Timestamp.valueOf(stickers.now()));
    }

    @Scheduled(cron = "0 20 3 * * *")
    public void nightly() {
        try {
            int n = expireDue();
            if (n > 0) log.info("[sticker-market] expired {} listings", n);
        } catch (Exception e) {
            log.warn("[sticker-market] nightly expiry failed: {}", e.getMessage());
        }
    }

    private int openListings(long userId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM sticker_listings WHERE user_id = ? AND status = 'open' AND expires_at > ?", Integer.class, userId, Timestamp.valueOf(stickers.now()));
        return n == null ? 0 : n;
    }

    /** A new listing: "I have {give}, I need {want}". */
    @Transactional
    public Map<String, Object> create(long userId, List<Long> giveRaw, long want) {
        if (!settings.enabled()) throw new IllegalStateException("Sticker đang tạm đóng");
        expireDue();
        trades.checkEligible(userId, true);
        List<Long> give = StickerMarketRules.distinct(giveRaw == null ? List.of() : giveRaw);
        Map<Long, String> rarity = new HashMap<>();
        List<Long> all = new ArrayList<>(give);
        all.add(want);
        for (long id : all) {
            String r = trades.rarityOf(id);
            if (r != null) rarity.put(id, r);
        }
        Map<Long, Integer> tradable = stickers.tradableMap(userId);
        String problem = StickerMarketRules.createProblem(give, want, rarity, tradable, stickers.ownedCount(userId, want),
                openListings(userId), settings.number("market_max_listings"));
        if (problem != null) throw new IllegalStateException(problem);
        LocalDateTime expires = StickerMarketRules.expiresAt(stickers.now(), settings.number("market_listing_days"));
        KeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement("INSERT INTO sticker_listings (user_id, want_sticker_id, expires_at) VALUES (?, ?, ?)", Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId);
            ps.setLong(2, want);
            ps.setTimestamp(3, Timestamp.valueOf(expires));
            return ps;
        }, keys);
        long id = keys.getKey().longValue();
        for (long s : give) jdbc.update("INSERT INTO sticker_listing_offers (listing_id, sticker_id) VALUES (?, ?)", id, s);
        gameEvents.record(userId, GameEventService.GAME_STICKER, "market_list", "Đăng tin #" + id + ": đưa " + give.size() + " sticker, cần #" + want, 0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", id);
        out.put("expiresAt", expires.toString());
        return out;
    }

    /** The owner removes a listing; the copies are free again. */
    @Transactional
    public void remove(long userId, long listingId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT user_id, status FROM sticker_listings WHERE id = ?", listingId);
        if (rows.isEmpty()) throw new IllegalStateException("Không tìm thấy tin");
        if (num(rows.get(0).get("user_id")) != userId) throw new IllegalStateException("Đây không phải tin của bạn");
        if (!"open".equals(rows.get(0).get("status"))) throw new IllegalStateException("Tin này đã đóng");
        jdbc.update("UPDATE sticker_listings SET status = 'cancelled' WHERE id = ? AND status = 'open'", listingId);
    }

    /** Admin: the same, for any listing. */
    @Transactional
    public void adminCancel(long listingId) {
        int rows = jdbc.update("UPDATE sticker_listings SET status = 'cancelled' WHERE id = ? AND status = 'open'", listingId);
        if (rows != 1) throw new IllegalStateException("Tin này không còn mở");
    }

    /** Someone presses "Đổi" and picks one of the offered stickers; they give the wanted one. */
    @Transactional
    public Map<String, Object> take(long takerId, long listingId, long chosen) {
        if (!settings.enabled()) throw new IllegalStateException("Sticker đang tạm đóng");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT * FROM sticker_listings WHERE id = ? FOR UPDATE", listingId);
        if (rows.isEmpty()) throw new IllegalStateException("Không tìm thấy tin");
        Map<String, Object> listing = rows.get(0);
        long lister = num(listing.get("user_id"));
        long want = num(listing.get("want_sticker_id"));
        boolean open = "open".equals(listing.get("status"));
        boolean expired = StickerMarketRules.isExpired(((Timestamp) listing.get("expires_at")).toLocalDateTime(), stickers.now());
        List<Long> offered = offeredOf(listingId);
        String problem = StickerMarketRules.takeProblem(lister, takerId, open, expired, offered, chosen,
                stickers.ownedCount(takerId, chosen), stickers.tradable(takerId, want));
        if (problem != null) {
            if (open && expired) jdbc.update("UPDATE sticker_listings SET status = 'expired' WHERE id = ? AND status = 'open'", listingId);
            throw new IllegalStateException(problem);
        }
        // close first: this releases the lister's locks so the shared trade checks see the copies as free; any failure below rolls it back
        if (jdbc.update("UPDATE sticker_listings SET status = 'done', done_with_user_id = ?, done_sticker_id = ? WHERE id = ? AND status = 'open'", takerId, chosen, listingId) != 1) {
            throw new IllegalStateException("Tin này đã đóng");
        }
        trades.checkTrade(takerId, lister, want, chosen, true);
        long tradeId = trades.transfer(takerId, lister, want, chosen);
        Map<String, Object> chosenDef = stickers.view(chosen);
        Map<String, Object> wantDef = stickers.view(want);
        notificationService.createNotification(lister, "sticker_market", "Có người đổi sticker với bạn",
                trades.nameOf(takerId) + " đã đổi " + wantDef.get("name") + " lấy " + chosenDef.get("name") + " của bạn trên chợ sticker.", ROUTE);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("tradeId", tradeId);
        out.put("received", chosenDef);
        return out;
    }

    private List<Long> offeredOf(long listingId) {
        return jdbc.queryForList("SELECT sticker_id FROM sticker_listing_offers WHERE listing_id = ? ORDER BY sticker_id", Long.class, listingId);
    }

    /** tab = match (offers something I lack, wants something I can give) | all (open listings of others) | mine (my listings, open first). */
    public Map<String, Object> list(long userId, String tab, int page) {
        expireDue();
        String which = tab == null ? "match" : tab;
        Map<Long, Integer> owned = stickers.ownedMap(userId);
        Map<Long, Integer> tradable = stickers.tradableMap(userId);
        Timestamp now = Timestamp.valueOf(stickers.now());
        List<Map<String, Object>> rows;
        if ("mine".equals(which)) {
            rows = jdbc.queryForList("SELECT * FROM sticker_listings WHERE user_id = ? ORDER BY (status = 'open') DESC, id DESC LIMIT 30", userId);
        } else {
            rows = jdbc.queryForList("SELECT * FROM sticker_listings WHERE status = 'open' AND expires_at > ? AND user_id <> ? ORDER BY id DESC LIMIT " + MATCH_WINDOW, now, userId);
        }
        List<Map<String, Object>> views = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            long id = num(row.get("id"));
            long owner = num(row.get("user_id"));
            long want = num(row.get("want_sticker_id"));
            List<Long> offered = offeredOf(id);
            boolean canTake = StickerMarketRules.canTake(owner, userId, offered, want, owned, tradable);
            if ("match".equals(which) && !canTake) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("mine", owner == userId);
            m.put("status", row.get("status"));
            m.put("userName", owner == userId ? "Bạn" : QuizBoardRules.displayName(trades.nameOf(owner)));
            m.put("want", stickers.view(want));
            List<Map<String, Object>> offers = new ArrayList<>();
            for (long s : offered) {
                Map<String, Object> view = new LinkedHashMap<>(stickers.view(s));
                view.put("lacking", owned.getOrDefault(s, 0) < 1);
                offers.add(view);
            }
            m.put("offers", offers);
            m.put("canGive", tradable.getOrDefault(want, 0) >= 1);
            m.put("canTake", canTake);
            m.put("expiresAt", ((Timestamp) row.get("expires_at")).toLocalDateTime().toString());
            m.put("createdAt", ((Timestamp) row.get("created_at")).toLocalDateTime().toString());
            views.add(m);
        }
        int total = views.size();
        int from = Math.min(Math.max(page - 1, 0) * PAGE_SIZE, total);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("tab", which);
        out.put("items", "mine".equals(which) ? views : views.subList(from, Math.min(from + PAGE_SIZE, total)));
        out.put("total", total);
        out.put("pageSize", PAGE_SIZE);
        out.put("openCount", openListings(userId));
        out.put("maxListings", settings.number("market_max_listings"));
        out.put("listingDays", settings.number("market_listing_days"));
        return out;
    }

    /** Admin list: newest first, with who and which stickers. */
    public Map<String, Object> adminList(String status, int page) {
        expireDue();
        boolean all = status == null || status.isBlank() || "all".equals(status);
        int offset = (Math.max(page, 1) - 1) * 30;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT l.id, l.user_id AS userId, u.name AS userName, u.phone AS userPhone, l.status, l.expires_at AS expiresAt, l.created_at AS createdAt, " +
                        "w.name AS wantName, d.name AS doneName, l.done_with_user_id AS doneWithUserId, " +
                        "(SELECT GROUP_CONCAT(s.name SEPARATOR ', ') FROM sticker_listing_offers o JOIN sticker_defs s ON s.id = o.sticker_id WHERE o.listing_id = l.id) AS offers " +
                        "FROM sticker_listings l LEFT JOIN users u ON u.id = l.user_id LEFT JOIN sticker_defs w ON w.id = l.want_sticker_id " +
                        "LEFT JOIN sticker_defs d ON d.id = l.done_sticker_id " + (all ? "" : "WHERE l.status = ? ") + "ORDER BY l.id DESC LIMIT 30 OFFSET ?",
                all ? new Object[]{offset} : new Object[]{status, offset});
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("total", stickers.count("SELECT COUNT(*) FROM sticker_listings" + (all ? "" : " WHERE status = ?"), all ? new Object[0] : new Object[]{status}));
        out.put("open", stickers.count("SELECT COUNT(*) FROM sticker_listings WHERE status = 'open' AND expires_at > ?", Timestamp.valueOf(stickers.now())));
        return out;
    }
}
