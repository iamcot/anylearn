package com.anylearn.backend.service.notifications;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/** Reads and saves `user_notification_prefs`; every job that sends a notification asks {@link #allows} first. */
@Service
@RequiredArgsConstructor
public class NotificationPrefsService {

    private final JdbcTemplate jdbc;

    /** "topic|channel" of every choice the person switched off. */
    private Set<String> offChoices(Long userId) {
        Set<String> off = new HashSet<>();
        jdbc.query("SELECT topic, channel FROM user_notification_prefs WHERE user_id = ? AND enabled = 0",
                rs -> { off.add(rs.getString("topic") + "|" + rs.getString("channel")); }, userId);
        return off;
    }

    /** Whether a notification of this type may reach the person on this channel. */
    public boolean allows(Long userId, String type, String channel) {
        if (NotificationTopics.topicOf(type) == null) return true;
        return NotificationTopics.allows(offChoices(userId), type, channel);
    }

    /** topic -> channel -> on/off for every topic and channel, defaults on. */
    public Map<String, Map<String, Boolean>> matrix(Long userId) {
        Set<String> off = offChoices(userId);
        Map<String, Map<String, Boolean>> result = new LinkedHashMap<>();
        for (String topic : NotificationTopics.TOPICS) {
            Map<String, Boolean> channels = new LinkedHashMap<>();
            for (String channel : NotificationTopics.CHANNELS) channels.put(channel, !off.contains(topic + "|" + channel));
            result.put(topic, channels);
        }
        return result;
    }

    /** Returns the problem, or null when saved. */
    public String set(Long userId, String topic, String channel, boolean enabled) {
        if (!NotificationTopics.isKnown(topic, channel)) return "Loại thông báo không hợp lệ";
        jdbc.update("INSERT INTO user_notification_prefs (user_id, topic, channel, enabled) VALUES (?, ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE enabled = VALUES(enabled)", userId, topic, channel, enabled ? 1 : 0);
        return null;
    }
}
