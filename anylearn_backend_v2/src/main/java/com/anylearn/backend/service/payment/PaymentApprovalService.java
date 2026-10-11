package com.anylearn.backend.service.payment;

import com.anylearn.backend.entity.*;
import com.anylearn.backend.repository.*;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.WalletService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentApprovalService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ItemUserActionRepository itemUserActionRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final WalletService walletService;
    private final ObjectMapper objectMapper;
    private final UserCourseEnrollmentRepository enrollmentRepository;
    private final ItemScheduleRepository itemScheduleRepository;
    private final ItemRepository itemRepository;

    @Transactional
    public void approveOrder(Long orderId, String paymentMethod) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) { log.warn("approveOrder: order {} not found", orderId); return; }
        if (OrderStatus.DELIVERED.equals(order.getStatus())) {
            log.info("approveOrder: order {} already delivered", orderId); return;
        }
        if (!OrderStatus.NEW.equals(order.getStatus()) && !OrderStatus.PAY_PENDING.equals(order.getStatus())) {
            log.warn("approveOrder: order {} unexpected status {}", orderId, order.getStatus()); return;
        }

        // Update Order + OrderDetails
        order.setStatus(OrderStatus.DELIVERED);
        order.setPayment(paymentMethod);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        List<OrderDetail> details = orderDetailRepository.findByOrderId(orderId);
        for (OrderDetail detail : details) {
            detail.setStatus(OrderStatus.DELIVERED);
            detail.setUpdatedAt(LocalDateTime.now());
            orderDetailRepository.save(detail);
        }

        // Convert pending_reg → reg + create user_course_enrollments
        itemUserActionRepository
                .findByUserIdAndTypeAndValue(order.getUserId(), "pending_reg", String.valueOf(orderId))
                .forEach(pending -> {
                    try {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> extra = objectMapper.readValue(
                                pending.getExtraValue() != null ? pending.getExtraValue() : "{}", Map.class);
                        extra.put("paid", true);
                        extra.put("paymentMethod", paymentMethod);
                        pending.setType("reg");
                        pending.setValue("1");
                        pending.setExtraValue(objectMapper.writeValueAsString(extra));
                        pending.setUpdatedAt(LocalDateTime.now());
                        itemUserActionRepository.save(pending);

                        // Create enrollment record
                        createEnrollment(pending.getItemId(), order.getUserId(), orderId, extra);
                    } catch (Exception e) {
                        log.error("Error converting pending_reg {} to reg", pending.getId(), e);
                    }
                });

        // Confirm anyPoint exchange transaction (pending → done)
        transactionRepository.findByOrderIdAndType(orderId, "exchange").forEach(tx -> {
            tx.setStatus(1);
            tx.setUpdatedAt(LocalDateTime.now());
            transactionRepository.save(tx);
            log.info("[approveOrder] confirmed anyPoint tx {} for order {}", tx.getId(), orderId);
        });

        // Approve pending commission/partner transactions for all order details
        List<Long> detailIds = details.stream().map(OrderDetail::getId).toList();
        if (!detailIds.isEmpty()) {
            transactionRepository.findPendingCommissionsByDetailIds(detailIds).forEach(commTx -> {
                approveWalletCTransaction(commTx);
                log.info("[approveOrder] approved commission tx {} type={} amt={} user={}",
                        commTx.getId(), commTx.getType(), commTx.getAmount(), commTx.getUserId());
            });
        }

        // Notify admins
        try {
            userRepository.findByRole("admin").forEach(admin ->
                notificationService.createNotification(admin.getId(), "system_notif",
                        "Đơn hàng thanh toán thành công",
                        "Đơn hàng #" + orderId + " đã được thanh toán qua " + paymentMethod,
                        "/admin/orders/" + orderId, null)
            );
        } catch (Exception e) {
            log.warn("[approveOrder] failed to notify admin: {}", e.getMessage());
        }

        // Notify buyer
        try {
            notificationService.createNotification(order.getUserId(), "order",
                    "Đơn hàng thành công",
                    "Đơn hàng #" + orderId + " đã được xác nhận và thanh toán thành công.",
                    "/orders", null);
        } catch (Exception e) {
            log.warn("[approveOrder] failed to notify buyer: {}", e.getMessage());
        }

        // Create payment Transaction record (order)
        saveTransaction(order.getUserId(), "order", order.getAmount(), paymentMethod, orderId,
                "Thanh toán đơn hàng #" + orderId, 1);

        log.info("[approveOrder] order {} fully approved via {}", orderId, paymentMethod);
    }

    private void createEnrollment(Long itemId, Long buyerUserId, Long orderId, Map<String, Object> extra) {
        Object sidObj = extra.get("studentId");
        Long enrolledUserId = sidObj != null ? Long.parseLong(String.valueOf(sidObj)) : buyerUserId;

        Object schIdObj = extra.get("scheduleId");
        Long scheduleId = schIdObj != null && !String.valueOf(schIdObj).equals("null")
                ? Long.parseLong(String.valueOf(schIdObj)) : null;

        UserCourseEnrollment e = new UserCourseEnrollment();
        e.setUserId(enrolledUserId);
        e.setItemId(itemId);
        e.setOrderId(orderId);
        e.setScheduleId(scheduleId);
        e.setCreatedAt(java.time.LocalDateTime.now());
        e.setUpdatedAt(java.time.LocalDateTime.now());

        if (scheduleId != null) {
            itemScheduleRepository.findById(scheduleId).ifPresent(sch -> {
                if ("open".equals(sch.getScheduleType())) {
                    e.setStatus("pending"); // user picks start date later
                } else if ("event".equals(sch.getScheduleType())) {
                    e.setStatus("active");
                    e.setStartDate(sch.getEventDate());
                    e.setEndDate(sch.getEventDate());
                } else { // recurring
                    e.setStatus("active");
                    e.setStartDate(sch.getDateStart());
                    e.setEndDate(sch.getDateEnd());
                }
            });
        } else {
            // No schedule — check if there's a startDate + cycleType for billing-only items
            String startDateStr = extra.get("startDate") instanceof String sd ? sd : null;
            if (startDateStr != null && !startDateStr.isBlank()) {
                try {
                    java.time.LocalDate start = java.time.LocalDate.parse(startDateStr);
                    e.setStartDate(start);
                    // Compute endDate from item's cycleType + cycleAmount
                    Item item = itemRepository.findById(itemId).orElse(null);
                    if (item != null && item.getCycleType() != null && item.getCycleAmount() != null) {
                        java.time.LocalDate end = switch (item.getCycleType()) {
                            case "year"  -> start.plusYears(item.getCycleAmount()).minusDays(1);
                            case "week"  -> start.plusWeeks(item.getCycleAmount()).minusDays(1);
                            case "day"   -> start.plusDays(item.getCycleAmount()).minusDays(1);
                            default      -> start.plusMonths(item.getCycleAmount()).minusDays(1); // month
                        };
                        e.setEndDate(end);
                    }
                } catch (Exception ignored) {}
            }
            e.setStatus("active");
        }

        enrollmentRepository.save(e);
        log.info("[approveOrder] created enrollment userId={} itemId={} scheduleId={} status={}",
                enrolledUserId, itemId, scheduleId, e.getStatus());
    }

    /** Mark transaction done. Only credits wallet_c for partner/commission types. Foundation is accounting-only. */
    private void approveWalletCTransaction(Transaction tx) {
        if (tx == null || tx.getStatus() != 0) return;
        tx.setStatus(1);
        tx.setUpdatedAt(LocalDateTime.now());
        transactionRepository.save(tx);

        if ("foundation".equals(tx.getType()) || "net_revenue".equals(tx.getType())) return; // accounting only

        walletService.creditWalletC(tx.getUserId(), tx.getAmount());
        try {
            notificationService.createNotification(
                    tx.getUserId(), "system_notif",
                    "Nhận anyPoint",
                    "Bạn nhận được " + tx.getAmount() + " anyPoint" +
                    (tx.getContent() != null ? ": " + tx.getContent() : ""),
                    "/transaction", null);
        } catch (Exception e) {
            log.warn("[approveWalletCTransaction] failed to send notification to {}: {}", tx.getUserId(), e.getMessage());
        }
    }

    /**
     * Refund anyPoints to buyer when an exchange transaction is cancelled.
     * Keeps the original exchange (status=1) intact for audit trail and adds
     * an exchange_refund (status=1) to offset it:
     *   exchange (-50, status=1) + exchange_refund (+50, status=1) → net 0, wallet_c correct.
     */
    private void refundExchangePoints(Long orderId, Long userId) {
        // Idempotency: skip if refund already created for this order
        if (!transactionRepository.findByOrderIdAndType(orderId, "exchange_refund").isEmpty()) return;

        transactionRepository.findByOrderIdAndType(orderId, "exchange").forEach(tx -> {
            long refundPoints = Math.abs(tx.getAmount());

            // Create refund transaction — original exchange stays status=1 for audit
            Transaction refundTx = new Transaction();
            refundTx.setUserId(userId);
            refundTx.setType("exchange_refund");
            refundTx.setAmount(refundPoints);
            refundTx.setPayMethod("wallet_c");
            refundTx.setOrderId(orderId);
            refundTx.setContent("Hoàn " + refundPoints + " anyPoint từ đơn hàng #" + orderId);
            refundTx.setStatus(1);
            refundTx.setCreatedAt(LocalDateTime.now());
            refundTx.setUpdatedAt(LocalDateTime.now());
            transactionRepository.save(refundTx);

            // Update wallet_c
            walletService.creditWalletC(userId, refundPoints);
            log.info("[refundExchange] refunded {} anyPoints to user {} for order {} (tx#{}→refund)",
                    refundPoints, userId, orderId, tx.getId());
        });
    }

    private Transaction saveTransaction(Long userId, String type, long amount, String payMethod,
                                         Long refId, String content, int status) {
        Transaction tx = new Transaction();
        tx.setUserId(userId);
        tx.setType(type);
        tx.setAmount(amount);
        tx.setPayMethod(payMethod);
        tx.setOrderId(refId);
        tx.setContent(content);
        tx.setStatus(status);
        tx.setCreatedAt(LocalDateTime.now());
        tx.setUpdatedAt(LocalDateTime.now());
        return transactionRepository.save(tx);
    }

    @Transactional
    public void setPayPending(Long orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if (OrderStatus.NEW.equals(order.getStatus())) {
                order.setStatus(OrderStatus.PAY_PENDING);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
            }
        });
    }

    @Transactional
    public void resetToNew(Long orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            if (OrderStatus.PAY_PENDING.equals(order.getStatus())) {
                order.setStatus(OrderStatus.NEW);
                order.setUpdatedAt(LocalDateTime.now());
                orderRepository.save(order);
                log.info("[resetToNew] order {} reset to NEW (payment failed/cancelled)", orderId);

                refundExchangePoints(orderId, order.getUserId());
            }
        });
    }

    /** Admin approve for bank_transfer orders — same full flow as gateway approval. */
    @Transactional
    public String adminApproveOrder(Long orderId, String adminNote) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return "Không tìm thấy đơn hàng";
        if (OrderStatus.DELIVERED.equals(order.getStatus())) return "Đơn hàng đã được xác nhận";
        if (!OrderStatus.NEW.equals(order.getStatus()) && !OrderStatus.PAY_PENDING.equals(order.getStatus()))
            return "Trạng thái đơn hàng không hợp lệ: " + order.getStatus();
        approveOrder(orderId, order.getPayment() != null ? order.getPayment() : "bank_transfer");
        log.info("[adminApproveOrder] order {} approved by admin. note={}", orderId, adminNote);
        return "OK";
    }

    /**
     * Cancel an order: sync orders, order_details, transactions, pending_reg, wallet_c refund, notifications.
     * cancelledBy: "admin" | "buyer" | "system"
     */
    @Transactional
    public String cancelOrder(Long orderId, String cancelledBy) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null) return "Không tìm thấy đơn hàng";
        if (OrderStatus.DELIVERED.equals(order.getStatus())) return "Không thể hủy đơn hàng đã hoàn thành";

        String newStatus = "buyer".equals(cancelledBy) ? OrderStatus.CANCEL_BUYER
                         : "seller".equals(cancelledBy) ? OrderStatus.CANCEL_SELLER
                         : OrderStatus.CANCEL_SYSTEM;

        // 1. Update order status
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        orderRepository.save(order);

        // 2. Update all order_details status
        List<OrderDetail> details = orderDetailRepository.findByOrderId(orderId);
        details.forEach(d -> {
            d.setStatus(newStatus);
            d.setUpdatedAt(LocalDateTime.now());
            orderDetailRepository.save(d);
        });

        // 3. Cancel pending_reg → delete (enrollment never happened)
        itemUserActionRepository
                .findByUserIdAndTypeAndValue(order.getUserId(), "pending_reg", String.valueOf(orderId))
                .forEach(itemUserActionRepository::delete);

        // 4. Reject all pending anyPoint transactions for this order's details
        List<Long> detailIds = details.stream().map(OrderDetail::getId).toList();
        if (!detailIds.isEmpty()) {
            transactionRepository.findPendingCommissionsByDetailIds(detailIds).forEach(tx -> {
                tx.setStatus(99);
                tx.setUpdatedAt(LocalDateTime.now());
                transactionRepository.save(tx);
            });
        }

        // 5. Refund exchange anyPoints if buyer used points and they're still pending
        refundExchangePoints(orderId, order.getUserId());

        // 6. Notify buyer
        try {
            notificationService.createNotification(order.getUserId(), "system_notif",
                    "Đơn hàng đã bị hủy",
                    "Đơn hàng #" + orderId + " đã bị hủy. Nếu bạn đã thanh toán, vui lòng liên hệ hỗ trợ.",
                    "/orders", null);
        } catch (Exception e) {
            log.warn("[cancelOrder] failed to notify buyer {}: {}", order.getUserId(), e.getMessage());
        }

        // 7. Notify admins
        try {
            userRepository.findByRole("admin").forEach(admin ->
                notificationService.createNotification(admin.getId(), "system_notif",
                        "Đơn hàng đã hủy",
                        "Đơn #" + orderId + " đã hủy bởi " + cancelledBy,
                        "/admin/orders", null)
            );
        } catch (Exception e) {
            log.warn("[cancelOrder] failed to notify admin: {}", e.getMessage());
        }

        log.info("[cancelOrder] order {} cancelled (by={}) — details={}, txs rejected", orderId, cancelledBy, details.size());
        return "OK";
    }
}
