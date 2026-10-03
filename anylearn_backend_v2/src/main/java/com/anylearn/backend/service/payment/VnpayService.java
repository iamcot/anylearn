package com.anylearn.backend.service.payment;

import com.anylearn.backend.config.PaymentConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VnpayService {

    private final PaymentConfig config;

    public String buildRedirectUrl(String orderId, long amount, String clientIp) {
        String returnUrl = config.getCallbackBaseUrl() + "/payment-return/vnpay";

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", config.getVnpay().getTmnCode());
        params.put("vnp_Amount", String.valueOf(amount * 100));
        params.put("vnp_CreateDate", new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_IpAddr", clientIp != null ? clientIp : "127.0.0.1");
        params.put("vnp_Locale", "vn");
        params.put("vnp_OrderInfo", orderId);
        params.put("vnp_OrderType", "other");
        params.put("vnp_ReturnUrl", returnUrl);
        params.put("vnp_TxnRef", orderId);
        // Expire in 30 minutes
        Calendar cal = Calendar.getInstance();
        cal.add(Calendar.MINUTE, 30);
        params.put("vnp_ExpireDate", new SimpleDateFormat("yyyyMMddHHmmss").format(cal.getTime()));

        String hashData = buildHashData(params);
        String secureHash = hmacSha512(config.getVnpay().getSecret(), hashData);
        params.put("vnp_SecureHash", secureHash);

        String redirectUrl = config.getVnpay().getServer() + "?" + buildQueryString(params);
        log.info("[VNPay] orderId={} amount={} tmnCode={} returnUrl={}",
                orderId, amount, config.getVnpay().getTmnCode(), returnUrl);
        log.debug("[VNPay] hashData={}", hashData);
        log.info("[VNPay] redirectUrl={}", redirectUrl);
        return redirectUrl;
    }

    public Map<String, Object> verifyCallback(Map<String, String> params) {
        String receivedHash = params.get("vnp_SecureHash");
        Map<String, String> verifyParams = new TreeMap<>(params);
        verifyParams.remove("vnp_SecureHash");
        verifyParams.remove("vnp_SecureHashType");

        String computedHash = hmacSha512(config.getVnpay().getSecret(), buildHashData(verifyParams));
        boolean hashValid = computedHash.equalsIgnoreCase(receivedHash);

        String orderId = params.get("vnp_OrderInfo");
        String transactionStatus = params.get("vnp_TransactionStatus");
        String amountStr = params.get("vnp_Amount");
        long amount = amountStr != null ? Long.parseLong(amountStr) / 100 : 0;
        boolean success = "00".equals(transactionStatus);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("hashValid", hashValid);
        result.put("success", hashValid && success);
        result.put("orderId", orderId);
        result.put("amount", amount);
        result.put("transId", params.get("vnp_TransactionNo"));
        return result;
    }

    private String buildHashData(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (Map.Entry<String, String> e : new TreeMap<>(params).entrySet()) {
            if (e.getValue() == null || e.getValue().isEmpty()) continue;
            if (!first) sb.append('&');
            sb.append(urlEncode(e.getKey())).append('=').append(urlEncode(e.getValue()));
            first = false;
        }
        return sb.toString();
    }

    private String buildQueryString(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> e : params.entrySet()) {
            if (!sb.isEmpty()) sb.append('&');
            sb.append(urlEncode(e.getKey())).append('=').append(urlEncode(e.getValue()));
        }
        return sb.toString();
    }

    private String urlEncode(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private String hmacSha512(String key, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA512"));
            byte[] bytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("VNPay HMAC error", e);
        }
    }
}
