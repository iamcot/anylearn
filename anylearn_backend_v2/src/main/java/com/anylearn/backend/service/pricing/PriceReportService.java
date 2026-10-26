package com.anylearn.backend.service.pricing;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.PriceReport;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.PriceReportRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class PriceReportService {

    private final PriceReportRepository reports;
    private final ItemRepository items;
    private final UserRepository users;
    private final NotificationService notifications;

    // Reports one account or phone number may send per 24 hours (spam guard).
    @Value("${app.price-report.daily-limit:5}")
    private int dailyLimit = 5;

    public PriceReport create(PriceReportInput input, Long userId) {
        PriceReport report = PriceReportRules.toReport(input, userId);
        if (report.getItemId() != null && !items.existsById(report.getItemId())) report.setItemId(null);
        LocalDateTime now = LocalDateTime.now();
        long sentToday = userId != null
                ? reports.countByUserIdAndCreatedAtAfter(userId, now.minusDays(1))
                : reports.countByContactPhoneAndCreatedAtAfter(report.getContactPhone(), now.minusDays(1));
        if (sentToday >= dailyLimit) throw new IllegalArgumentException("Bạn đã gửi nhiều báo giá trong hôm nay. anyLEARN sẽ kiểm tra sớm, cảm ơn bạn.");
        report.setCreatedAt(now);
        report.setUpdatedAt(now);
        reports.save(report);
        notifyAdmins(report);
        return report;
    }

    private void notifyAdmins(PriceReport report) {
        String course = report.getItemId() == null ? "một khóa học"
                : items.findById(report.getItemId()).map(Item::getTitle).orElse("một khóa học");
        String content = course + (report.getSeenPrice() != null ? " · giá thấy: " + report.getSeenPrice() + "đ" : "")
                + (report.getSeenPlace() != null ? " · " + report.getSeenPlace() : "");
        for (User admin : users.findAdminNotificationRecipients()) {
            try {
                notifications.createNotification(admin.getId(), "system_notif", "Có báo giá rẻ hơn nơi khác", content,
                        "/admin/price-reports", null);
            } catch (Exception e) {
                log.warn("[price-report] admin {} not notified: {}", admin.getId(), e.getMessage());
            }
        }
    }
}
