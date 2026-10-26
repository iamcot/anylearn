package com.anylearn.backend.service.push;

import com.anylearn.backend.config.PushConfig;
import com.anylearn.backend.entity.Notification;
import com.anylearn.backend.entity.PushSubscription;
import com.anylearn.backend.repository.NotificationRepository;
import com.anylearn.backend.repository.PushSubscriptionRepository;
import com.anylearn.backend.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@Slf4j
@RequiredArgsConstructor
public class WebPushService {

    // A subscription that keeps failing (not 404/410) is dropped after this many sends in a row.
    static final int MAX_FAILURES = 5;
    static final int MAX_PLATFORM_LENGTH = 20;

    private final PushConfig config;
    private final PushSubscriptionRepository subscriptions;
    private final NotificationRepository notifications;
    private final PushTransport transport;
    private final ObjectMapper objectMapper;

    public boolean isEnabled() {
        return config.isEnabled();
    }

    public String publicKey() {
        return isEnabled() ? config.getVapidPublicKey() : null;
    }

    // One device belongs to the last account that subscribed on it (a shared family phone switching accounts).
    @Transactional
    public void subscribe(Long userId, PushSubscribeRequest request) {
        String hash = hash(request.endpoint());
        PushSubscription subscription = subscriptions.findByEndpointHash(hash).orElseGet(PushSubscription::new);
        LocalDateTime now = LocalDateTime.now();
        if (subscription.getId() == null) {
            subscription.setEndpoint(request.endpoint());
            subscription.setEndpointHash(hash);
            subscription.setCreatedAt(now);
        }
        subscription.setUserId(userId);
        subscription.setP256dh(request.keys().p256dh());
        subscription.setAuth(request.keys().auth());
        subscription.setPlatform(limit(request.platform()));
        subscription.setStandalone(Boolean.TRUE.equals(request.standalone()));
        subscription.setFailureCount(0);
        subscription.setUpdatedAt(now);
        subscriptions.save(subscription);
    }

    @Transactional
    public void unsubscribe(Long userId, String endpoint) {
        if (endpoint == null || endpoint.isBlank()) return;
        subscriptions.findByEndpointHash(hash(endpoint))
                .filter(subscription -> subscription.getUserId().equals(userId))
                .ifPresent(subscriptions::delete);
    }

    @Async("pushExecutor")
    public void sendNotification(Notification notification) {
        if (!isEnabled()) return;
        long unread = notifications.countByUserIdAndReadIsNullAndTypeNotIn(
                notification.getUserId(), NotificationService.EXCLUDED_TYPES);
        sendToUser(notification.getUserId(), PushPayload.of(notification, unread));
    }

    public int sendTest(Long userId) {
        long unread = notifications.countByUserIdAndReadIsNullAndTypeNotIn(userId, NotificationService.EXCLUDED_TYPES);
        return sendToUser(userId, PushPayload.test(unread));
    }

    // Returns how many devices accepted the message.
    int sendToUser(Long userId, PushPayload payload) {
        if (!isEnabled()) return 0;
        byte[] body = toJson(payload);
        if (body == null) return 0;
        int delivered = 0;
        for (PushSubscription subscription : subscriptions.findByUserId(userId)) {
            if (deliver(subscription, body) == PushOutcome.DELIVERED) delivered++;
        }
        return delivered;
    }

    PushOutcome deliver(PushSubscription subscription, byte[] body) {
        PushOutcome outcome;
        try {
            outcome = PushOutcome.fromStatus(transport.send(subscription, body));
        } catch (Exception e) {
            log.warn("[push] send failed subscription={}: {}", subscription.getId(), e.getMessage());
            outcome = PushOutcome.FAILED;
        }
        record(subscription, outcome);
        return outcome;
    }

    private void record(PushSubscription subscription, PushOutcome outcome) {
        switch (outcome) {
            case DELIVERED -> {
                subscription.setFailureCount(0);
                subscription.setLastSuccessAt(LocalDateTime.now());
                subscriptions.save(subscription);
            }
            case GONE -> subscriptions.delete(subscription);
            case FAILED -> {
                int failures = subscription.getFailureCount() + 1;
                if (failures >= MAX_FAILURES) {
                    subscriptions.delete(subscription);
                    return;
                }
                subscription.setFailureCount(failures);
                subscriptions.save(subscription);
            }
        }
    }

    private byte[] toJson(PushPayload payload) {
        try {
            return objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("[push] cannot serialise payload: {}", e.getMessage());
            return null;
        }
    }

    private static String limit(String platform) {
        if (platform == null) return null;
        return platform.length() <= MAX_PLATFORM_LENGTH ? platform : platform.substring(0, MAX_PLATFORM_LENGTH);
    }

    static String hash(String endpoint) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(endpoint.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
