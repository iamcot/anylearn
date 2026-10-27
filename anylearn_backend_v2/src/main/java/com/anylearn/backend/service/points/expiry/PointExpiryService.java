package com.anylearn.backend.service.points.expiry;

import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.WalletService;
import com.anylearn.backend.service.points.expiry.PointExpiryRules.Lot;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * anyPoint expiry (plan 02.5 and 02.6): the daily job removes the points of the lots that are due (transaction type
 * `points_expired`) and reminds members 30 and 7 days before. Only members have lots, so partners' points never expire.
 * Nothing runs when the setting is off, and nothing is due before `points/expiry_start_date` + months.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PointExpiryService {

    public static final String TYPE_EXPIRED = "points_expired";
    public static final String TYPE_REMINDER = "points_expiring";
    public static final List<Integer> REMINDER_DAYS = List.of(30, 7);
    private static final DateTimeFormatter DAY = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final JdbcTemplate jdbc;
    private final PointExpirySettings settings;
    private final PointLotLedger ledger;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final TransactionRepository transactionRepository;
    private final NotificationService notificationService;
    private final TransactionTemplate transactionTemplate;
    private final Clock clock;

    @Scheduled(cron = "0 10 0 * * *")
    public void dailyJob() {
        try {
            expireDue();
        } catch (Exception e) {
            log.error("[points-expiry] expire failed: {}", e.getMessage(), e);
        }
        try {
            remindUpcoming();
        } catch (Exception e) {
            log.error("[points-expiry] reminders failed: {}", e.getMessage(), e);
        }
    }

    /** Removes the points of every lot that is due. Returns how many members lost points. */
    public int expireDue() {
        if (!settings.enabled()) return 0;
        LocalDate today = LocalDate.now(clock);
        LocalDate start = settings.startDate();
        int months = settings.months();
        // Cheap cut: nothing earned later than today minus months can be due, whatever the start day is.
        LocalDate latestEarned = today.minusMonths(months);
        if (today.isBefore(start.plusMonths(months))) return 0;
        List<Long> users = jdbc.queryForList(
                "SELECT DISTINCT user_id FROM point_lots WHERE points_remaining > 0 AND earned_at < ?",
                Long.class, java.sql.Timestamp.valueOf(latestEarned.plusDays(1).atStartOfDay()));
        int affected = 0;
        for (Long userId : users) {
            try {
                Integer lost = transactionTemplate.execute(status -> expireUser(userId, today, start, months));
                if (lost != null && lost > 0) affected++;
            } catch (Exception e) {
                log.error("[points-expiry] user {} failed: {}", userId, e.getMessage(), e);
            }
        }
        if (affected > 0) log.info("[points-expiry] {} members lost points", affected);
        return affected;
    }

    private int expireUser(Long userId, LocalDate today, LocalDate start, int months) {
        // Lock the user row first (same order as every wallet change), then read the lots.
        userRepository.findByIdWithLock(userId);
        List<Lot> due = new ArrayList<>();
        for (Lot lot : ledger.open(userId)) {
            if (PointExpiryRules.isExpired(lot.earnedOn(), start, months, today)) due.add(lot);
        }
        if (due.isEmpty()) return 0;
        long points = due.stream().mapToLong(Lot::remaining).sum();
        long taken = walletService.expireWalletC(userId, points);
        for (Lot lot : due) jdbc.update("UPDATE point_lots SET points_remaining = 0 WHERE id = ?", lot.id());
        if (taken < points) log.warn("[points-expiry] user {}: lots held {} but the balance only had {}", userId, points, taken);
        if (taken <= 0) return 0;

        Transaction tx = new Transaction();
        tx.setUserId(userId);
        tx.setType(TYPE_EXPIRED);
        tx.setAmount(-taken);
        tx.setPayMethod("wallet_c");
        tx.setContent(taken + " anyPoint đã hết hạn dùng");
        tx.setStatus(1);
        tx.setCreatedAt(LocalDateTime.now(clock));
        tx.setUpdatedAt(LocalDateTime.now(clock));
        transactionRepository.save(tx);
        try {
            notificationService.createNotification(userId, "system_notif", "anyPoint hết hạn",
                    taken + " anyPoint của bạn đã hết hạn dùng. Điểm nhận từ nay được dùng trong " + settings.months() + " tháng.",
                    "/account/anypoint");
        } catch (Exception e) {
            log.warn("[points-expiry] notify {} failed: {}", userId, e.getMessage());
        }
        return 1;
    }

    /** 30 and 7 days before: one notification per member, day and step. Returns how many were sent. */
    public int remindUpcoming() {
        if (!settings.enabled()) return 0;
        LocalDate today = LocalDate.now(clock);
        LocalDate start = settings.startDate();
        int months = settings.months();
        List<Long> users = jdbc.queryForList("SELECT DISTINCT user_id FROM point_lots WHERE points_remaining > 0", Long.class);
        int sent = 0;
        for (Long userId : users) {
            Map<LocalDate, Long> byDay = new TreeMap<>();
            for (Lot lot : ledger.open(userId)) {
                byDay.merge(PointExpiryRules.expiresOn(lot.earnedOn(), start, months), lot.remaining(), Long::sum);
            }
            for (var e : byDay.entrySet()) {
                long daysLeft = java.time.temporal.ChronoUnit.DAYS.between(today, e.getKey());
                Integer step = PointExpiryRules.reminderStep(daysLeft, REMINDER_DAYS);
                if (step == null) continue;
                if (!claim(userId, e.getKey(), step)) continue;
                sendReminder(userId, e.getValue(), e.getKey(), daysLeft);
                sent++;
            }
        }
        return sent;
    }

    private boolean claim(Long userId, LocalDate expiresOn, int step) {
        return jdbc.update("INSERT IGNORE INTO point_expiry_reminders (user_id, expires_on, days_before) VALUES (?, ?, ?)",
                userId, java.sql.Date.valueOf(expiresOn), step) > 0;
    }

    private void sendReminder(Long userId, long points, LocalDate expiresOn, long daysLeft) {
        String lastDay = expiresOn.minusDays(1).format(DAY);
        try {
            notificationService.createNotification(userId, TYPE_REMINDER, "anyPoint sắp hết hạn",
                    "Bạn có " + points + " anyPoint dùng được đến hết ngày " + lastDay + " (còn " + daysLeft + " ngày). Dùng cho khóa học tiếp theo nhé!",
                    "/account/anypoint");
        } catch (Exception e) {
            log.warn("[points-expiry] reminder to {} failed: {}", userId, e.getMessage());
        }
    }

    /** What the member sees on the anyPoint page: the next day points go and how many, and the whole schedule. */
    public Map<String, Object> summary(Long userId) {
        Map<String, Object> map = new LinkedHashMap<>(policy());
        boolean member = Boolean.TRUE.equals(jdbc.queryForObject("SELECT role = 'member' FROM users WHERE id = ?", Boolean.class, userId));
        map.put("applies", member && settings.enabled());
        List<Map<String, Object>> schedule = new ArrayList<>();
        if (member && settings.enabled()) {
            LocalDate start = settings.startDate();
            int months = settings.months();
            Map<LocalDate, Long> byDay = new TreeMap<>();
            for (Lot lot : ledger.open(userId)) {
                byDay.merge(PointExpiryRules.expiresOn(lot.earnedOn(), start, months), lot.remaining(), Long::sum);
            }
            byDay.forEach((day, points) -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("lastUsableDay", day.minusDays(1).toString());
                row.put("points", points);
                schedule.add(row);
            });
        }
        map.put("schedule", schedule);
        map.put("next", schedule.isEmpty() ? null : schedule.get(0));
        return map;
    }

    /** Public: the rule in words for the explanation page. */
    public Map<String, Object> policy() {
        Map<String, Object> map = new LinkedHashMap<>();
        LocalDate start = settings.startDate();
        int months = settings.months();
        map.put("enabled", settings.enabled());
        map.put("months", months);
        map.put("startDate", start.toString());
        map.put("firstExpiryDay", start.plusMonths(months).toString());
        map.put("firstLastUsableDay", start.plusMonths(months).minusDays(1).toString());
        return map;
    }
}
