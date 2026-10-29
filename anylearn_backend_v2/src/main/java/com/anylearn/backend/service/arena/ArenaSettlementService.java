package com.anylearn.backend.service.arena;

import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.achievement.AchievementRules;
import com.anylearn.backend.service.achievement.AchievementService;
import com.anylearn.backend.service.arena.ArenaService.Session;
import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.sticker.StickerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Settles a finished session (plan 18): final ranks, the top 3 prizes, the participation reward and the result messages.
 * Every payment is claimed first by `rewarded_at`, so running it twice never pays twice; a flagged top 3 waits for the back office.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArenaSettlementService {

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final ArenaSettings settings;
    private final ArenaService arena;
    private final CoinService coins;
    private final FunSettings funSettings;
    private final StickerService stickers;
    private final AchievementService achievements;
    private final NotificationService notifications;
    private final GameEventService events;

    private record Row(long userId, int score, long correctMs, int answered, boolean flagged, long orderAt, boolean rewarded) {}

    /** The last answer is taken up to 2 s after its time is up; a second more and the ranking can be final. */
    public static final int SETTLE_DELAY_SECONDS = 3;

    /** Settles a session whose last answer window has closed (used when somebody opens its result, so nobody waits for the scheduler). Never throws. */
    public void settleIfDue(Long sessionId) {
        if (sessionId == null) return;
        try {
            Session s = arena.session(sessionId);
            if (s != null && s.settledAt() == null && !"cancelled".equals(s.status())
                    && !LocalDateTime.now(clock).isBefore(ArenaRules.endsAt(s.timing()).plusSeconds(SETTLE_DELAY_SECONDS))) {
                settle(sessionId);
            }
        } catch (Exception e) {
            // the scheduler will try again
        }
    }

    /** Closes the session; false when somebody else already did. Throws IllegalStateException for a session that cannot be settled. */
    public boolean settle(long sessionId) {
        Session s = arena.session(sessionId);
        if (s == null) throw new IllegalStateException("Không tìm thấy trận này");
        if ("cancelled".equals(s.status())) throw new IllegalStateException("Trận này đã bị hủy");
        if (LocalDateTime.now(clock).isBefore(ArenaRules.endsAt(s.timing()))) throw new IllegalStateException("Trận này chưa kết thúc");
        int claimed = jdbc.update("UPDATE arena_sessions SET settled_at = ?, status = 'done' WHERE id = ? AND settled_at IS NULL AND status <> 'cancelled'", Timestamp.valueOf(LocalDateTime.now(clock)), sessionId);
        if (claimed == 0) return false;
        List<Row> rows = rankedRows(sessionId);
        int rank = 1;
        for (Row r : rows) {
            jdbc.update("UPDATE arena_entries SET final_rank = ? WHERE session_id = ? AND user_id = ?", rank++, sessionId, r.userId());
        }
        jdbc.update("UPDATE arena_sessions SET players = ? WHERE id = ?", rows.size(), sessionId);
        // a custom arena only ranks its players: the back office decides about any prize by hand
        if (s.custom()) return true;
        rank = 1;
        for (Row r : rows) {
            try {
                pay(s, r, rank);
            } catch (Exception e) {
                log.warn("[arena] reward for user {} in session {} failed: {}", r.userId(), sessionId, e.getMessage());
            }
            rank++;
        }
        return true;
    }

    private List<Row> rankedRows(long sessionId) {
        List<Row> rows = new ArrayList<>(jdbc.query(
                "SELECT user_id, score, correct_ms, answered, flagged, rewarded_at, UNIX_TIMESTAMP(COALESCE(registered_at, entered_at)) * 1000 AS order_at " +
                        "FROM arena_entries WHERE session_id = ? AND answered > 0 AND disqualified = 0",
                (rs, i) -> new Row(rs.getLong("user_id"), rs.getInt("score"), rs.getLong("correct_ms"), rs.getInt("answered"), rs.getInt("flagged") == 1,
                        rs.getLong("order_at"), rs.getTimestamp("rewarded_at") != null), sessionId));
        rows.sort(java.util.Comparator.comparing(r -> new ArenaRules.Entry(r.userId(), r.score(), r.correctMs(), r.orderAt()), ArenaRules.ranking()));
        return rows;
    }

    /** Pays one player of a settled session. Returns false when nothing was paid (already paid, or a flagged winner waiting). */
    private boolean pay(Session s, Row r, int rank) {
        if (s.custom()) return false;
        List<Integer> prizes = settings.rewardCoins();
        boolean top = ArenaRules.topPrize(rank, r.score(), settings.num("reward_min_score"), prizes);
        if (top && r.flagged() && !settings.flag("flagged_reward")) {
            resultMessage(s, r, rank, 0, false);
            return false;
        }
        int amount = ArenaRules.rewardFor(rank, r.score(), r.answered(), prizes, settings.num("reward_min_score"), settings.num("reward_participation"));
        int claimed = jdbc.update("UPDATE arena_entries SET rewarded_at = ?, reward_coins = ? WHERE session_id = ? AND user_id = ? AND rewarded_at IS NULL",
                Timestamp.valueOf(LocalDateTime.now(clock)), amount, s.id(), r.userId());
        if (claimed == 0) return false;
        int paid = 0;
        if (amount > 0) {
            long before = coins.balance(r.userId());
            long after = coins.credit(r.userId(), amount, CoinService.SOURCE_ARENA, "arena:" + s.day());
            // the daily earning cap may cut the amount: store what the person really got
            paid = (int) Math.max(0, after - before);
            jdbc.update("UPDATE arena_entries SET reward_coins = ? WHERE session_id = ? AND user_id = ?", paid, s.id(), r.userId());
        }
        events.record(r.userId(), GameEventService.GAME_ARENA, "reward", "rank " + rank + " " + (top ? "top" : "join"), paid);
        String stickerName = null;
        if (top) {
            if (settings.flag("reward_sticker")) {
                try {
                    Map<String, Object> def = stickers.dropRandom(r.userId(), "arena", "arena:" + s.day());
                    if (def != null) stickerName = String.valueOf(def.get("name"));
                } catch (Exception e) {
                    log.warn("[arena] sticker for user {} not given: {}", r.userId(), e.getMessage());
                }
            }
            if (settings.flag("reward_achievement")) {
                achievements.grant(r.userId(), AchievementRules.ARENA, "arena:" + s.day() + ":" + rank, "Top " + rank + " Đấu trường Leo",
                        r.score() + "/" + s.timing().questionCount() + " câu đúng · ngày " + s.day().getDayOfMonth() + "/" + s.day().getMonthValue(), "place" + Math.min(rank, 3));
            }
        }
        resultMessage(s, r, rank, paid, top, stickerName);
        return true;
    }

    private void resultMessage(Session s, Row r, int rank, int paid, boolean top) {
        resultMessage(s, r, rank, paid, top, null);
    }

    private void resultMessage(Session s, Row r, int rank, int paid, boolean top, String stickerName) {
        String coin = funSettings.coinName();
        String route = "/fun/arena/board?session=" + s.id();
        try {
            if (top && paid > 0) {
                String prize = paid + " " + coin + (stickerName != null ? " và sticker " + stickerName : "");
                notifications.createNotification(r.userId(), "arena_reward", "Bạn đứng thứ " + rank + " Đấu trường Leo!", "Phần thưởng: " + prize + ".", route);
            } else if (settings.flag("result_notify")) {
                String body = "Bạn hạng " + rank + " với " + r.score() + " điểm" + (paid > 0 ? ", nhận " + paid + " " + coin + " thưởng tham gia." : ".");
                notifications.createNotification(r.userId(), "arena_result", "Kết quả Đấu trường Leo", body, route);
            }
        } catch (Exception e) {
            log.warn("[arena] result message for user {} failed: {}", r.userId(), e.getMessage());
        }
    }

    // ---------------------------------------------------------------- back office

    /** The prize of a flagged winner after the back office cleared the flag. */
    public Map<String, Object> clearFlag(long sessionId, long userId) {
        Session s = arena.session(sessionId);
        if (s == null) throw new IllegalStateException("Không tìm thấy trận này");
        jdbc.update("UPDATE arena_entries SET flagged = 0, flag_reason = NULL WHERE session_id = ? AND user_id = ?", sessionId, userId);
        boolean paid = false;
        if ("done".equals(s.status())) {
            List<Row> rows = rankedRows(sessionId);
            int rank = 1;
            for (Row r : rows) {
                if (r.userId() == userId) {
                    // the flag is gone now, so the winner is treated like any other
                    paid = pay(s, new Row(r.userId(), r.score(), r.correctMs(), r.answered(), false, r.orderAt(), r.rewarded()), rank);
                    break;
                }
                rank++;
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("cleared", true);
        out.put("paid", paid);
        return out;
    }

    /**
     * Takes a player off the board. A closed session is ranked again and a top 3 prize that was not paid goes to the next player.
     */
    public Map<String, Object> disqualify(long sessionId, long userId) {
        Session s = arena.session(sessionId);
        if (s == null) throw new IllegalStateException("Không tìm thấy trận này");
        jdbc.update("UPDATE arena_entries SET disqualified = 1 WHERE session_id = ? AND user_id = ?", sessionId, userId);
        if ("done".equals(s.status())) {
            jdbc.update("UPDATE arena_entries SET final_rank = NULL WHERE session_id = ? AND user_id = ?", sessionId, userId);
            List<Row> rows = rankedRows(sessionId);
            int rank = 1;
            for (Row r : rows) {
                jdbc.update("UPDATE arena_entries SET final_rank = ? WHERE session_id = ? AND user_id = ?", rank, sessionId, r.userId());
                // players who moved into the top 3 and are not paid yet get their prize now
                if (!r.rewarded() && rank <= settings.rewardCoins().size()) {
                    try {
                        pay(s, r, rank);
                    } catch (Exception e) {
                        log.warn("[arena] late reward for user {} failed: {}", r.userId(), e.getMessage());
                    }
                }
                rank++;
            }
            jdbc.update("UPDATE arena_sessions SET players = ? WHERE id = ?", rows.size(), sessionId);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("disqualified", true);
        return out;
    }
}
