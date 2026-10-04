package com.anylearn.backend.service;

import com.anylearn.backend.entity.Notification;
import com.anylearn.backend.repository.NotificationRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class NotificationService {

    private static final List<String> EXCLUDED_TYPES = List.of("sms", "zalo");

    private final NotificationRepository notificationRepository;
    private final NotificationSseService sseService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    public Notification createNotification(Long userId, String type, String title, String content, String route) {
        return createNotification(userId, type, title, content, route, null);
    }

    public Notification createNotification(Long userId, String type, String title, String content, String route, String extraContent) {
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setContent(content);
        n.setRoute(route);
        n.setExtraContent(extraContent);
        n.setIsSend((byte) 1);
        n.setCreatedAt(LocalDateTime.now());
        n.setUpdatedAt(LocalDateTime.now());
        notificationRepository.save(n);
        sseService.notifyUser(userId);
        return n;
    }

    public void sendEmailNotification(Long userId, String subject, String htmlBody) {
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getEmail() != null && !user.getEmail().isBlank()) {
                emailService.sendEmail(user.getEmail(), subject, htmlBody);
            }
        });
    }

    public Map<String, Object> getUserNotifications(Long userId, int page) {
        var pageable = PageRequest.of(page, 20);
        List<Notification> items = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        long unread = notificationRepository.countByUserIdAndReadIsNullAndTypeNotIn(userId, EXCLUDED_TYPES);
        return Map.of("items", items, "unread", unread, "page", page);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadIsNullAndTypeNotIn(userId, EXCLUDED_TYPES);
    }

    @Transactional
    public void markAsRead(Long notifId, Long userId) {
        notificationRepository.findById(notifId).ifPresent(n -> {
            if (n.getUserId().equals(userId) && n.getRead() == null) {
                n.setRead(LocalDateTime.now());
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllReadByUserId(userId, LocalDateTime.now(), EXCLUDED_TYPES);
    }
}
