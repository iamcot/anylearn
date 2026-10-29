package com.anylearn.backend.service.arena;

import com.anylearn.backend.config.PaymentConfig;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.ZnsService;
import com.anylearn.backend.service.arena.ArenaService.Session;
import com.anylearn.backend.service.notifications.NotificationPrefsService;
import com.anylearn.backend.service.notifications.NotificationTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Runs Đấu trường Leo by itself (plan 18): makes the sessions, opens them, sends the "Nhắc tôi" reminders and settles. Every step
 * is claimed with a conditional UPDATE, so a second run (or a second server) cannot do it twice.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ArenaScheduler {

    private static final int BATCH = 200;

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final ArenaSettings settings;
    private final ArenaService arena;
    private final ArenaSettlementService settlement;
    private final NotificationService notifications;
    private final ZnsService zns;
    private final NotificationPrefsService prefs;
    private final PaymentConfig paymentConfig;

    private long lastEnsure = 0;

    @Scheduled(fixedDelay = 10000)
    public void tick() {
        try {
            run();
        } catch (Exception e) {
            log.warn("[arena] scheduler tick failed: {}", e.getMessage());
        }
    }

    /** One pass; public so tests and the back office can run it. */
    public void run() {
        LocalDateTime now = LocalDateTime.now(clock);
        if (System.currentTimeMillis() - lastEnsure > 60_000) {
            lastEnsure = System.currentTimeMillis();
            arena.ensureUpcoming();
        }
        List<Long> ids = jdbc.queryForList("SELECT id FROM arena_sessions WHERE status IN ('scheduled', 'live') ORDER BY day", Long.class);
        for (Long id : ids) {
            Session s = arena.session(id);
            if (s == null) continue;
            if (settings.enabled() && !s.custom() && s.remindersSentAt() == null && !now.isBefore(s.timing().startsAt().minusMinutes(settings.num("notify_minutes")))
                    && now.isBefore(ArenaRules.endsAt(s.timing()))) {
                remind(s);
            }
            if ("scheduled".equals(s.status()) && !now.isBefore(s.timing().openAt())) {
                jdbc.update("UPDATE arena_sessions SET status = 'live' WHERE id = ? AND status = 'scheduled'", id);
            }
            if (s.settledAt() == null && !now.isBefore(ArenaRules.endsAt(s.timing()).plusSeconds(ArenaSettlementService.SETTLE_DELAY_SECONDS))) {
                try {
                    settlement.settle(id);
                } catch (Exception e) {
                    log.warn("[arena] settle {} failed: {}", id, e.getMessage());
                }
            }
        }
    }

    /** Sends the reminder to everybody who pressed "Nhắc tôi", once. */
    void remind(Session s) {
        int claimed = jdbc.update("UPDATE arena_sessions SET reminders_sent_at = ? WHERE id = ? AND reminders_sent_at IS NULL", Timestamp.valueOf(LocalDateTime.now(clock)), s.id());
        if (claimed == 0) return;
        String time = s.timing().startsAt().format(DateTimeFormatter.ofPattern("HH:mm"));
        String title = settings.raw("notify_title").replace("{time}", time);
        String body = settings.raw("notify_body").replace("{time}", time);
        String link = paymentConfig.getFrontendUrl() + "/fun/arena";
        while (true) {
            List<Map<String, Object>> batch = jdbc.queryForList("SELECT e.user_id AS userId, u.name AS name, u.phone AS phone FROM arena_entries e JOIN users u ON u.id = e.user_id " +
                    "WHERE e.session_id = ? AND e.registered_at IS NOT NULL AND e.reminded_at IS NULL ORDER BY e.user_id LIMIT " + BATCH, s.id());
            if (batch.isEmpty()) break;
            for (Map<String, Object> row : batch) {
                long userId = ((Number) row.get("userId")).longValue();
                jdbc.update("UPDATE arena_entries SET reminded_at = ? WHERE session_id = ? AND user_id = ?", Timestamp.valueOf(LocalDateTime.now(clock)), s.id(), userId);
                try {
                    if (settings.flag("notify_app")) notifications.createNotification(userId, "arena_reminder", title, body, "/fun/arena");
                    if (settings.flag("notify_email")) {
                        notifications.emailTemplate(userId, "arena_reminder", "email-arena_reminder", title, Map.of("time", time, "link", link));
                    }
                    String template = settings.raw("zns_template_id").trim();
                    if (settings.flag("notify_zns") && !template.isEmpty() && row.get("phone") != null && prefs.allows(userId, "arena_reminder", NotificationTopics.ZALO)) {
                        zns.sendTemplate(String.valueOf(row.get("phone")), template, Map.of("name", String.valueOf(row.get("name")), "time", time));
                    }
                } catch (Exception e) {
                    log.warn("[arena] reminder for user {} failed: {}", userId, e.getMessage());
                }
            }
        }
    }

    /** "Gửi thử cho tôi": sends the current reminder to one person through the chosen channels without touching any session. */
    public Map<String, Object> sendTest(long userId) {
        String time = settings.startTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        String title = "[Gửi thử] " + settings.raw("notify_title").replace("{time}", time);
        String body = settings.raw("notify_body").replace("{time}", time);
        boolean app = false;
        if (settings.flag("notify_app")) app = notifications.createNotification(userId, "arena_reminder", title, body, "/fun/arena") != null;
        if (settings.flag("notify_email")) {
            notifications.emailTemplate(userId, "arena_reminder", "email-arena_reminder", title, Map.of("time", time, "link", paymentConfig.getFrontendUrl() + "/fun/arena"));
        }
        return Map.of("app", app, "email", settings.flag("notify_email"), "zns", false);
    }
}
