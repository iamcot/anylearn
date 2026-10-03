package com.anylearn.backend.service.payment;

import com.anylearn.backend.config.PaymentConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MomoService {

    private final PaymentConfig config;
    private final ObjectMapper objectMapper;

    private static final String ORDER_ID_SEPARATOR = "Al";

    public String createPayment(String orderId, long amount) {
        String returnUrl = config.getCallbackBaseUrl() + "/payment-return/momo";
        String ipnUrl = config.getCallbackBaseUrl() + "/payment-notify/momo";
        String requestId = String.valueOf(System.currentTimeMillis());
        String momoOrderId = orderId + ORDER_ID_SEPARATOR + randomAlphanumeric(20);
        String orderInfo = "Thanh toán đơn hàng anyLEARN";

        String rawHash = "accessKey=" + config.getMomo().getAccessKey()
                + "&amount=" + amount
                + "&extraData="
                + "&ipnUrl=" + ipnUrl
                + "&orderId=" + momoOrderId
                + "&orderInfo=" + orderInfo
                + "&partnerCode=" + config.getMomo().getPartnerCode()
                + "&redirectUrl=" + returnUrl
                + "&requestId=" + requestId
                + "&requestType=captureWallet";

        String signature = hmacSha256(config.getMomo().getSecretKey(), rawHash);

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("partnerCode", config.getMomo().getPartnerCode());
        body.put("requestId", requestId);
        body.put("amount", amount);
        body.put("orderId", momoOrderId);
        body.put("orderInfo", orderInfo);
        body.put("redirectUrl", returnUrl);
        body.put("ipnUrl", ipnUrl);
        body.put("requestType", "captureWallet");
        body.put("extraData", "");
        body.put("lang", "vi");
        body.put("signature", signature);

        try {
            String bodyJson = objectMapper.writeValueAsString(body);
            log.info("[MoMo] orderId={} momoOrderId={} amount={} partnerCode={}",
                    orderId, momoOrderId, amount, config.getMomo().getPartnerCode());
            log.info("[MoMo] API endpoint={}", config.getMomo().getServer() + "/v2/gateway/api/create");
            log.debug("[MoMo] rawHash={}", rawHash);
            log.debug("[MoMo] requestBody={}", bodyJson);
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(config.getMomo().getServer() + "/v2/gateway/api/create"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(bodyJson))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            Map<?, ?> result = objectMapper.readValue(response.body(), Map.class);
            log.info("[MoMo] response status={} body={}", response.statusCode(), response.body());
            Object payUrl = result.get("payUrl");
            if (payUrl == null) throw new RuntimeException("MoMo did not return payUrl: " + response.body());
            log.info("[MoMo] payUrl={}", payUrl);
            return payUrl.toString();
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("MoMo API error: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> verifyCallback(Map<String, Object> params) {
        Object rawOrderId = params.get("orderId");
        Object resultCode = params.get("resultCode");
        Object amount = params.get("amount");
        Object transId = params.get("transId");

        String momoOrderId = rawOrderId != null ? rawOrderId.toString() : "";
        String realOrderId = extractRealOrderId(momoOrderId);
        boolean success = "0".equals(String.valueOf(resultCode));

        long amountLong = 0;
        if (amount != null) {
            try { amountLong = Long.parseLong(amount.toString()); } catch (NumberFormatException ignored) {}
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("success", success);
        result.put("orderId", realOrderId);
        result.put("momoOrderId", momoOrderId);
        result.put("amount", amountLong);
        result.put("transId", transId != null ? transId.toString() : "");
        return result;
    }

    public Map<String, Object> buildIpnAck(String momoOrderId, String transId, long amount, boolean success) {
        String status = success ? "0" : "1";
        String message = success ? "Order confirmed" : "Order failed";
        String rawHash = "status=" + status
                + "&message=" + message
                + "&amount=" + amount
                + "&billId=" + momoOrderId
                + "&momoTransId=" + transId;
        String signature = hmacSha256(config.getMomo().getSecretKey(), rawHash);
        Map<String, Object> ack = new LinkedHashMap<>();
        ack.put("status", status);
        ack.put("message", message);
        ack.put("data", Map.of("billId", momoOrderId, "momoTransId", transId, "amount", String.valueOf(amount)));
        ack.put("signature", signature);
        return ack;
    }

    private String extractRealOrderId(String momoOrderId) {
        int idx = momoOrderId.indexOf(ORDER_ID_SEPARATOR);
        return idx > 0 ? momoOrderId.substring(0, idx) : momoOrderId;
    }

    private String randomAlphanumeric(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
        return sb.toString();
    }

    private String hmacSha256(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("MoMo HMAC error", e);
        }
    }
}
