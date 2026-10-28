package com.anylearn.backend.service.fun;

import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Date;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The daily gift of the Vui học page: one claim per account per day (primary key user + day), a streak that goes on while
 * the person comes every day, anyPoint by the day of the week of the streak (setting `fun/checkin_points`) under an
 * optional daily budget (`fun/checkin_daily_cap`). Points go through {@link WalletService}.
 */
@Service
@RequiredArgsConstructor
public class CheckinService {

    public static final String TYPE_CHECKIN = "fun_checkin";

    private final JdbcTemplate jdbc;
    private final FunSettings settings;
    private final WalletService walletService;
    private final TransactionRepository transactionRepository;
    private final GameEventService gameEvents;
    private final NotificationService notificationService;
    private final Clock clock;

    private record Last(LocalDate day, int streak) {}

    private Last lastOf(Long userId) {
        List<Last> rows = jdbc.query("SELECT day, streak FROM fun_checkins WHERE user_id = ? ORDER BY day DESC LIMIT 1",
                (rs, i) -> new Last(rs.getDate("day").toLocalDate(), rs.getInt("streak")), userId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public Map<String, Object> status(Long userId) {
        LocalDate today = LocalDate.now(clock);
        Last last = lastOf(userId);
        boolean claimed = last != null && last.day().equals(today);
        int alive = last == null ? 0 : FunRules.aliveStreak(last.day(), last.streak(), today);
        int nextStreak = claimed ? alive : alive + 1;
        int current = FunRules.dayInCycle(claimed ? alive : nextStreak);
        List<Integer> points = settings.checkinPoints();
        List<Map<String, Object>> days = new ArrayList<>();
        for (int d = 1; d <= FunRules.CYCLE; d++) {
            String state = d < current || (d == current && claimed) ? "done" : d == current ? "today" : "todo";
            Map<String, Object> day = new LinkedHashMap<>();
            day.put("day", d);
            day.put("points", points.get(d - 1));
            day.put("state", state);
            days.add(day);
        }
        Integer best = jdbc.queryForObject("SELECT COALESCE(MAX(streak), 0) FROM fun_checkins WHERE user_id = ?", Integer.class, userId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("today", today.toString());
        out.put("claimedToday", claimed);
        out.put("streak", alive);
        out.put("best", Math.max(best == null ? 0 : best, alive));
        out.put("dayInCycle", current);
        out.put("nextPoints", claimed ? null : FunRules.pointsFor(points, nextStreak));
        out.put("days", days);
        return out;
    }

    /** Claims today's gift. Returns {@code alreadyClaimed: true} (and no points) when it was taken before. */
    @Transactional
    public Map<String, Object> claim(Long userId) {
        if (!settings.enabled()) throw new IllegalStateException("Quà điểm danh đang tạm đóng");
        LocalDate today = LocalDate.now(clock);
        Last last = lastOf(userId);
        int streak = FunRules.streakOn(last == null ? null : last.day(), last == null ? 0 : last.streak(), today);
        int wanted = FunRules.pointsFor(settings.checkinPoints(), streak);
        Long spent = jdbc.queryForObject("SELECT COALESCE(SUM(points), 0) FROM fun_checkins WHERE day = ?", Long.class, Date.valueOf(today));
        int points = FunRules.grantable(wanted, spent == null ? 0 : spent, settings.checkinDailyCap());

        int rows = jdbc.update("INSERT IGNORE INTO fun_checkins (user_id, day, streak, points) VALUES (?, ?, ?, ?)",
                userId, Date.valueOf(today), streak, points);
        Map<String, Object> out = new LinkedHashMap<>();
        if (rows != 1) {
            out.put("alreadyClaimed", true);
            out.put("points", 0);
            return out;
        }
        if (points > 0) {
            Transaction tx = new Transaction();
            tx.setUserId(userId);
            tx.setType(TYPE_CHECKIN);
            tx.setAmount((long) points);
            tx.setPayMethod("wallet_c");
            tx.setContent("Quà điểm danh Vui học, ngày " + FunRules.dayInCycle(streak) + " (chuỗi " + streak + ")");
            tx.setStatus(1);
            tx.setCreatedAt(LocalDateTime.now());
            tx.setUpdatedAt(LocalDateTime.now());
            transactionRepository.save(tx);
            walletService.creditWalletC(userId, points);
        }
        boolean capped = points < wanted;
        gameEvents.record(userId, GameEventService.GAME_CHECKIN, "claim",
                "Ngày " + FunRules.dayInCycle(streak) + ", chuỗi " + streak + (capped ? " (chạm trần ngân sách ngày)" : ""), points);
        if (points > 0) {
            notificationService.createNotification(userId, TYPE_CHECKIN, "Quà điểm danh Vui học",
                    "Bạn nhận " + points + " anyPoint, chuỗi " + streak + " ngày. Mai quay lại để giữ chuỗi nhé!", "/today/fun");
        }
        out.put("alreadyClaimed", false);
        out.put("points", points);
        out.put("capped", capped);
        out.put("streak", streak);
        out.put("dayInCycle", FunRules.dayInCycle(streak));
        return out;
    }
}
