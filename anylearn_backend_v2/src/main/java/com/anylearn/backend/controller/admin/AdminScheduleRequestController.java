package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.ScheduleRequest;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ScheduleRequestRepository;
import com.anylearn.backend.service.NotificationService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/admin/schedule-requests")
@RequiredArgsConstructor
public class AdminScheduleRequestController {

    private static final Set<String> DECISIONS = Set.of(ScheduleRequest.STATUS_APPROVED, ScheduleRequest.STATUS_REJECTED);
    private static final Map<String, String> TYPE_NAMES = Map.of(
            ScheduleRequest.TYPE_LEAVE, "xin nghỉ",
            ScheduleRequest.TYPE_RESCHEDULE, "đổi lịch",
            ScheduleRequest.TYPE_MAKEUP, "học bù");

    private final EntityManager em;
    private final ScheduleRequestRepository requests;
    private final NotificationService notifications;

    @GetMapping
    @SuppressWarnings("unchecked")
    public ApiResponse<?> list(@AuthenticationPrincipal User user, @RequestParam(required = false) String status) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        List<Object[]> rows = em.createNativeQuery("""
                SELECT r.id, r.status, r.type, r.note, r.admin_note, r.session_date, r.created_at, r.handled_at,
                       r.learner_id, l.name AS learner_name, a.name AS account_name, a.phone AS account_phone,
                       i.title AS item_title, isc.time_start, isc.time_end
                FROM schedule_requests r
                JOIN users l ON l.id = r.learner_id
                JOIN users a ON a.id = r.account_id
                JOIN item_schedules isc ON isc.id = r.item_schedule_id
                JOIN items i ON i.id = isc.item_id
                WHERE (:status IS NULL OR r.status = :status)
                ORDER BY (r.status = 'pending') DESC, r.created_at DESC
                LIMIT 300
                """)
                .setParameter("status", status == null || status.isBlank() ? null : status)
                .getResultList();
        return ApiResponse.ok(rows.stream().map(this::toMap).toList());
    }

    @PutMapping("/{id}")
    public ApiResponse<?> decide(@AuthenticationPrincipal User user, @PathVariable Long id,
                                 @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String decision = body.get("status") instanceof String s ? s : null;
        if (decision == null || !DECISIONS.contains(decision)) return ApiResponse.fail("Trạng thái không hợp lệ");
        return requests.findById(id).map(request -> {
            if (!ScheduleRequest.STATUS_PENDING.equals(request.getStatus())) return ApiResponse.fail("Yêu cầu này đã được xử lý");
            save(request, decision, body.get("adminNote") instanceof String n ? n : null, user);
            notifyRequester(request);
            return ApiResponse.ok(Map.of("id", request.getId(), "status", request.getStatus()));
        }).orElse(ApiResponse.fail("Không tìm thấy yêu cầu"));
    }

    private void save(ScheduleRequest request, String decision, String adminNote, User admin) {
        LocalDateTime now = LocalDateTime.now();
        request.setStatus(decision);
        request.setAdminNote(adminNote != null && adminNote.length() > 500 ? adminNote.substring(0, 500) : adminNote);
        request.setHandledBy(admin.getId());
        request.setHandledAt(now);
        request.setUpdatedAt(now);
        requests.save(request);
    }

    private void notifyRequester(ScheduleRequest request) {
        boolean approved = ScheduleRequest.STATUS_APPROVED.equals(request.getStatus());
        String content = "Yêu cầu %s ngày %02d/%02d %s.%s".formatted(
                TYPE_NAMES.get(request.getType()), request.getSessionDate().getDayOfMonth(),
                request.getSessionDate().getMonthValue(), approved ? "đã được chấp nhận" : "chưa thể thực hiện",
                request.getAdminNote() != null ? " Ghi chú: " + request.getAdminNote() : "");
        notifications.createNotification(request.getAccountId(), "system_notif",
                "Phản hồi yêu cầu của bạn", content, "/today?child=" + request.getLearnerId(), null);
    }

    private Map<String, Object> toMap(Object[] r) {
        Map<String, Object> m = new LinkedHashMap<>();
        String[] keys = {"id", "status", "type", "note", "adminNote", "sessionDate", "createdAt", "handledAt",
                "learnerId", "learnerName", "accountName", "accountPhone", "itemTitle", "timeStart", "timeEnd"};
        for (int i = 0; i < keys.length; i++) m.put(keys[i], r[i] != null ? r[i].toString() : null);
        return m;
    }

    private boolean isAdmin(User u) {
        return u != null && "admin".equals(u.getRole());
    }
}
