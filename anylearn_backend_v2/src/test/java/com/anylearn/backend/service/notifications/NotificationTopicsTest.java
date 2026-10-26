package com.anylearn.backend.service.notifications;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationTopicsTest {

    @Test
    void mapsTypesToTopics() {
        assertThat(NotificationTopics.topicOf("order_reminder")).isEqualTo("payment");
        assertThat(NotificationTopics.topicOf("schedule_reminder")).isEqualTo("schedule");
        assertThat(NotificationTopics.topicOf("new_course")).isEqualTo("promo");
    }

    @Test
    void transactionalTypesHaveNoTopicAndAreAlwaysAllowed() {
        assertThat(NotificationTopics.topicOf("order")).isNull();
        assertThat(NotificationTopics.topicOf("system_notif")).isNull();
        assertThat(NotificationTopics.allows(Set.of("payment|app", "payment|email"), "order", "app")).isTrue();
    }

    @Test
    void aSwitchedOffChoiceBlocksOnlyThatTopicAndChannel() {
        Set<String> off = Set.of("promo|app");
        assertThat(NotificationTopics.allows(off, "new_course", "app")).isFalse();
        assertThat(NotificationTopics.allows(off, "new_course", "email")).isTrue();
        assertThat(NotificationTopics.allows(off, "order_reminder", "app")).isTrue();
        assertThat(NotificationTopics.allows(Set.of(), "new_course", "app")).isTrue();
    }

    @Test
    void knownChoicesOnly() {
        assertThat(NotificationTopics.isKnown("promo", "email")).isTrue();
        assertThat(NotificationTopics.isKnown("chat", "app")).isFalse();
        assertThat(NotificationTopics.isKnown("promo", "sms")).isFalse();
    }
}
