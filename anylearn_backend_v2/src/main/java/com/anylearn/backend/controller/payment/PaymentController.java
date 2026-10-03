package com.anylearn.backend.controller.payment;

import com.anylearn.backend.config.PaymentConfig;
import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.Order;
import com.anylearn.backend.entity.OrderDetail;
import com.anylearn.backend.entity.OrderStatus;
import com.anylearn.backend.entity.ItemConstants;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.OrderDetailRepository;
import com.anylearn.backend.repository.OrderRepository;
import com.anylearn.backend.service.payment.MomoService;
import com.anylearn.backend.service.payment.OnepayService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import com.anylearn.backend.service.payment.VnpayService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final VnpayService vnpayService;
    private final OnepayService onepayService;
    private final MomoService momoService;
    private final PaymentApprovalService approvalService;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ItemRepository itemRepository;
    private final PaymentConfig paymentConfig;

    // ── Admin approve (bank_transfer) ─────────────────────────────────────────

    @PostMapping("/api/admin/order/{orderId}/approve")
    public ApiResponse<?> adminApproveOrder(@PathVariable Long orderId,
                                             @RequestBody(required = false) Map<String, Object> body) {
        String note = body != null && body.get("note") != null ? body.get("note").toString() : "";
        String result = approvalService.adminApproveOrder(orderId, note);
        return "OK".equals(result) ? ApiResponse.ok("Đã xác nhận đơn hàng") : ApiResponse.fail(result);
    }

    // ── Bank transfer info (public) ───────────────────────────────────────────

    @GetMapping("/api/payment/bank-info")
    public ApiResponse<?> bankInfo() {
        var bt = paymentConfig.getBankTransfer();
        return ApiResponse.ok(Map.of(
                "bankName", bt.getBankName(),
                "accountNumber", bt.getAccountNumber(),
                "accountName", bt.getAccountName(),
                "transferContent", bt.getTransferContent(),
                "zaloPhone", bt.getZaloPhone()
        ));
    }

    // ── Cancel order ─────────────────────────────────────────────────────────

    @PostMapping("/api/order/{orderId}/cancel")
    public ApiResponse<?> cancelOrder(@PathVariable Long orderId,
                                      @AuthenticationPrincipal User user) {
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId()).orElse(null);
        if (order == null) return ApiResponse.fail("Không tìm thấy đơn hàng");
        if (!OrderStatus.NEW.equals(order.getStatus()) && !OrderStatus.PAY_PENDING.equals(order.getStatus()))
            return ApiResponse.fail("Không thể hủy đơn hàng ở trạng thái " + order.getStatus());
        order.setStatus(OrderStatus.CANCEL_BUYER);
        order.setUpdatedAt(java.time.LocalDateTime.now());
        orderRepository.save(order);
        log.info("cancelOrder: order {} cancelled by user {}", orderId, user.getId());
        return ApiResponse.ok("Đã hủy đơn hàng");
    }

    // ── Pending orders ────────────────────────────────────────────────────────

    @GetMapping("/api/payment/pending-orders")
    public ApiResponse<?> pendingOrders(@AuthenticationPrincipal User user) {
        var orders = orderRepository.findByUserIdAndStatusInOrderByIdDesc(
                user.getId(), List.of(OrderStatus.NEW, OrderStatus.PAY_PENDING));
        var result = new ArrayList<Map<String, Object>>();

        for (Order order : orders) {
            List<OrderDetail> details = orderDetailRepository.findByOrderId(order.getId());

            // Check all items are still active; auto-cancel if any is closed
            boolean hasInactiveItem = false;
            var items = new ArrayList<Map<String, Object>>();

            for (OrderDetail d : details) {
                var optItem = itemRepository.findById(d.getItemId());
                if (optItem.isEmpty()) {
                    hasInactiveItem = true;
                    log.warn("[pendingOrders] item {} not found, auto-cancelling order {}",
                            d.getItemId(), order.getId());
                    continue;
                }
                var item = optItem.get();
                boolean itemActive = ItemConstants.STATUS_ACTIVE == (item.getStatus() != null ? item.getStatus() : 0)
                        && ItemConstants.USERSTATUS_ACTIVE == (item.getUserStatus() != null ? item.getUserStatus() : 0);
                if (!itemActive) {
                    hasInactiveItem = true;
                    log.info("[pendingOrders] item {} (status={}, userStatus={}) is not active, auto-cancelling order {}",
                            item.getId(), item.getStatus(), item.getUserStatus(), order.getId());
                    continue;
                }
                var row = new LinkedHashMap<String, Object>();
                row.put("itemId", item.getId());
                row.put("title", item.getTitle());
                row.put("image", item.getImage() != null ? item.getImage() : "");
                items.add(row);
            }

            if (hasInactiveItem) {
                order.setStatus(OrderStatus.CANCEL_SYSTEM);
                order.setUpdatedAt(java.time.LocalDateTime.now());
                orderRepository.save(order);
                log.info("[pendingOrders] order {} auto-cancelled (CANCEL_SYSTEM) — item no longer active", order.getId());
                continue;
            }

            var row = new LinkedHashMap<String, Object>();
            row.put("orderId", String.valueOf(order.getId()));
            row.put("amount", order.getAmount());
            row.put("paymentMethod", order.getPayment() != null ? order.getPayment() : "");
            row.put("status", order.getStatus());
            row.put("items", items);
            result.add(row);
        }
        return ApiResponse.ok(result);
    }

    // ── Initiate payment ─────────────────────────────────────────────────────

    @PostMapping("/api/payment/initiate")
    public ApiResponse<Map<String, Object>> initiatePayment(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user,
            HttpServletRequest request) {

        String orderIdStr = String.valueOf(body.get("orderId"));
        long orderIdLong;
        try { orderIdLong = Long.parseLong(orderIdStr); }
        catch (NumberFormatException e) { return ApiResponse.fail("orderId không hợp lệ"); }

        Order order = orderRepository.findByIdAndUserId(orderIdLong, user.getId()).orElse(null);
        if (order == null) return ApiResponse.fail("Không tìm thấy đơn hàng");
        if (!OrderStatus.NEW.equals(order.getStatus()) && !OrderStatus.PAY_PENDING.equals(order.getStatus()))
            return ApiResponse.fail("Đơn hàng không ở trạng thái chờ thanh toán");

        // Allow overriding payment method (e.g. retry with a different method)
        String paymentMethod = body.get("paymentMethod") != null
                ? String.valueOf(body.get("paymentMethod"))
                : order.getPayment();
        if (!paymentMethod.equals(order.getPayment())) {
            order.setPayment(paymentMethod);
            orderRepository.save(order);
        }
        String clientIp = getClientIp(request);
        Map<String, Object> result = new HashMap<>();

        try {
            switch (paymentMethod) {
                case "bank_transfer" -> {
                    approvalService.setPayPending(orderIdLong);
                    result.put("method", "bank_transfer");
                    result.put("orderId", orderIdStr);
                }
                case "card" -> {
                    approvalService.setPayPending(orderIdLong);
                    String redirectUrl = onepayService.buildRedirectUrl(orderIdStr, order.getAmount(), clientIp);
                    result.put("redirectUrl", redirectUrl);
                }
                case "installment" -> {
                    approvalService.setPayPending(orderIdLong);
                    String redirectUrl = onepayService.buildInstallmentRedirectUrl(orderIdStr, order.getAmount(), clientIp);
                    result.put("redirectUrl", redirectUrl);
                }
                case "vnpay" -> {
                    approvalService.setPayPending(orderIdLong);
                    String redirectUrl = vnpayService.buildRedirectUrl(orderIdStr, order.getAmount(), clientIp);
                    result.put("redirectUrl", redirectUrl);
                }
                case "momo" -> {
                    approvalService.setPayPending(orderIdLong);
                    String payUrl = momoService.createPayment(orderIdStr, order.getAmount());
                    result.put("redirectUrl", payUrl);
                }
                default -> { return ApiResponse.fail("Phương thức thanh toán không được hỗ trợ: " + paymentMethod); }
            }
        } catch (Exception e) {
            log.error("Payment initiate error for order {}", orderIdLong, e);
            return ApiResponse.fail("Lỗi khởi tạo thanh toán: " + e.getMessage());
        }

        return ApiResponse.ok(result);
    }

    // ── VNPay ─────────────────────────────────────────────────────────────────

    @GetMapping("/payment-notify/vnpay")
    public Map<String, String> vnpayNotify(@RequestParam Map<String, String> params,
                                            HttpServletRequest request) {
        String clientIp = getClientIp(request);
        log.info("[VNPay notify] IP={} params={}", clientIp, params);
        Map<String, Object> verified = vnpayService.verifyCallback(params);
        boolean success = Boolean.TRUE.equals(verified.get("success"));
        String orderId = (String) verified.get("orderId");

        if (success && orderId != null) {
            try { approvalService.approveOrder(Long.parseLong(orderId), "vnpay"); }
            catch (Exception e) { log.error("VNPay approve error for order {}", orderId, e); }
        }
        log.info("[VNPay notify] orderId={} success={}", orderId, success);
        return success
                ? Map.of("RspCode", "00", "Message", "Confirm Success")
                : Map.of("RspCode", "99", "Message", "Failed");
    }

    @GetMapping("/payment-return/vnpay")
    public void vnpayReturn(@RequestParam Map<String, String> params, HttpServletResponse response) throws IOException {
        Map<String, Object> verified = vnpayService.verifyCallback(params);
        boolean success = Boolean.TRUE.equals(verified.get("success"));
        String orderId = (String) verified.get("orderId");
        // VNPay: order approved via IPN, return only redirects user
        if (!success && orderId != null) resetOrderOnFail(orderId);
        response.sendRedirect(buildFrontendOrderUrl(orderId, success));
    }

    // ── OnePay ────────────────────────────────────────────────────────────────

    @GetMapping("/payment-notify/onepay")
    @ResponseBody
    public String onepayNotify(@RequestParam Map<String, String> params,
                               HttpServletRequest request) {
        log.info("[OnePay notify] IP={} params={}", getClientIp(request), params);
        Map<String, Object> verified = onepayService.verifyCallback(params);
        boolean success = Boolean.TRUE.equals(verified.get("success"));
        String orderId = (String) verified.get("orderId");

        if (success && orderId != null) {
            try { approvalService.approveOrder(Long.parseLong(orderId), "card"); }
            catch (Exception e) { log.error("OnePay approve error for order {}", orderId, e); }
        }
        log.info("[OnePay notify] orderId={} success={}", orderId, success);
        return success ? "responsecode=1&desc=confirm-success" : "responsecode=0&desc=failed";
    }

    @GetMapping("/payment-return/onepay")
    public void onepayReturn(@RequestParam Map<String, String> params, HttpServletResponse response) throws IOException {
        Map<String, Object> verified = onepayService.verifyCallback(params);
        boolean success = Boolean.TRUE.equals(verified.get("success"));
        String orderId = (String) verified.get("orderId");

        if (success && orderId != null) {
            try { approvalService.approveOrder(Long.parseLong(orderId), "card"); }
            catch (Exception e) { log.error("OnePay return approve error for order {}", orderId, e); }
        }
        if (!success && orderId != null) resetOrderOnFail(orderId);
        response.sendRedirect(buildFrontendOrderUrl(orderId, success));
    }

    // ── OnePay TG (installment) ───────────────────────────────────────────────

    @GetMapping("/payment-notify/onepaytg")
    @ResponseBody
    public String onepayTgNotify(@RequestParam Map<String, String> params) {
        Map<String, Object> verified = onepayService.verifyInstallmentCallback(params);
        boolean success = Boolean.TRUE.equals(verified.get("success"));
        String orderId = (String) verified.get("orderId");
        if (success && orderId != null) {
            try { approvalService.approveOrder(Long.parseLong(orderId), "installment"); }
            catch (Exception e) { log.error("OnePay TG approve error for order {}", orderId, e); }
        }
        return success ? "responsecode=1&desc=confirm-success" : "responsecode=0&desc=failed";
    }

    @GetMapping("/payment-return/onepaytg")
    public void onepayTgReturn(@RequestParam Map<String, String> params, HttpServletResponse response) throws IOException {
        Map<String, Object> verified = onepayService.verifyInstallmentCallback(params);
        boolean success = Boolean.TRUE.equals(verified.get("success"));
        String orderId = (String) verified.get("orderId");
        if (success && orderId != null) {
            try { approvalService.approveOrder(Long.parseLong(orderId), "installment"); }
            catch (Exception e) { log.error("OnePay TG return approve error for order {}", orderId, e); }
        }
        if (!success && orderId != null) resetOrderOnFail(orderId);
        response.sendRedirect(buildFrontendOrderUrl(orderId, success));
    }

    // ── MoMo ─────────────────────────────────────────────────────────────────

    @PostMapping("/payment-notify/momo")
    public Map<String, Object> momoNotify(@RequestBody Map<String, Object> body,
                                          HttpServletRequest request) {
        log.info("[MoMo notify] IP={} body={}", getClientIp(request), body);
        Map<String, Object> verified = momoService.verifyCallback(body);
        boolean success = Boolean.TRUE.equals(verified.get("success"));
        String orderId = (String) verified.get("orderId");
        String momoOrderId = (String) verified.get("momoOrderId");
        long amount = (long) verified.getOrDefault("amount", 0L);
        String transId = (String) verified.getOrDefault("transId", "");

        if (success && orderId != null) {
            try { approvalService.approveOrder(Long.parseLong(orderId), "momo"); }
            catch (Exception e) { log.error("MoMo approve error for order {}", orderId, e); }
        }
        log.info("[MoMo notify] orderId={} success={}", orderId, success);
        return momoService.buildIpnAck(momoOrderId, transId, amount, success);
    }

    @GetMapping("/payment-return/momo")
    public void momoReturn(@RequestParam Map<String, String> params, HttpServletResponse response) throws IOException {
        // MoMo return uses query params (convert to Object map)
        Map<String, Object> bodyMap = new HashMap<>(params);
        Map<String, Object> verified = momoService.verifyCallback(bodyMap);
        boolean success = Boolean.TRUE.equals(verified.get("success"));
        String orderId = (String) verified.get("orderId");

        if (success && orderId != null) {
            try { approvalService.approveOrder(Long.parseLong(orderId), "momo"); }
            catch (Exception e) { log.error("MoMo return approve error for order {}", orderId, e); }
        }
        if (!success && orderId != null) resetOrderOnFail(orderId);
        response.sendRedirect(buildFrontendOrderUrl(orderId, success));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void resetOrderOnFail(String orderId) {
        try { approvalService.resetToNew(Long.parseLong(orderId)); }
        catch (Exception e) { log.error("resetToNew error for order {}", orderId, e); }
    }

    private String buildFrontendOrderUrl(String orderId, boolean success) {
        String base = paymentConfig.getFrontendUrl() + "/order/" + (orderId != null ? orderId : "");
        return base + "?status=" + (success ? "success" : "fail");
    }

    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty()) ip = ip.split(",")[0].trim();
        else ip = request.getRemoteAddr();
        // IPv6 loopback ::1 → fallback to 127.0.0.1 (OnePay rejects IPv6)
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) ip = "127.0.0.1";
        return ip;
    }
}
