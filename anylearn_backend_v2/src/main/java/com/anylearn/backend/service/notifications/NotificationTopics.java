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

    public static final List<String> TOPICS = List.of("schedule", "payment", "renewal", "review", "promo", "points", "fun");

    private static final Map<String, String> TOPIC_OF_TYPE = Map.ofEntries(
            Map.entry("schedule_reminder", "schedule"),
            Map.entry("schedule_pending", "schedule"),
            Map.entry("order_reminder", "payment"),
            Map.entry("schedule_renewal", "renewal"),
            Map.entry("review_reminder", "review"),
            Map.entry("new_course", "promo"),
            Map.entry("lifecycle_start", "schedule"),
            Map.entry("lifecycle_absent", "schedule"),
            Map.entry("lifecycle_survey", "review"),
            Map.entry("points_expiring", "points"),
            Map.entry("achievement", "fun"),
            Map.entry("quiz_board_reward", "fun"),
            Map.entry("arena_reminder", "fun"),
            Map.entry("arena_result", "fun"),
            Map.entry("arena_reward", "fun"),
            Map.entry("video_study_reminder", "schedule"),
            Map.entry("video_idle", "schedule"),
            Map.entry("video_suggest", "promo"));

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
