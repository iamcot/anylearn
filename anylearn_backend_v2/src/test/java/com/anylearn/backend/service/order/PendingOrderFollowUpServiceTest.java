package com.anylearn.backend.service.order;

import com.anylearn.backend.entity.Order;
import com.anylearn.backend.entity.OrderDetail;
import com.anylearn.backend.entity.OrderFollowup;
import com.anylearn.backend.entity.OrderStatus;
import com.anylearn.backend.repository.OrderDetailRepository;
import com.anylearn.backend.repository.OrderFollowupRepository;
import com.anylearn.backend.repository.OrderRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PendingOrderFollowUpServiceTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDateTime CREATED = LocalDateTime.of(2026, 10, 25, 9, 0);

    private OrderRepository orders;
    private OrderDetailRepository details;
    private OrderFollowupRepository followups;
    private NotificationService notifications;
    private PaymentApprovalService approval;
    private OrderFollowUpSettings settings;
    private LocalDateTime now;
    private PendingOrderFollowUpService service;

    @BeforeEach
    void setUp() {
        orders = mock(OrderRepository.class);
        details = mock(OrderDetailRepository.class);
        followups = mock(OrderFollowupRepository.class);
        notifications = mock(NotificationService.class);
        approval = mock(PaymentApprovalService.class);
        settings = mock(OrderFollowUpSettings.class);
        when(settings.remindHours()).thenReturn(List.of(2, 24));
        when(settings.autoCancelHours()).thenReturn(72);
        when(settings.autoCancelEnabled()).thenReturn(true);
        when(details.existsDeliveredByUserIdAndItemId(anyLong(), anyLong())).thenReturn(0);
        when(approval.cancelOrder(anyLong(), anyString())).thenReturn("OK");
        when(followups.findByOrderId(anyLong())).thenReturn(List.of());
    }

    private void runAt(LocalDateTime time, Order... waiting) {
        now = time;
        Clock clock = Clock.fixed(time.atZone(ZONE).toInstant(), ZONE);
        service = new PendingOrderFollowUpService(orders, details, followups, notifications, approval, settings, clock);
        when(orders.findByStatusInAndCreatedAtBeforeOrderByIdAsc(any(), any())).thenReturn(List.of(waiting));
        service.run();
    }

    private Order waitingOrder(long id) {
        Order order = new Order();
        order.setId(id);
        order.setUserId(7L);
        order.setStatus(OrderStatus.PAY_PENDING);
        order.setCreatedAt(CREATED);
        OrderDetail detail = new OrderDetail();
        detail.setUserId(50L);
        detail.setItemId(5L);
        when(details.findByOrderId(id)).thenReturn(List.of(detail));
        return order;
    }

    @Test
    void firstReminderIsInAppOnly() {
        runAt(CREATED.plusHours(3), waitingOrder(1));
        verify(notifications).createNotification(eq(7L), eq("order_reminder"), anyString(), anyString(), eq("/order/1"), any());
        verify(notifications, never()).emailTemplate(anyLong(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void secondReminderAlsoSendsEmail() {
        OrderFollowup first = new OrderFollowup();
        first.setKind(OrderFollowup.REMIND);
        first.setStage(1);
        when(followups.findByOrderId(1L)).thenReturn(List.of(first));
        runAt(CREATED.plusHours(25), waitingOrder(1));
        verify(notifications).createNotification(eq(7L), eq("order_reminder"), anyString(), anyString(), eq("/order/1"), any());
        verify(notifications).emailTemplate(eq(7L), eq("order_reminder"), eq("email-order_reminder"), anyString(), any());
    }

    @Test
    void nothingIsSentTwiceWhenTheStepWasAlreadyClaimed() {
        when(followups.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("duplicate"));
        runAt(CREATED.plusHours(3), waitingOrder(1));
        verify(notifications, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void noReminderWhenTheCourseForThisLearnerIsAlreadyPaid() {
        when(details.existsDeliveredByUserIdAndItemId(50L, 5L)).thenReturn(1);
        runAt(CREATED.plusHours(3), waitingOrder(1));
        verify(notifications, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void expiredOrderIsCancelledAndNotRemindedAgain() {
        runAt(CREATED.plusHours(73), waitingOrder(1));
        verify(approval).cancelOrder(1L, PaymentApprovalService.CANCELLED_BY_EXPIRY);
        verify(notifications, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), anyString(), any());
    }

    @Test
    void expiredOrdersStayWhenAutoCancelIsOff() {
        when(settings.autoCancelEnabled()).thenReturn(false);
        runAt(CREATED.plusHours(73), waitingOrder(1));
        verify(approval, never()).cancelOrder(anyLong(), anyString());
    }

    @Test
    void anOrderThatFailsDoesNotStopTheOthers() {
        Order broken = waitingOrder(1);
        when(details.findByOrderId(1L)).thenThrow(new IllegalStateException("boom"));
        runAt(CREATED.plusHours(3), broken, waitingOrder(2));
        verify(notifications).createNotification(eq(7L), eq("order_reminder"), anyString(), anyString(), eq("/order/2"), any());
    }
}
