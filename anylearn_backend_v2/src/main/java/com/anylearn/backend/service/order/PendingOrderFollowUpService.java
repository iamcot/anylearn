package com.anylearn.backend.service.order;

import com.anylearn.backend.entity.Order;
import com.anylearn.backend.entity.OrderDetail;
import com.anylearn.backend.entity.OrderFollowup;
import com.anylearn.backend.entity.OrderStatus;
import com.anylearn.backend.repository.OrderDetailRepository;
import com.anylearn.backend.repository.OrderFollowupRepository;
import com.anylearn.backend.repository.OrderRepository;
import com.anylearn.backend.service.EmailTemplateService;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.OptionalInt;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Orders that wait for payment: reminds the buyer at the configured hours, and cancels the order when it is too old.
 * Every step is written to order_followups first (unique per order and step), so nothing goes out twice.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PendingOrderFollowUpService {

    static final int MAX_EXPIRIES_PER_RUN = 50;
    private static final int EMAIL_FROM_STAGE = 2;
    private static final DateTimeFormatter DEADLINE_FORMAT = DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM");
    private static final List<String> WAITING_STATUSES = List.of(OrderStatus.NEW, OrderStatus.PAY_PENDING);

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final OrderFollowupRepository followupRepository;
    private final NotificationService notificationService;
    private final PaymentApprovalService paymentApprovalService;
    private final OrderFollowUpSettings settings;
    private final Clock clock;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.anylearn.backend.service.zns.ZnsNotifier znsNotifier;
    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private com.anylearn.backend.repository.UserRepository userRepository;

    @Scheduled(fixedDelay = 15 * 60 * 1000, initialDelay = 2 * 60 * 1000)
    public void run() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<Integer> remindHours = settings.remindHours();
        int autoCancelHours = settings.autoCancelHours();
        boolean autoCancel = settings.autoCancelEnabled();

        LocalDateTime oldestRemindable = now.minusHours(remindHours.get(0));
        int expired = 0;
        for (Order order : orderRepository.findByStatusInAndCreatedAtBeforeOrderByIdAsc(WAITING_STATUSES, oldestRemindable)) {
            try {
                if (order.getCreatedAt() == null) continue;
                if (PendingOrderRules.isExpired(order.getCreatedAt(), now, autoCancelHours)) {
                    if (autoCancel && expired < MAX_EXPIRIES_PER_RUN && expire(order, now)) expired++;
                    continue;
                }
                remind(order, now, remindHours, autoCancelHours);
                remindByZns(order, now, remindHours, autoCancelHours);
            } catch (Exception e) {
                log.warn("[orderFollowUp] order {} skipped: {}", order.getId(), e.getMessage());
            }
        }
    }

    private boolean expire(Order order, LocalDateTime now) {
        if (!claim(order.getId(), OrderFollowup.EXPIRE, 0, now)) return false;
        String result = paymentApprovalService.cancelOrder(order.getId(), PaymentApprovalService.CANCELLED_BY_EXPIRY);
        log.info("[orderFollowUp] order {} expired: {}", order.getId(), result);
        return "OK".equals(result);
    }

    private void remind(Order order, LocalDateTime now, List<Integer> remindHours, int autoCancelHours) {
        Set<Integer> sent = followupRepository.findByOrderId(order.getId()).stream()
                .filter(followup -> OrderFollowup.REMIND.equals(followup.getKind()))
                .map(OrderFollowup::getStage).collect(Collectors.toCollection(HashSet::new));
        OptionalInt stage = PendingOrderRules.dueReminderStage(order.getCreatedAt(), now, remindHours, sent);
        if (stage.isEmpty()) return;
        if (alreadyPaidElsewhere(order)) return;
        if (!claim(order.getId(), OrderFollowup.REMIND, stage.getAsInt(), now)) return;

        String deadline = PendingOrderRules.expiresAt(order.getCreatedAt(), autoCancelHours).format(DEADLINE_FORMAT);
        String content = "Đơn #" + order.getId() + " đang chờ thanh toán, anyLEARN giữ chỗ đến " + deadline + ". Thanh toán ngay →";
        notificationService.createNotification(order.getUserId(), "order_reminder", "Đơn hàng đang chờ thanh toán",
                content, "/order/" + order.getId(), null);
        if (stage.getAsInt() >= EMAIL_FROM_STAGE) {
            notificationService.emailTemplate(order.getUserId(), "order_reminder", "email-order_reminder",
                    "Đơn hàng #" + order.getId() + " đang chờ thanh toán",
                    Map.of("orderId", String.valueOf(order.getId()), "amount", EmailTemplateService.money(order.getAmount()),
                            "deadline", deadline, "payUrl", "https://anylearn.vn/order/" + order.getId()));
        }
    }

    /**
     * ZNS "Nhắc thanh toán" (template order_reminder): once per order, from the reminder step that also sends the email
     * (default 24 hours), only between 8h and 21h and while the order is still held. A step that falls at night is sent
     * the next morning by a later run (the message is claimed in zns_messages, not in order_followups).
     */
    private void remindByZns(Order order, LocalDateTime now, List<Integer> remindHours, int autoCancelHours) {
        if (znsNotifier == null || userRepository == null) return;
        if (!ZnsReminderRules.due(order.getCreatedAt(), now, remindHours, EMAIL_FROM_STAGE, autoCancelHours)) return;
        if (alreadyPaidElsewhere(order)) return;
        var buyer = userRepository.findById(order.getUserId()).orElse(null);
        if (buyer == null) return;
        LocalDateTime deadline = PendingOrderRules.expiresAt(order.getCreatedAt(), autoCancelHours);
        znsNotifier.send(buyer.getId(), "order_reminder", com.anylearn.backend.service.zns.ZnsTemplates.ORDER_REMINDER,
                "order_reminder:" + order.getId(),
                com.anylearn.backend.service.zns.ZnsTemplates.orderReminder(buyer.getName(), order.getId(), order.getAmount(), deadline));
    }

    /** The buyer already paid for the same course and learner in another order: this one is just a leftover. */
    private boolean alreadyPaidElsewhere(Order order) {
        List<OrderDetail> details = orderDetailRepository.findByOrderId(order.getId());
        return !details.isEmpty() && details.stream()
                .allMatch(detail -> orderDetailRepository.existsDeliveredByUserIdAndItemId(detail.getUserId(), detail.getItemId()) > 0);
    }

    private boolean claim(Long orderId, String kind, int stage, LocalDateTime now) {
        OrderFollowup followup = new OrderFollowup();
        followup.setOrderId(orderId);
        followup.setKind(kind);
        followup.setStage(stage);
        followup.setCreatedAt(now);
        try {
            followupRepository.saveAndFlush(followup);
            return true;
        } catch (DataIntegrityViolationException alreadyDone) {
            return false;
        }
    }
}
