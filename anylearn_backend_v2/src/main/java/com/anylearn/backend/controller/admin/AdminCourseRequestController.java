package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.CourseRequest;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.CourseRequestRepository;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.insights.SearchLogPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/course-requests")
@RequiredArgsConstructor
public class AdminCourseRequestController {

    private static final int LIST_LIMIT = 300;
    private static final int MAX_ADMIN_NOTE = 500;

    private final CourseRequestRepository requests;
    private final ItemRepository items;
    private final NotificationService notifications;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user, @RequestParam(required = false) String status) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String filter = status == null || status.isBlank() ? null : status;
        return ApiResponse.ok(requests.findForAdmin(filter, PageRequest.of(0, LIST_LIMIT)));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String status = body.get("status") instanceof String s ? s : null;
        if (status == null || !CourseRequest.STATUSES.contains(status)) return ApiResponse.fail("Trạng thái không hợp lệ");
        Long matchedItemId = body.get("matchedItemId") instanceof Number n ? n.longValue() : null;
        if (CourseRequest.STATUS_MATCHED.equals(status) && (matchedItemId == null || !items.existsById(matchedItemId)))
            return ApiResponse.fail("Chọn khóa học đã tìm được (nhập đúng mã khóa học)");

        return requests.findById(id).map(request -> {
            boolean newlyMatched = CourseRequest.STATUS_MATCHED.equals(status)
                    && !CourseRequest.STATUS_MATCHED.equals(request.getStatus());
            request.setStatus(status);
            request.setMatchedItemId(CourseRequest.STATUS_MATCHED.equals(status) ? matchedItemId : null);
            request.setAdminNote(SearchLogPolicy.clean(body.get("adminNote") instanceof String n ? n : null, MAX_ADMIN_NOTE));
            request.setHandledBy(user.getId());
            request.setUpdatedAt(LocalDateTime.now());
            requests.save(request);
            if (newlyMatched) notifyRequester(request);
            return ApiResponse.ok(Map.of("id", request.getId(), "status", request.getStatus()));
        }).orElse(ApiResponse.fail("Không tìm thấy yêu cầu"));
    }

    // Only a visitor with an account can get this; the others are called on the phone number they left.
    private void notifyRequester(CourseRequest request) {
        if (request.getUserId() == null) return;
        notifications.createNotification(request.getUserId(), "system_notif", "anyLEARN đã tìm được khóa học cho bạn",
                "Khóa học phù hợp với yêu cầu \"" + request.getSubject() + "\" đã sẵn sàng. Bấm để xem.",
                "/pdp", String.valueOf(request.getMatchedItemId()));
    }

    private boolean isAdmin(User u) {
        return u != null && "admin".equals(u.getRole());
    }
}
