package com.anylearn.backend.service.quiz;

import com.anylearn.backend.service.achievement.AchievementRules;
import com.anylearn.backend.service.achievement.AchievementService;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.sticker.StickerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.util.*;

/**
 * Settlement of a finished week or month of the rank quiz: the top 3 by net stars get random items (a month also gets
 * a sticker). A period is paid once (`quiz_settlements`); it runs by itself on Monday 00:05 and on the 1st 00:10 while
 * `quiz/board_auto` is on, or by hand from the back office.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizSettlementService {

    private final JdbcTemplate jdbc;
    private final QuizBoardService board;
    private final QuizGameService game;
    private final QuizGameSettings settings;
    private final StickerService stickers;
    private final NotificationService notifications;
    private final AchievementService achievements;
    private final GameEventService events;
    private final Clock clock;

    private LocalDate today() {
        return LocalDate.now(clock);
    }

    /** Pays the top 3 of a finished period; `mode` is "auto" or "manual". Throws IllegalStateException with a Vietnamese reason. */
    @Transactional
    public Map<String, Object> settle(String period, String mode) {
        String kind = QuizBoardRules.kindOf(period);
        if (kind == null) throw new IllegalArgumentException("Kỳ không hợp lệ");
        if (!QuizBoardRules.isOver(period, today())) throw new IllegalStateException("Kỳ này chưa kết thúc, chưa thể tổng kết");
        int claimed = jdbc.update("INSERT IGNORE INTO quiz_settlements (period, kind, mode) VALUES (?, ?, ?)", period, kind, mode);
        if (claimed == 0) throw new IllegalStateException("Kỳ này đã được tổng kết rồi");
        List<Integer> prizes = QuizBoardRules.MONTH.equals(kind) ? settings.boardMonthItems() : settings.boardWeekItems();
        boolean sticker = QuizBoardRules.MONTH.equals(kind) && settings.boardMonthSticker();
        List<Map<String, Object>> top = board.top(period, prizes.size());
        List<Map<String, Object>> winners = new ArrayList<>();
        for (int i = 0; i < top.size(); i++) {
            long userId = ((Number) top.get(i).get("userId")).longValue();
            int netStars = ((Number) top.get(i).get("netStars")).intValue();
            List<String> given = game.grantRandomItems(userId, prizes.get(i), "board", period);
            String stickerName = null;
            if (sticker) {
                try {
                    Map<String, Object> def = stickers.dropRandom(userId, "quiz", "board:" + period);
                    if (def != null) stickerName = String.valueOf(def.get("name"));
                } catch (Exception e) {
                    log.warn("[quiz] board sticker for user {} not given: {}", userId, e.getMessage());
                }
            }
            String reward = rewardText(given, stickerName);
            jdbc.update("INSERT INTO quiz_settlement_winners (period, place, user_id, net_stars, reward) VALUES (?, ?, ?, ?, ?)", period, i + 1, userId, netStars, reward);
            events.record(userId, GameEventService.GAME_QUIZ, "board_reward", period + " top" + (i + 1), 0);
            try {
                notifications.createNotification(userId, "quiz_board_reward", "Bạn đứng thứ " + (i + 1) + " bảng xếp hạng " + label(period),
                        "Phần thưởng: " + (reward.isBlank() ? "không có vật phẩm mới (kho đã đầy)" : reward) + ". Vào Leo rank để dùng nhé.", "/today/fun/quiz");
            } catch (Exception e) {
                log.warn("[quiz] board notification for user {} failed: {}", userId, e.getMessage());
            }
            achievements.grant(userId, AchievementRules.BOARD, "board:" + period, "Top " + (i + 1) + " bảng xếp hạng " + label(period),
                    "Leo rank · " + netStars + " sao ròng", "place" + (i + 1));
            Map<String, Object> w = new LinkedHashMap<>();
            w.put("place", i + 1);
            w.put("userId", userId);
            w.put("name", QuizBoardRules.displayName((String) top.get(i).get("name")));
            w.put("netStars", netStars);
            w.put("reward", reward);
            winners.add(w);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("period", period);
        out.put("winners", winners);
        return out;
    }

    private static String label(String period) {
        return QuizBoardRules.MONTH.equals(QuizBoardRules.kindOf(period))
                ? "tháng " + Integer.parseInt(period.substring(6)) + "/" + period.substring(1, 5)
                : "tuần " + Integer.parseInt(period.substring(6)) + "/" + period.substring(1, 5);
    }

    private static String rewardText(List<String> given, String stickerName) {
        List<String> parts = new ArrayList<>();
        Map<String, Integer> counts = new LinkedHashMap<>();
        for (String item : given) counts.merge(item, 1, Integer::sum);
        counts.forEach((item, n) -> parts.add(n + " " + QuizItems.LABELS.get(item)));
        if (stickerName != null) parts.add("sticker " + stickerName);
        return String.join(", ", parts);
    }

    /** The last weeks and months with their state and winners, newest first, for the back office. */
    public List<Map<String, Object>> overview() {
        List<Map<String, Object>> out = new ArrayList<>();
        LocalDate d = today();
        for (int i = 1; i <= 8; i++) out.add(row(QuizBoardRules.periodKey(QuizBoardRules.WEEK, d.minusWeeks(i))));
        LocalDate first = d.withDayOfMonth(1);
        for (int i = 1; i <= 3; i++) out.add(row(QuizBoardRules.periodKey(QuizBoardRules.MONTH, first.minusMonths(i))));
        return out;
    }

    private Map<String, Object> row(String period) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("period", period);
        r.put("kind", QuizBoardRules.kindOf(period));
        r.put("label", label(period));
        List<Map<String, Object>> settled = jdbc.queryForList("SELECT mode, settled_at AS settledAt FROM quiz_settlements WHERE period = ?", period);
        r.put("settled", !settled.isEmpty());
        r.put("mode", settled.isEmpty() ? null : settled.get(0).get("mode"));
        r.put("settledAt", settled.isEmpty() ? null : settled.get(0).get("settledAt"));
        r.put("winners", jdbc.queryForList("SELECT w.place, u.name AS name, w.net_stars AS netStars, w.reward FROM quiz_settlement_winners w " +
                "LEFT JOIN users u ON u.id = w.user_id WHERE w.period = ? ORDER BY w.place", period));
        r.put("preview", settled.isEmpty() ? board.top(period, 3).stream().map(t -> {
            Map<String, Object> p = new LinkedHashMap<>();
            p.put("name", QuizBoardRules.displayName((String) t.get("name")));
            p.put("netStars", t.get("netStars"));
            return p;
        }).toList() : List.of());
        return r;
    }

    @Scheduled(cron = "0 5 0 * * MON")
    public void autoWeek() {
        auto(QuizBoardRules.WEEK);
    }

    @Scheduled(cron = "0 10 0 1 * *")
    public void autoMonth() {
        auto(QuizBoardRules.MONTH);
    }

    private void auto(String kind) {
        if (!settings.boardAuto()) return;
        String period = QuizBoardRules.lastPeriod(kind, today());
        try {
            settle(period, "auto");
            log.info("[quiz] settled {}", period);
        } catch (IllegalStateException e) {
            log.info("[quiz] {} not settled: {}", period, e.getMessage());
        } catch (Exception e) {
            log.warn("[quiz] settling {} failed", period, e);
        }
    }
}
