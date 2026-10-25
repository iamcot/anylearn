package com.anylearn.backend.service.insights;

import com.anylearn.backend.entity.CourseRequest;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.CourseRequestRepository;
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
public class CourseRequestService {

    private final CourseRequestRepository requests;
    private final UserRepository users;
    private final NotificationService notifications;

    // Requests one phone number may send per 24 hours (spam guard).
    @Value("${app.course-request.daily-limit:3}")
    private int dailyLimit = 3;

    void setDailyLimit(int dailyLimit) {
        this.dailyLimit = dailyLimit;
    }

    public CourseRequest create(CourseRequestInput input, Long userId) {
        CourseRequest request = CourseRequestRules.toRequest(input, userId);
        LocalDateTime now = LocalDateTime.now();
        if (requests.countByContactPhoneAndCreatedAtAfter(request.getContactPhone(), now.minusDays(1)) >= dailyLimit)
            throw new IllegalArgumentException("Bạn đã gửi nhiều yêu cầu trong hôm nay. anyLEARN sẽ liên hệ sớm, vui lòng đợi nhé.");
        request.setCreatedAt(now);
        request.setUpdatedAt(now);
        requests.save(request);
        notifyAdmins(request);
        return request;
    }

    private void notifyAdmins(CourseRequest request) {
        String content = "%s · %s%s".formatted(request.getSubject(), request.getContactPhone(),
                request.getLearnerAge() != null ? " · " + request.getLearnerAge() + " tuổi" : "");
        for (User admin : users.findAdminNotificationRecipients()) {
            try {
                notifications.createNotification(admin.getId(), "system_notif", "Yêu cầu tìm khóa học mới", content,
                        "/admin/course-requests", null);
            } catch (Exception e) {
                log.warn("[course-request] admin {} not notified: {}", admin.getId(), e.getMessage());
            }
        }
    }
}
