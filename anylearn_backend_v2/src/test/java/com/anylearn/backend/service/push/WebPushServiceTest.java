package com.anylearn.backend.service.push;

import com.anylearn.backend.config.PushConfig;
import com.anylearn.backend.entity.Notification;
import com.anylearn.backend.entity.PushSubscription;
import com.anylearn.backend.repository.NotificationRepository;
import com.anylearn.backend.repository.PushSubscriptionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class WebPushServiceTest {

    private PushConfig config;
    private PushSubscriptionRepository subscriptions;
    private NotificationRepository notifications;
    private PushTransport transport;
    private WebPushService service;

    @BeforeEach
    void setUp() {
        config = new PushConfig();
        config.setVapidPublicKey("public");
        config.setVapidPrivateKey("private");
        subscriptions = mock(PushSubscriptionRepository.class);
        notifications = mock(NotificationRepository.class);
        transport = mock(PushTransport.class);
        service = new WebPushService(config, subscriptions, notifications, transport, new ObjectMapper());
    }

    private static PushSubscription device(long id, int failures) {
        PushSubscription subscription = new PushSubscription();
        subscription.setId(id);
        subscription.setUserId(7L);
        subscription.setEndpoint("https://push.example/" + id);
        subscription.setP256dh("key");
        subscription.setAuth("auth");
        subscription.setFailureCount(failures);
        return subscription;
    }

    @Test
    void deliversToEveryDeviceOfTheUser() throws Exception {
        when(subscriptions.findByUserId(7L)).thenReturn(List.of(device(1, 0), device(2, 0)));
        when(transport.send(any(), any())).thenReturn(201);

        int delivered = service.sendToUser(7L, PushPayload.test(3));

        assertThat(delivered).isEqualTo(2);
        verify(transport, times(2)).send(any(), any());
    }

    @Test
    void sendsTheNotificationAsJsonWithTheUnreadCount() throws Exception {
        PushSubscription phone = device(1, 0);
        when(subscriptions.findByUserId(7L)).thenReturn(List.of(phone));
        when(notifications.countByUserIdAndReadIsNullAndTypeNotIn(eq(7L), anyList())).thenReturn(4L);
        when(transport.send(any(), any())).thenReturn(201);
        Notification notification = new Notification();
        notification.setId(99L);
        notification.setUserId(7L);
        notification.setTitle("Đơn hàng thành công");
        notification.setContent("Đơn hàng #2814 đã được xác nhận.");
        notification.setRoute("/orders");

        service.sendNotification(notification);

        ArgumentCaptor<byte[]> body = ArgumentCaptor.forClass(byte[].class);
        verify(transport).send(eq(phone), body.capture());
        String json = new String(body.getValue(), StandardCharsets.UTF_8);
        assertThat(json).contains("\"title\":\"Đơn hàng thành công\"", "\"notificationId\":99",
                "\"route\":\"/orders\"", "\"unread\":4", "\"tag\":\"notif-99\"");
    }

    @Test
    void resetsFailuresAfterADelivery() throws Exception {
        PushSubscription phone = device(1, 3);
        when(transport.send(any(), any())).thenReturn(201);

        service.deliver(phone, new byte[0]);

        assertThat(phone.getFailureCount()).isZero();
        assertThat(phone.getLastSuccessAt()).isNotNull();
        verify(subscriptions).save(phone);
    }

    @Test
    void deletesADeviceThePushServiceNoLongerKnows() throws Exception {
        PushSubscription phone = device(1, 0);
        when(transport.send(any(), any())).thenReturn(410);

        assertThat(service.deliver(phone, new byte[0])).isEqualTo(PushOutcome.GONE);
        verify(subscriptions).delete(phone);
    }

    @Test
    void countsFailuresAndDropsTheDeviceAtTheLimit() throws Exception {
        PushSubscription flaky = device(1, 0);
        when(transport.send(any(), any())).thenReturn(500);
        service.deliver(flaky, new byte[0]);
        assertThat(flaky.getFailureCount()).isEqualTo(1);
        verify(subscriptions).save(flaky);

        PushSubscription dying = device(2, WebPushService.MAX_FAILURES - 1);
        when(transport.send(eq(dying), any())).thenThrow(new RuntimeException("timeout"));
        service.deliver(dying, new byte[0]);
        verify(subscriptions).delete(dying);
    }

    @Test
    void sendsNothingWithoutVapidKeys() throws Exception {
        config.setVapidPrivateKey("");

        assertThat(service.sendToUser(7L, PushPayload.test(0))).isZero();
        assertThat(service.publicKey()).isNull();
        verifyNoInteractions(transport);
    }

    @Test
    void movesAnExistingDeviceToTheAccountThatSubscribedLast() {
        PushSubscription shared = device(1, 2);
        when(subscriptions.findByEndpointHash(WebPushService.hash("https://push.example/1"))).thenReturn(Optional.of(shared));
        var request = new PushSubscribeRequest("https://push.example/1",
                new PushSubscribeRequest.Keys("new-key", "new-auth"), "android", true);

        service.subscribe(8L, request);

        assertThat(shared.getUserId()).isEqualTo(8L);
        assertThat(shared.getP256dh()).isEqualTo("new-key");
        assertThat(shared.getFailureCount()).isZero();
        assertThat(shared.getStandalone()).isTrue();
        verify(subscriptions).save(shared);
    }

    @Test
    void unsubscribeOnlyRemovesTheCallersOwnDevice() {
        PushSubscription someoneElses = device(1, 0);
        when(subscriptions.findByEndpointHash(any())).thenReturn(Optional.of(someoneElses));

        service.unsubscribe(8L, "https://push.example/1");
        verify(subscriptions, never()).delete(any());

        service.unsubscribe(7L, "https://push.example/1");
        verify(subscriptions).delete(someoneElses);
    }
}
