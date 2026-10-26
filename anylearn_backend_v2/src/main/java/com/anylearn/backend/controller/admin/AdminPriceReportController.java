package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.PriceReport;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.PriceReportRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.insights.SearchLogPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/admin/price-reports")
@RequiredArgsConstructor
public class AdminPriceReportController {

    private static final int LIST_LIMIT = 300;
    private static final int MAX_ADMIN_NOTE = 500;

    private final PriceReportRepository reports;
    private final NotificationService notifications;

    @GetMapping
    public ApiResponse<?> list(@AuthenticationPrincipal User user, @RequestParam(required = false) String status) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String filter = status == null || status.isBlank() ? null : status;
        return ApiResponse.ok(reports.findForAdmin(filter, PageRequest.of(0, LIST_LIMIT)));
    }

    @PutMapping("/{id}")
    public ApiResponse<?> update(@AuthenticationPrincipal User user, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        if (!isAdmin(user)) return ApiResponse.fail("Forbidden");
        String status = body.get("status") instanceof String s ? s : null;
        if (status == null || !PriceReport.STATUSES.contains(status)) return ApiResponse.fail("Trạng thái không hợp lệ");

        return reports.findById(id).map(report -> {
            boolean newlyFixed = PriceReport.STATUS_FIXED.equals(status) && !PriceReport.STATUS_FIXED.equals(report.getStatus());
            report.setStatus(status);
            report.setAdminNote(SearchLogPolicy.clean(body.get("adminNote") instanceof String n ? n : null, MAX_ADMIN_NOTE));
            report.setHandledBy(user.getId());
            report.setUpdatedAt(LocalDateTime.now());
            reports.save(report);
            if (newlyFixed) thankReporter(report);
            return ApiResponse.ok(Map.of("id", report.getId(), "status", report.getStatus()));
        }).orElse(ApiResponse.fail("Không tìm thấy báo giá"));
    }

    // Only a reporter with an account hears back in the app; the others are called on the number they left.
    private void thankReporter(PriceReport report) {
        if (report.getUserId() == null) return;
        notifications.createNotification(report.getUserId(), "system_notif", "Cảm ơn bạn đã báo giá",
                "anyLEARN đã kiểm tra và điều chỉnh giá theo báo cáo của bạn. Giá trên anyLEARN luôn bằng hoặc rẻ hơn.",
                report.getItemId() != null ? "/pdp" : "/search", report.getItemId() != null ? String.valueOf(report.getItemId()) : null);
    }

    private boolean isAdmin(User u) {
        return u != null && "admin".equals(u.getRole());
    }
}
