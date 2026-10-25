package com.anylearn.backend.service.payment.bank;

import com.anylearn.backend.entity.BankWebhookEvent;
import com.anylearn.backend.entity.Order;
import com.anylearn.backend.entity.OrderStatus;
import com.anylearn.backend.repository.BankWebhookEventRepository;
import com.anylearn.backend.repository.OrderRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.OptionalLong;

/**
 * Turns a SePay "money received" webhook into an approved order. Everything runs in one transaction:
 * if approving fails nothing is recorded, SePay retries and the transfer is processed again.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SepayWebhookService {

    static final String PROVIDER = "sepay";
    private static final String BANK_TRANSFER = "bank_transfer";

    private final BankWebhookEventRepository eventRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final PaymentApprovalService approvalService;
    private final BankAccountService bankAccountService;
    private final ObjectMapper objectMapper;

    /** Returns the match status that was recorded, or null when this transfer was already processed. */
    @Transactional
    public String handle(SepayEvent event, Map<String, Object> rawBody) {
        if (eventRepository.existsByProviderAndProviderTxnId(PROVIDER, event.txnId())) {
            log.info("[SePay] transfer {} already processed", event.txnId());
            return null;
        }

        OutcomeOfMatch outcome = match(event);
        saveEvent(event, rawBody, outcome);
        log.info("[SePay] transfer {} amount={} -> {} order={}", event.txnId(), event.amount(), outcome.status(), outcome.orderId());
        return outcome.status();
    }

    private record OutcomeOfMatch(String status, Long orderId) {}

    private OutcomeOfMatch match(SepayEvent event) {
        if (!event.incoming() || !isOurAccount(event.accountNumber())) return new OutcomeOfMatch(BankWebhookEvent.IGNORED, null);

        OptionalLong orderId = TransferNote.extractOrderId(event.code(), event.content());
        if (orderId.isEmpty()) return unmatched(event);
        Order order = orderRepository.findById(orderId.getAsLong()).orElse(null);
        if (order == null) return unmatched(event);

        return settle(event, order);
    }

    private OutcomeOfMatch settle(SepayEvent event, Order order) {
        Long orderId = order.getId();
        if (!isAwaitingPayment(order)) {
            notifyAdmins("Nhận tiền cho đơn không còn chờ thanh toán",
                    "Đơn #" + orderId + " đang ở trạng thái " + order.getStatus() + " nhưng đã nhận " + event.amount()
                            + " đ (mã giao dịch " + event.txnId() + "). Cần kiểm tra và hoàn tiền hoặc xử lý tay.", orderId);
            return new OutcomeOfMatch(BankWebhookEvent.NEEDS_REVIEW, orderId);
        }
        if (event.amount() < order.getAmount()) {
            notifyAdmins("Đơn nhận thiếu tiền",
                    "Đơn #" + orderId + " cần " + order.getAmount() + " đ nhưng chỉ nhận " + event.amount()
                            + " đ (mã giao dịch " + event.txnId() + "). Đơn chưa được duyệt.", orderId);
            return new OutcomeOfMatch(BankWebhookEvent.MISMATCH, orderId);
        }

        approvalService.approveOrder(orderId, BANK_TRANSFER);
        if (event.amount() > order.getAmount()) {
            notifyAdmins("Đơn nhận dư tiền",
                    "Đơn #" + orderId + " cần " + order.getAmount() + " đ nhưng đã nhận " + event.amount()
                            + " đ (dư " + (event.amount() - order.getAmount()) + " đ, mã giao dịch " + event.txnId() + ").", orderId);
        }
        return new OutcomeOfMatch(BankWebhookEvent.PAID, orderId);
    }

    private OutcomeOfMatch unmatched(SepayEvent event) {
        notifyAdmins("Nhận tiền không khớp đơn hàng nào",
                "Đã nhận " + event.amount() + " đ, nội dung \"" + event.content() + "\" (mã giao dịch " + event.txnId() + ").", null);
        return new OutcomeOfMatch(BankWebhookEvent.UNMATCHED, null);
    }

    private boolean isAwaitingPayment(Order order) {
        return OrderStatus.NEW.equals(order.getStatus()) || OrderStatus.PAY_PENDING.equals(order.getStatus());
    }

    private boolean isOurAccount(String accountNumber) {
        String configured = bankAccountService.current().accountNumber();
        if (configured == null || configured.isBlank()) return true;
        return configured.replaceAll("\\s", "").equals(accountNumber == null ? "" : accountNumber.replaceAll("\\s", ""));
    }

    private void notifyAdmins(String title, String content, Long orderId) {
        String route = orderId != null ? "/admin/orders/" + orderId : "/admin/orders";
        try {
            userRepository.findAdminNotificationRecipients().forEach(admin ->
                    notificationService.createNotification(admin.getId(), "system_notif", title, content, route, null));
        } catch (Exception e) {
            log.warn("[SePay] failed to notify admins: {}", e.getMessage());
        }
    }

    private void saveEvent(SepayEvent event, Map<String, Object> rawBody, OutcomeOfMatch outcome) {
        BankWebhookEvent row = new BankWebhookEvent();
        row.setProvider(PROVIDER);
        row.setProviderTxnId(event.txnId());
        row.setDirection(event.incoming() ? "in" : "out");
        row.setAmount(event.amount());
        row.setContent(event.content());
        row.setAccountNo(event.accountNumber());
        row.setTransferredAt(event.transferredAt());
        row.setRaw(toJson(rawBody));
        row.setMatchStatus(outcome.status());
        row.setOrderId(outcome.orderId());
        row.setReceivedAt(LocalDateTime.now());
        eventRepository.save(row);
    }

    private String toJson(Map<String, Object> body) {
        try {
            return objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
