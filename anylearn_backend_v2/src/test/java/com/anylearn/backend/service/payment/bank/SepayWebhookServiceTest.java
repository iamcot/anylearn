package com.anylearn.backend.service.payment.bank;

import com.anylearn.backend.entity.BankWebhookEvent;
import com.anylearn.backend.entity.Order;
import com.anylearn.backend.entity.OrderStatus;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.BankWebhookEventRepository;
import com.anylearn.backend.repository.OrderRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SepayWebhookServiceTest {

    private static final long ORDER_ID = 42L;
    private static final String ACCOUNT = "0123456789";

    private BankWebhookEventRepository eventRepository;
    private OrderRepository orderRepository;
    private NotificationService notificationService;
    private PaymentApprovalService approvalService;
    private SepayWebhookService service;
    private Order order;

    @BeforeEach
    void setUp() {
        eventRepository = mock(BankWebhookEventRepository.class);
        orderRepository = mock(OrderRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        notificationService = mock(NotificationService.class);
        approvalService = mock(PaymentApprovalService.class);
        BankAccountService bankAccountService = mock(BankAccountService.class);
        when(bankAccountService.current()).thenReturn(
                new BankAccountService.BankAccount("ACB", "970416", ACCOUNT, "CONG TY", ""));

        User admin = new User();
        admin.setId(1L);
        when(userRepository.findByRole("admin")).thenReturn(List.of(admin));

        order = new Order();
        order.setId(ORDER_ID);
        order.setAmount(1_000_000L);
        order.setStatus(OrderStatus.PAY_PENDING);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        service = new SepayWebhookService(eventRepository, orderRepository, userRepository, notificationService,
                approvalService, bankAccountService, new ObjectMapper());
    }

    private SepayEvent transfer(String txnId, boolean incoming, long amount, String content, String account) {
        return new SepayEvent(txnId, incoming, amount, content, "", account, LocalDateTime.of(2026, 10, 24, 7, 0));
    }

    private String handle(SepayEvent event) {
        return service.handle(event, Map.of("id", event.txnId()));
    }

    private BankWebhookEvent savedEvent() {
        ArgumentCaptor<BankWebhookEvent> captor = ArgumentCaptor.forClass(BankWebhookEvent.class);
        verify(eventRepository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void approvesTheOrderWhenExactAmountArrives() {
        String status = handle(transfer("1", true, 1_000_000, "MBVCB.1.ALQR42.CT", ACCOUNT));

        assertThat(status).isEqualTo(BankWebhookEvent.PAID);
        verify(approvalService).approveOrder(ORDER_ID, "bank_transfer");
        verify(notificationService, never()).createNotification(anyLong(), anyString(), anyString(), anyString(), anyString(), any());
        assertThat(savedEvent().getOrderId()).isEqualTo(ORDER_ID);
    }

    @Test
    void approvesUsingThePaymentCodeWhenTheContentIsEmpty() {
        SepayEvent withCode = new SepayEvent("10", true, 1_000_000, "", "ALQR42", ACCOUNT, LocalDateTime.of(2026, 10, 24, 7, 0));

        assertThat(service.handle(withCode, Map.of("id", "10"))).isEqualTo(BankWebhookEvent.PAID);
        verify(approvalService).approveOrder(ORDER_ID, "bank_transfer");
    }

    @Test
    void approvesAndWarnsAdminsOnOverpayment() {
        String status = handle(transfer("2", true, 1_200_000, "ALQR42", ACCOUNT));

        assertThat(status).isEqualTo(BankWebhookEvent.PAID);
        verify(approvalService).approveOrder(ORDER_ID, "bank_transfer");
        verify(notificationService).createNotification(eq(1L), eq("system_notif"), eq("Đơn nhận dư tiền"), anyString(), anyString(), any());
    }

    @Test
    void doesNotApproveWhenAmountIsShort() {
        String status = handle(transfer("3", true, 900_000, "ALQR42", ACCOUNT));

        assertThat(status).isEqualTo(BankWebhookEvent.MISMATCH);
        verify(approvalService, never()).approveOrder(anyLong(), anyString());
        verify(notificationService).createNotification(eq(1L), eq("system_notif"), eq("Đơn nhận thiếu tiền"), anyString(), anyString(), any());
    }

    @Test
    void flagsMoneyForAnOrderThatIsNoLongerWaiting() {
        order.setStatus(OrderStatus.CANCEL_BUYER);

        String status = handle(transfer("4", true, 1_000_000, "ALQR42", ACCOUNT));

        assertThat(status).isEqualTo(BankWebhookEvent.NEEDS_REVIEW);
        verify(approvalService, never()).approveOrder(anyLong(), anyString());
    }

    @Test
    void flagsTransfersWithoutKnownOrder() {
        assertThat(handle(transfer("5", true, 1_000_000, "hoc phi", ACCOUNT))).isEqualTo(BankWebhookEvent.UNMATCHED);
        assertThat(handle(transfer("6", true, 1_000_000, "ALQR999", ACCOUNT))).isEqualTo(BankWebhookEvent.UNMATCHED);
        verify(approvalService, never()).approveOrder(anyLong(), anyString());
    }

    @Test
    void ignoresOutgoingTransfersAndOtherAccounts() {
        assertThat(handle(transfer("7", false, 1_000_000, "ALQR42", ACCOUNT))).isEqualTo(BankWebhookEvent.IGNORED);
        assertThat(handle(transfer("8", true, 1_000_000, "ALQR42", "999"))).isEqualTo(BankWebhookEvent.IGNORED);
        verify(approvalService, never()).approveOrder(anyLong(), anyString());
    }

    @Test
    void skipsATransferThatWasAlreadyProcessed() {
        when(eventRepository.existsByProviderAndProviderTxnId("sepay", "9")).thenReturn(true);

        assertThat(handle(transfer("9", true, 1_000_000, "ALQR42", ACCOUNT))).isNull();
        verify(approvalService, never()).approveOrder(anyLong(), anyString());
        verify(eventRepository, never()).save(any());
    }
}
