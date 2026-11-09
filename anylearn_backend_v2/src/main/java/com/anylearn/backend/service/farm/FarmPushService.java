package com.anylearn.backend.service.farm;

import com.anylearn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * The reminder of Nông trại anyLEARN (plan 22.6): at most one notification a day, only when at least half of the plots are ripe,
 * only in the sending hours, not to someone who was just there, and less and less often to someone who stopped opening them.
 * Each day is claimed in `farm_push_log` first, so nothing is ever sent twice. The summary of the day's neighbour activity rides in the same text.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FarmPushService {

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final FarmSettings settings;
    private final FarmService farm;
    private final FarmSocialService social;
    private final NotificationService notifications;

    @Scheduled(fixedDelay = 30 * 60 * 1000L, initialDelay = 5 * 60 * 1000L)
    public void run() {
        try {
            sendDue();
        } catch (Exception e) {
            log.warn("[farm-push] run failed: {}", e.getMessage());
        }
    }

    int sendDue() {
        if (!settings.enabled() || settings.n("push_enabled") != 1) return 0;
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDate today = now.toLocalDate();
        List<Map<String, Object>> candidates = jdbc.queryForList("SELECT user_id, plots, push_ignored, last_visit_at FROM farm_profiles WHERE last_visit_at IS NOT NULL AND last_visit_at < ? LIMIT 2000", Timestamp.valueOf(now.minusHours(3)));
        int sent = 0;
        for (Map<String, Object> p : candidates) {
            long userId = ((Number) p.get("user_id")).longValue();
            LocalDateTime lastVisit = FarmService.time(p.get("last_visit_at"));
            int plots = ((Number) p.get("plots")).intValue();
            int ignored = ((Number) p.get("push_ignored")).intValue();
            Timestamp lastPush = jdbc.query("SELECT MAX(sent_at) FROM farm_push_log WHERE user_id = ?", rs -> rs.next() ? rs.getTimestamp(1) : null, userId);
            Integer sentToday = jdbc.queryForObject("SELECT COUNT(*) FROM farm_push_log WHERE user_id = ? AND day = ?", Integer.class, userId, java.sql.Date.valueOf(today));
            // a reminder that came after the last visit and was not followed by a visit counts as not opened
            int ignoredNow = lastPush != null && lastPush.toLocalDateTime().isAfter(lastVisit) ? ignored : 0;
            int ripe = 0;
            int soon = 0;
            FarmRules.Params params = settings.params();
            Map<String, Map<String, Object>> crops = farm.cropMap();
            for (Map<String, Object> row : jdbc.queryForList("SELECT * FROM farm_plots WHERE user_id = ? AND crop_key IS NOT NULL", userId)) {
                FarmRules.View v = FarmRules.view(farm.plotOf(row, crops), now, params);
                if (v.phase() == FarmRules.Phase.RIPE) ripe++;
                if (v.phase() == FarmRules.Phase.RIPE && v.ripeAt() != null && Duration.between(v.ripeAt(), now).toHours() >= Math.max(params.ripeHoursMin() - 2, 0)) soon++;
            }
            FarmGameRules.PushInput in = new FarmGameRules.PushInput(plots, ripe, soon, now.getHour(), settings.n("push_from_hour"), settings.n("push_to_hour"),
                    Duration.between(lastVisit, now).toHours(), ignoredNow, lastPush == null ? 999 : Duration.between(lastPush.toLocalDateTime(), now).toDays(), sentToday != null && sentToday > 0);
            if (!FarmGameRules.shouldPush(in, settings.n("push_backoff_after"), settings.n("push_stop_after"))) continue;
            if (jdbc.update("INSERT IGNORE INTO farm_push_log (user_id, day, sent_at) VALUES (?, ?, ?)", userId, java.sql.Date.valueOf(today), Timestamp.valueOf(now)) != 1) continue;
            jdbc.update("UPDATE farm_profiles SET push_ignored = ? WHERE user_id = ?", ignoredNow + 1, userId);
            Map<String, Object> summary = social.todaySummary(userId);
            StringBuilder body = new StringBuilder("Vườn của bạn có ").append(ripe).append(" ô đã chín, vào thu hoạch nhé!");
            int helped = ((Number) summary.get("helped")).intValue();
            int picked = ((Number) summary.get("picked")).intValue();
            if (helped > 0) body.append(" Hôm nay có ").append(helped).append(" lần hàng xóm giúp bạn.");
            if (picked > 0) body.append(" ").append(picked).append(" bông hoa bị hái lén.");
            notifications.createNotification(userId, "farm_ripe", "Nông trại anyLEARN", body.toString(), "/fun/farm");
            sent++;
        }
        return sent;
    }
}
