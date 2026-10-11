package com.anylearn.backend.service;

import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduleNotificationService {

    private final UserCourseEnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    private static final Map<String, Integer> WEEKDAY_MAP = Map.of(
            "mon", 1, "tue", 2, "wed", 3, "thu", 4, "fri", 5, "sat", 6, "sun", 0
    );

    // ── Scanner: runs every hour, schedules future notifications ────────────

    @Scheduled(fixedDelay = 60 * 60 * 1000)
    @Transactional
    public void scan() {
        log.debug("LoyalEngine: scanning enrollments...");
        scanUpcomingSessions();
        scanPendingEnrollments();
        scanRenewals();
    }

    private void scanUpcomingSessions() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        int tomorrowDow = tomorrow.getDayOfWeek() == DayOfWeek.SUNDAY ? 0 : tomorrow.getDayOfWeek().getValue(); // 1=Mon..6=Sat,0=Sun

        var enrollments = enrollmentRepository.findAllActiveEnrollmentsWithSchedule();
        for (var e : enrollments) {
            Long userId = toLong(e.get("user_id"));
            Long eid = toLong(e.get("id"));
            String scheduleType = str(e, "schedule_type");
            String itemTitle = str(e, "item_title");
            String timeStart = str(e, "time_start");
            String dedup = "eid:" + eid + ":date:" + tomorrow;
            LocalDateTime sendAt = tomorrow.atTime(8, 0);

            boolean hasTomorrow = false;
            if ("event".equals(scheduleType)) {
                Object evDate = e.get("event_date");
                hasTomorrow = evDate != null && tomorrow.toString().equals(evDate.toString());
            } else if ("recurring".equals(scheduleType) || "open".equals(scheduleType)) {
                String weekdays = str(e, "weekdays");
                LocalDate startDate = toDate(e.get("start_date") != null ? e.get("start_date") : e.get("date_start"));
                LocalDate endDate = toDate(e.get("end_date") != null ? e.get("end_date") : e.get("date_end"));
                if (weekdays != null && (startDate == null || !tomorrow.isBefore(startDate))
                        && (endDate == null || !tomorrow.isAfter(endDate))) {
                    Set<Integer> days = new HashSet<>();
                    for (String d : weekdays.split(",")) { Integer v = WEEKDAY_MAP.get(d.trim().toLowerCase()); if (v != null) days.add(v); }
                    hasTomorrow = days.contains(tomorrowDow);
                }
            }

            if (hasTomorrow && userId != null) {
                String content = itemTitle + (timeStart != null ? " lúc " + timeStart : "") + " vào ngày mai";
                notificationService.createScheduledNotification(
                        userId, "schedule_reminder", "Nhắc lịch học", content, "/account/schedule", dedup, sendAt);
            }
        }
    }

    private void scanPendingEnrollments() {
        var pending = enrollmentRepository.findPendingOpenEnrollments();
        for (var e : pending) {
            Long userId = toLong(e.get("user_id"));
            Long eid = toLong(e.get("id"));
            String itemTitle = str(e, "item_title");
            String dedup = "pending-eid:" + eid + ":date:" + LocalDate.now();
            notificationService.createScheduledNotification(
                    userId, "schedule_pending", "Chọn ngày bắt đầu học",
                    "Bạn chưa chọn ngày bắt đầu cho " + itemTitle + ". Chọn ngay →",
                    "/account/schedule", dedup, LocalDateTime.now().plusHours(1));
        }
    }

    private void scanRenewals() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        var renewals = enrollmentRepository.findEnrollmentsEndingSoon(tomorrow);
        for (var e : renewals) {
            Long userId = toLong(e.get("user_id"));
            Long eid = toLong(e.get("id"));
            String itemTitle = str(e, "item_title");
            Object endDate = e.get("end_date");
            String dedup = "renewal-eid:" + eid;
            notificationService.createScheduledNotification(
                    userId, "schedule_renewal", "Sắp kết thúc khóa học",
                    itemTitle + " kết thúc vào " + endDate + ". Gia hạn để tiếp tục →",
                    "/account/schedule", dedup, LocalDateTime.now().plusHours(2));
        }
    }

    // ── Dispatcher: runs every 5 minutes, fires due notifications ────────────

    @Scheduled(fixedDelay = 5 * 60 * 1000)
    @Transactional
    public void dispatch() {
        notificationService.dispatchDueNotifications();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Long toLong(Object v) { return v == null ? null : ((Number) v).longValue(); }
    private String str(Map<String, Object> m, String k) { Object v = m.get(k); return v != null ? v.toString() : null; }
    private LocalDate toDate(Object v) {
        if (v == null) return null;
        try { return LocalDate.parse(v.toString().substring(0, 10)); } catch (Exception e) { return null; }
    }
}
