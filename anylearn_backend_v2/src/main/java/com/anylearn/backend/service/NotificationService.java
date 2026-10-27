package com.anylearn.backend.service;

import com.anylearn.backend.entity.Notification;
import com.anylearn.backend.repository.NotificationRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.notifications.NotificationPrefsService;
import com.anylearn.backend.service.notifications.NotificationTopics;
import com.anylearn.backend.service.push.WebPushService;
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

    // Types handled by other channels (SMS, Zalo ZNS): never shown in the bell or sent as push.
    public static final List<String> EXCLUDED_TYPES = List.of("sms", "zalo");

    private final NotificationRepository notificationRepository;
    private final NotificationSseService sseService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @Autowired(required = false)
    private EmailTemplateService emailTemplateService;

    @Autowired(required = false)
    private WebPushService webPushService;

    // Per person, per topic and channel switches (plan 06.4). Absent in unit tests: then everything is allowed.
    @Autowired(required = false)
    private NotificationPrefsService prefs;

    @Autowired(required = false)
    private com.anylearn.backend.config.PaymentConfig paymentConfig;

    private boolean allowed(Long userId, String type, String channel) {
        return prefs == null || prefs.allows(userId, type, channel);
    }

    public Notification createNotification(Long userId, String type, String title, String content, String route) {
        return createNotification(userId, type, title, content, route, null);
    }

    /** Returns the saved notification, or null when the person switched this kind off (the bell and push both stay quiet). */
    public Notification createNotification(Long userId, String type, String title, String content, String route, String extraContent) {
        if (!allowed(userId, type, NotificationTopics.APP)) return null;
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
        pushToDevices(n);
        return n;
    }

    // The browser refetches its notifications as soon as it gets the event, so inside a transaction the event
    // must wait for the commit, otherwise the refetch misses the new row and the bell stays stale until reload.
    void pushToBrowser(Long userId) {
        runAfterCommit(() -> sseService.notifyUser(userId));
    }

    // Web Push reaches phones with the app closed. Same commit rule: a rolled back notification is never sent.
    void pushToDevices(Notification notification) {
        if (webPushService == null || EXCLUDED_TYPES.contains(notification.getType())) return;
        runAfterCommit(() -> webPushService.sendNotification(notification));
    }

    private static void runAfterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }

    public Notification createScheduledNotification(Long userId, String type, String title,
            String content, String route, String extraContent, LocalDateTime sendAt) {
        if (!allowed(userId, type, NotificationTopics.APP)) return null;
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
            if (!allowed(n.getUserId(), n.getType(), NotificationTopics.APP)) {
                // Switched off after it was scheduled: it never shows.
                notificationRepository.delete(n);
                continue;
            }
            pushToBrowser(n.getUserId());
            pushToDevices(n);
            n.setIsSend((byte) 1);
            n.setUpdatedAt(LocalDateTime.now());
            notificationRepository.save(n);
            if ("schedule_renewal".equals(n.getType())) {
                String base = paymentConfig == null ? "" : paymentConfig.getFrontendUrl();
                emailTemplate(n.getUserId(), n.getType(), "email-lifecycle_renew", n.getTitle(),
                        Map.of("title", String.valueOf(n.getTitle()), "message", String.valueOf(n.getContent()),
                                "ctaUrl", base + (n.getRoute() == null ? "/today" : n.getRoute())));
            }
            if ("schedule_reminder".equals(n.getType())) {
                emailTemplate(n.getUserId(), n.getType(), "email-schedule_reminder", n.getTitle(),
                        Map.of("itemTitle", String.valueOf(n.getContent()), "date", "", "scheduleInfo", "Mở lịch học để xem chi tiết"));
            }
        }
    }

    /** Email from an admin-editable template to a person; skipped when they switched the email channel of this type off or have no address. */
    public void emailTemplate(Long userId, String type, String templateKey, String subject, Map<String, String> vars) {
        if (emailTemplateService == null || !allowed(userId, type, NotificationTopics.EMAIL)) return;
        try {
            emailTemplateService.sendToUser(userId, templateKey, subject, vars);
        } catch (Exception e) {
            log.warn("[NotificationService] email {} failed for user {}: {}", templateKey, userId, e.getMessage());
        }
    }

    /** Email every back office recipient with the generic notice template (the in-app notification is separate). */
    public void emailAdmins(String subject, String content) {
        emailAdmins(subject, "email-admin_notice", Map.of("title", subject, "content", content));
    }

    public void emailAdmins(String subject, String templateKey, Map<String, String> vars) {
        if (emailTemplateService == null) return;
        try {
            emailTemplateService.sendToAdmins(subject, templateKey, vars);
        } catch (Exception e) {
            log.warn("[NotificationService] admin email {} failed: {}", templateKey, e.getMessage());
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
