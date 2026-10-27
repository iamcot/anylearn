package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.SessionAttendance;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.SessionAttendanceRepository;
import com.anylearn.backend.service.lifecycle.AttendanceRewardService;
import com.anylearn.backend.repository.UserCourseEnrollmentRepository;
import com.anylearn.backend.service.NotificationService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/admin/enrollments")
@RequiredArgsConstructor
public class AdminEnrollmentController {

    private final EntityManager em;
    private final UserCourseEnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;
    private final SessionAttendanceRepository attendanceRepository;
    private final AttendanceRewardService attendanceRewards;

    private static final Map<String, Integer> WD_MAP = Map.of(
        "mon",1,"tue",2,"wed",3,"thu",4,"fri",5,"sat",6,"sun",0);

    private boolean isAdmin(User u) { return u != null && "admin".equals(u.getRole()); }

    @GetMapping("/schedule")
    @SuppressWarnings("unchecked")
    public ApiResponse<?> schedule(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long partnerId,
            @RequestParam String from,
            @RequestParam String to) {

        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");

        LocalDate fromDate = LocalDate.parse(from);
        LocalDate toDate   = LocalDate.parse(to);

        StringBuilder where = new StringBuilder(" WHERE uce.status IN ('active','pending')");
        if (search != null && !search.isBlank()) {
            String s = search.replace("'","").replace("%","");
            where.append(" AND (u.name LIKE '%").append(s).append("%' OR u.phone LIKE '%").append(s).append("%')");
        }
        if (partnerId != null) where.append(" AND i.user_id = ").append(partnerId);

        List<Object[]> rows = em.createNativeQuery("""
            SELECT uce.id, uce.user_id, uce.item_id, uce.schedule_id,
                   uce.start_date, uce.end_date, uce.status,
                   uce.remind_sent_at, uce.remind_count,
                   u.name AS user_name, u.phone AS user_phone,
                   i.title AS item_title, i.seo_url, i.cycle_type, i.cycle_amount,
                   isc.schedule_type, isc.weekdays, isc.time_start, isc.time_end,
                   isc.date_start AS sched_date_start, isc.date_end AS sched_date_end,
                   isc.event_date, isc.title AS schedule_title,
                   pu.id AS partner_id, pu.name AS partner_name
            FROM user_course_enrollments uce
            JOIN users u  ON u.id  = uce.user_id
            JOIN items i  ON i.id  = uce.item_id
            JOIN users pu ON pu.id = i.user_id
            LEFT JOIN item_schedules isc ON isc.id = uce.schedule_id
            """ + where + " ORDER BY uce.id")
                .getResultList();

        List<Map<String, Object>> events = new ArrayList<>();
        Map<Long, Long> scheduleOf = new HashMap<>();

        for (Object[] r : rows) {
            long   enrollId   = toLong(r[0]);
            long   userId     = toLong(r[1]);
            long   itemId     = toLong(r[2]);
            long   scheduleId = toLong(r[3]);
            scheduleOf.put(enrollId, scheduleId);
            String startDate  = r[4] != null ? r[4].toString().substring(0,10) : null;
            String endDate    = r[5] != null ? r[5].toString().substring(0,10) : null;
            String status     = r[6] != null ? r[6].toString() : "";
            String remindAt   = r[7] != null ? r[7].toString() : null;
            int    remindCnt  = r[8] != null ? ((Number)r[8]).intValue() : 0;
            String userName   = str(r[9]);
            String userPhone  = str(r[10]);
            String itemTitle  = str(r[11]);
            String seoUrl     = str(r[12]);
            String cycleType  = str(r[13]);
            String schedType  = str(r[15]);
            String weekdays   = str(r[16]);
            String timeStart  = str(r[17]);
            String timeEnd    = str(r[18]);
            String sdStart    = r[19] != null ? r[19].toString().substring(0,10) : null;
            String sdEnd      = r[20] != null ? r[20].toString().substring(0,10) : null;
            String eventDate  = r[21] != null ? r[21].toString().substring(0,10) : null;
            String schedTitle = str(r[22]);
            long   partId     = toLong(r[23]);
            String partName   = str(r[24]);

            // Determine the effective date range for expansion
            String effStart = startDate != null ? startDate : sdStart;
            String effEnd   = endDate   != null ? endDate   : sdEnd;

            if ("pending".equals(status)) {
                // open/pending — show once as a pending entry on fromDate
                events.add(buildRow(fromDate.toString(), enrollId, userId, itemId,
                    userName, userPhone, itemTitle, seoUrl,
                    schedType, schedTitle, weekdays, timeStart, timeEnd, status,
                    partId, partName, remindAt, remindCnt));
                continue;
            }

            if ("event".equals(schedType)) {
                if (eventDate != null && eventDate.compareTo(from) >= 0 && eventDate.compareTo(to) <= 0) {
                    events.add(buildRow(eventDate, enrollId, userId, itemId,
                        userName, userPhone, itemTitle, seoUrl,
                        schedType, schedTitle, weekdays, timeStart, timeEnd, status,
                        partId, partName, remindAt, remindCnt));
                }
            } else if ("recurring".equals(schedType)) {
                if (weekdays == null || weekdays.isBlank()) continue;
                Set<Integer> days = new HashSet<>();
                for (String w : weekdays.split(",")) { Integer v = WD_MAP.get(w.trim()); if (v != null) days.add(v); }
                for (LocalDate d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
                    String iso = d.toString();
                    if (effStart != null && iso.compareTo(effStart) < 0) continue;
                    if (effEnd   != null && iso.compareTo(effEnd)   > 0) continue;
                    int dow = d.getDayOfWeek().getValue() % 7;
                    if (days.contains(dow)) {
                        events.add(buildRow(iso, enrollId, userId, itemId,
                            userName, userPhone, itemTitle, seoUrl,
                            schedType, schedTitle, weekdays, timeStart, timeEnd, status,
                            partId, partName, remindAt, remindCnt));
                    }
                }
            } else {
                // billing-only (no schedule type) — every day in range
                String billingStart = startDate; String billingEnd = endDate;
                if (billingStart == null) continue;
                for (LocalDate d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
                    String iso = d.toString();
                    if (iso.compareTo(billingStart) < 0) continue;
                    if (billingEnd != null && iso.compareTo(billingEnd) > 0) continue;
                    events.add(buildRow(iso, enrollId, userId, itemId,
                        userName, userPhone, itemTitle, seoUrl,
                        cycleType != null ? "billing" : "", schedTitle, null, null, null, status,
                        partId, partName, remindAt, remindCnt));
                }
            }
        }

        markAttendance(events, scheduleOf, fromDate, toDate);
        events.sort(Comparator.comparing(e -> String.valueOf(e.get("date"))));
        return ApiResponse.ok(events);
    }

    /** Adds scheduleId and `attended` to the class rows (the rows an admin can mark). */
    private void markAttendance(List<Map<String, Object>> events, Map<Long, Long> scheduleOf, LocalDate from, LocalDate to) {
        Set<String> attended = new HashSet<>();
        for (SessionAttendance row : attendanceRepository.findBySessionDateBetween(from, to)) {
            attended.add(row.getLearnerId() + "|" + row.getItemScheduleId() + "|" + row.getSessionDate());
        }
        for (Map<String, Object> event : events) {
            String type = String.valueOf(event.get("scheduleType"));
            if (!"recurring".equals(type) && !"event".equals(type)) continue;
            Long scheduleId = scheduleOf.get(((Number) event.get("enrollmentId")).longValue());
            if (scheduleId == null || scheduleId == 0) continue;
            event.put("scheduleId", scheduleId);
            event.put("attended", attended.contains(event.get("userId") + "|" + scheduleId + "|" + event.get("date")));
        }
    }

    /** Marks or unmarks a learner's attendance of one class day (any day up to today). Body: learnerId, scheduleId, date, attended. */
    @PostMapping("/attendance")
    public ApiResponse<?> setAttendance(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!(body.get("learnerId") instanceof Number learner) || !(body.get("scheduleId") instanceof Number schedule) || !(body.get("date") instanceof String dateText)) {
            return ApiResponse.fail("Thiếu thông tin buổi học");
        }
        LocalDate date;
        try {
            date = LocalDate.parse(dateText);
        } catch (Exception e) {
            return ApiResponse.fail("Ngày không hợp lệ");
        }
        if (date.isAfter(LocalDate.now())) return ApiResponse.fail("Buổi học chưa diễn ra");
        Number enrolled = (Number) em.createNativeQuery(
                "SELECT COUNT(*) FROM user_course_enrollments WHERE user_id = ?1 AND schedule_id = ?2")
                .setParameter(1, learner.longValue()).setParameter(2, schedule.longValue()).getSingleResult();
        if (enrolled.intValue() == 0) return ApiResponse.fail("Học viên không học lớp này");

        var existing = attendanceRepository.findByLearnerIdAndItemScheduleIdAndSessionDate(learner.longValue(), schedule.longValue(), date);
        boolean attended = !Boolean.FALSE.equals(body.get("attended"));
        if (attended && existing.isEmpty()) {
            SessionAttendance row = new SessionAttendance();
            row.setLearnerId(learner.longValue());
            row.setItemScheduleId(schedule.longValue());
            row.setSessionDate(date);
            row.setSource(SessionAttendance.SOURCE_ADMIN);
            row.setCreatedAt(LocalDateTime.now());
            row.setUpdatedAt(LocalDateTime.now());
            attendanceRepository.save(row);
            attendanceRewards.checkLearner(learner.longValue());
        } else if (!attended && existing.isPresent()) {
            attendanceRepository.delete(existing.get());
        }
        return ApiResponse.ok(Map.of("attended", attended));
    }

    @PostMapping("/{id}/remind")
    public ApiResponse<?> remind(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        return enrollmentRepository.findById(id).map(e -> {
            // Fetch item title via entity manager
            List<?> titleRow = em.createNativeQuery(
                "SELECT i.title, i.seo_url, i.id FROM items i JOIN user_course_enrollments uce ON uce.item_id = i.id WHERE uce.id = ?1")
                .setParameter(1, id).getResultList();
            String itemTitle = titleRow.isEmpty() ? "khóa học của bạn" : ((Object[])titleRow.get(0))[0].toString();
            String link = "/account/schedule";

            try {
                notificationService.createNotification(e.getUserId(), "schedule_reminder",
                        "Nhắc nhở lịch học",
                        "Bạn có lịch học " + itemTitle + " sắp diễn ra. Hãy chuẩn bị nhé!",
                        link, null);
                e.setRemindSentAt(LocalDateTime.now());
                e.setRemindCount((e.getRemindCount() != null ? e.getRemindCount() : 0) + 1);
                e.setUpdatedAt(LocalDateTime.now());
                enrollmentRepository.save(e);
                return ApiResponse.ok("Đã gửi nhắc nhở");
            } catch (Exception ex) {
                return ApiResponse.fail("Gửi thất bại: " + ex.getMessage());
            }
        }).orElse(ApiResponse.fail("Không tìm thấy"));
    }

    private Map<String, Object> buildRow(String date, long enrollId, long userId, long itemId,
            String userName, String userPhone, String itemTitle, String seoUrl,
            String schedType, String schedTitle, String weekdays,
            String timeStart, String timeEnd, String status,
            long partnerId, String partnerName, String remindAt, int remindCount) {
        var m = new LinkedHashMap<String, Object>();
        m.put("date", date);
        m.put("enrollmentId", enrollId);
        m.put("userId", userId);
        m.put("itemId", itemId);
        m.put("userName", userName != null ? userName : "");
        m.put("userPhone", userPhone != null ? userPhone : "");
        m.put("itemTitle", itemTitle != null ? itemTitle : "");
        m.put("seoUrl", seoUrl);
        m.put("scheduleType", schedType != null ? schedType : "");
        m.put("scheduleTitle", schedTitle);
        m.put("weekdays", weekdays);
        m.put("timeStart", timeStart);
        m.put("timeEnd", timeEnd);
        m.put("status", status);
        m.put("partnerId", partnerId);
        m.put("partnerName", partnerName != null ? partnerName : "");
        m.put("remindSentAt", remindAt);
        m.put("remindCount", remindCount);
        return m;
    }

    private String str(Object o) { return o != null ? o.toString() : null; }
    private long toLong(Object o) { return o == null ? 0 : ((Number) o).longValue(); }
}
