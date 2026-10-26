package com.anylearn.backend.service.notifications;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Which notification types a person can switch off, grouped in topics (plan 06.4). A type that is not listed (an order was
 * paid, an answer to a review, anything for the back office team) is transactional: it is always sent.
 */
public final class NotificationTopics {

    public static final String APP = "app";
    public static final String EMAIL = "email";
    public static final String ZALO = "zalo";
    public static final List<String> CHANNELS = List.of(APP, EMAIL, ZALO);

    public static final List<String> TOPICS = List.of("schedule", "payment", "renewal", "review", "promo");

    private static final Map<String, String> TOPIC_OF_TYPE = Map.of(
            "schedule_reminder", "schedule",
            "schedule_pending", "schedule",
            "order_reminder", "payment",
            "schedule_renewal", "renewal",
            "review_reminder", "review",
            "new_course", "promo");

    private NotificationTopics() {}

    /** The topic of a notification type, or null when the type cannot be switched off. */
    public static String topicOf(String type) {
        return type == null ? null : TOPIC_OF_TYPE.get(type);
    }

    public static boolean isKnown(String topic, String channel) {
        return TOPICS.contains(topic) && CHANNELS.contains(channel);
    }

    /** `off` holds "topic|channel" of every switched off choice. Everything is on unless it is in there. */
    public static boolean allows(Set<String> off, String type, String channel) {
        String topic = topicOf(type);
        return topic == null || !off.contains(topic + "|" + channel);
    }
}
