package com.anylearn.backend.service.payment;

import com.anylearn.backend.entity.*;
import com.anylearn.backend.repository.*;
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
    private final ObjectMapper objectMapper;

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

        // Convert pending_reg → reg
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

        // Create payment Transaction record (order)
        saveTransaction(order.getUserId(), "order", order.getAmount(), paymentMethod, orderId,
                "Thanh toán đơn hàng #" + orderId, 1);

        log.info("[approveOrder] order {} fully approved via {}", orderId, paymentMethod);
    }

    /** Mark transaction done and credit wallet_c. */
    private void approveWalletCTransaction(Transaction tx) {
        if (tx == null || tx.getStatus() != 0) return;
        tx.setStatus(1);
        tx.setUpdatedAt(LocalDateTime.now());
        transactionRepository.save(tx);
        userRepository.findById(tx.getUserId()).ifPresent(u -> {
            u.setWalletC((u.getWalletC() != null ? u.getWalletC() : 0) + tx.getAmount());
            userRepository.save(u);
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

                // Refund anyPoints
                transactionRepository.findByOrderIdAndType(orderId, "exchange").forEach(tx -> {
                    if (tx.getStatus() == 0) {
                        long refundPoints = Math.abs(tx.getAmount());
                        userRepository.findById(order.getUserId()).ifPresent(user -> {
                            user.setWalletC((user.getWalletC() != null ? user.getWalletC() : 0) + refundPoints);
                            userRepository.save(user);
                            log.info("[resetToNew] refunded {} anyPoints to user {} for order {}",
                                    refundPoints, user.getId(), orderId);
                        });
                        tx.setStatus(99);
                        tx.setUpdatedAt(LocalDateTime.now());
                        transactionRepository.save(tx);
                    }
                });
            }
        });
    }

    /**
     * Admin approve for bank_transfer orders.
     * Same commission logic as gateway approval — called from admin endpoint.
     */
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
}
