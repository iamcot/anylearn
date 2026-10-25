package com.anylearn.backend.service.push;

import com.anylearn.backend.entity.Notification;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class PushPayloadTest {

    @Test
    void usesTheBrandAsTitleWhenTheNotificationHasNone() {
        Notification notification = new Notification();
        notification.setId(5L);
        notification.setContent("Nội dung");

        PushPayload payload = PushPayload.of(notification, 2);

        assertThat(payload.title()).isEqualTo(PushPayload.DEFAULT_TITLE);
        assertThat(payload.tag()).isEqualTo("notif-5");
        assertThat(payload.unread()).isEqualTo(2);
    }

    @Test
    void shortensLongContentToFitThePushLimit() {
        String longText = "a".repeat(PushPayload.MAX_BODY_LENGTH + 50);

        String body = PushPayload.shorten(longText);

        assertThat(body).hasSize(PushPayload.MAX_BODY_LENGTH).endsWith("…");
        assertThat(PushPayload.shorten(null)).isEmpty();
        assertThat(PushPayload.shorten("  ngắn  ")).isEqualTo("ngắn");
    }

    @Test
    void mapsPushServiceStatuses() {
        assertThat(PushOutcome.fromStatus(201)).isEqualTo(PushOutcome.DELIVERED);
        assertThat(PushOutcome.fromStatus(404)).isEqualTo(PushOutcome.GONE);
        assertThat(PushOutcome.fromStatus(410)).isEqualTo(PushOutcome.GONE);
        assertThat(PushOutcome.fromStatus(429)).isEqualTo(PushOutcome.FAILED);
    }
}
