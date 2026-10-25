package com.anylearn.backend.service;

import com.anylearn.backend.entity.Notification;
import com.anylearn.backend.repository.NotificationRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

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

    @Autowired(required = false)
    private EmailTemplateService emailTemplateService;

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
        pushToBrowser(userId);
        tryEmailForNotification(userId, type, title, content);
        return n;
    }

    // The browser refetches its notifications as soon as it gets the event, so inside a transaction the event
    // must wait for the commit, otherwise the refetch misses the new row and the bell stays stale until reload.
    void pushToBrowser(Long userId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            sseService.notifyUser(userId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                sseService.notifyUser(userId);
            }
        });
    }

    private void tryEmailForNotification(Long userId, String type, String title, String content) {
        if (emailTemplateService == null) return;
        try {
            if ("order".equals(type)) {
                emailTemplateService.sendToUser(userId, "email-order_success", title,
                    Map.of("userName", "", "orderId", "", "items", content != null ? content : "", "amount", ""));
            } else if ("schedule_reminder".equals(type)) {
                emailTemplateService.sendToUser(userId, "email-schedule_reminder", title,
                    Map.of("userName", "", "itemTitle", content != null ? content : "", "date", "", "scheduleInfo", ""));
            }
        } catch (Exception e) {
            log.warn("[NotificationService] email trigger failed type={}: {}", type, e.getMessage());
        }
    }

    public Notification createScheduledNotification(Long userId, String type, String title,
            String content, String route, String extraContent, LocalDateTime sendAt) {
        if (notificationRepository.existsByUserIdAndTypeAndExtraContent(userId, type, extraContent)) return null;
        Notification n = new Notification();
        n.setUserId(userId);
        n.setType(type);
        n.setTitle(title);
        n.setContent(content);
        n.setRoute(route);
        n.setExtraContent(extraContent);
        n.setIsSend((byte) 0);
        n.setSend(sendAt);
        n.setCreatedAt(LocalDateTime.now());
        n.setUpdatedAt(LocalDateTime.now());
        return notificationRepository.save(n);
    }

    public void dispatchDueNotifications() {
        var due = notificationRepository.findBySendBeforeAndIsSend(LocalDateTime.now(), (byte) 0);
        for (Notification n : due) {
            pushToBrowser(n.getUserId());
            n.setIsSend((byte) 1);
            n.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(n);
        }
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
