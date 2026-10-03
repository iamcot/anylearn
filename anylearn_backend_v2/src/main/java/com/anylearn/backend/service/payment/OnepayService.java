package com.anylearn.backend.service.payment;

import com.anylearn.backend.config.PaymentConfig;
import com.anylearn.backend.config.PaymentConfig.OnepayProps;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OnepayService {

    private final PaymentConfig config;

    // onepayfee — thẻ nội địa
    public String buildRedirectUrl(String orderId, long amount, String clientIp) {
        return buildRedirectUrl(orderId, amount, clientIp, config.getOnepay(), "onepay");
    }

    // onepaytg — trả góp quốc tế
    public String buildInstallmentRedirectUrl(String orderId, long amount, String clientIp) {
        return buildRedirectUrl(orderId, amount, clientIp, config.getOnepaytg(), "onepaytg");
    }

    public Map<String, Object> verifyCallback(Map<String, String> params) {
        return verifyCallback(params, config.getOnepay());
    }

    public Map<String, Object> verifyInstallmentCallback(Map<String, String> params) {
        return verifyCallback(params, config.getOnepaytg());
    }

    private String buildRedirectUrl(String orderId, long amount, String clientIp,
                                    OnepayProps props, String gatewayName) {
        String returnUrl = config.getCallbackBaseUrl() + "/payment-return/" + gatewayName;
        String notifyUrl = config.getCallbackBaseUrl() + "/payment-notify/" + gatewayName;
        String txnRef = orderId + (System.currentTimeMillis() / 1000);

        Map<String, String> params = new TreeMap<>();
        params.put("vpc_Version", "2");
        params.put("vpc_Currency", "VND");
        params.put("vpc_Command", "pay");
        params.put("vpc_AccessCode", props.getAccessCode());
        params.put("vpc_Merchant", props.getMerchant());
        params.put("vpc_Locale", "vn");
        params.put("vpc_ReturnURL", returnUrl);
        params.put("vpc_MerchTxnRef", txnRef);
        params.put("vpc_OrderInfo", orderId);
        params.put("vpc_Amount", String.valueOf(amount * 100));
        params.put("AgainLink", notifyUrl);
        params.put("Title", "anyLEARN");
        params.put("vpc_TicketNo", clientIp != null ? clientIp : "127.0.0.1");

        String secureHash = hashAll(params, props.getSecret());
        params.put("vpc_SecureHash", secureHash);

        StringBuilder sb = new StringBuilder(props.getServer()).append('?');
        boolean first = true;
        for (Map.Entry<String, String> e : params.entrySet()) {
            if (!first) sb.append('&');
            sb.append(URLEncoder.encode(e.getKey(), StandardCharsets.UTF_8))
              .append('=')
              .append(URLEncoder.encode(e.getValue(), StandardCharsets.UTF_8));
            first = false;
        }
        String redirectUrl = sb.toString();
        log.info("[OnePay-{}] orderId={} amount={} accessCode={} returnUrl={}",
                gatewayName, orderId, amount, props.getAccessCode(), returnUrl);
        log.info("[OnePay-{}] redirectUrl={}", gatewayName, redirectUrl);
        return redirectUrl;
    }

    private Map<String, Object> verifyCallback(Map<String, String> params, OnepayProps props) {
        String receivedHash = params.get("vpc_SecureHash");
        Map<String, String> verifyParams = new TreeMap<>(params);
        verifyParams.remove("vpc_SecureHash");

        String computedHash = hashAll(verifyParams, props.getSecret());
        boolean hashValid = computedHash.equalsIgnoreCase(receivedHash);

        String orderId = params.get("vpc_OrderInfo");
        String responseCode = params.get("vpc_TxnResponseCode");
        String amountStr = params.get("vpc_Amount");
        long amount = amountStr != null ? Long.parseLong(amountStr) / 100 : 0;
        boolean success = "0".equals(responseCode);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hashValid", hashValid);
        result.put("success", hashValid && success);
        result.put("orderId", orderId);
        result.put("amount", amount);
        result.put("transId", params.get("vpc_MerchTxnRef"));
        return result;
    }

    private String hashAll(Map<String, String> params, String hexSecret) {
        StringBuilder data = new StringBuilder();
        for (Map.Entry<String, String> e : new TreeMap<>(params).entrySet()) {
            String key = e.getKey();
            String value = e.getValue();
            if (value == null || value.isEmpty()) continue;
            if (key.startsWith("vpc_") || key.startsWith("user_")) {
                if (!data.isEmpty()) data.append('&');
                data.append(key).append('=').append(value);
            }
        }
        try {
            byte[] keyBytes = hexToBytes(hexSecret);
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keyBytes, "HmacSHA256"));
            byte[] result = mac.doFinal(data.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : result) sb.append(String.format("%02X", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("OnePay HMAC error", e);
        }
    }

    private byte[] hexToBytes(String hex) {
        int len = hex.length();
        byte[] data = new byte[len / 2];
        for (int i = 0; i < len; i += 2) {
            data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
                                 + Character.digit(hex.charAt(i + 1), 16));
        }
        return data;
    }
}
