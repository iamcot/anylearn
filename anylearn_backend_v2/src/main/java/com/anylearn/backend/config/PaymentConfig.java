package com.anylearn.backend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "payment")
@Data
public class PaymentConfig {

    private String baseUrl = "http://localhost:8080";
    // callbackBaseUrl: URL gốc mà gateway gọi về (notify/return).
    // Local: http://localhost:8080/v2  (có context path)
    // Production: https://anylearn.vn  (URL đã đăng ký với gateway, không có /v2)
    private String callbackBaseUrl = "http://localhost:8080/v2";
    private String frontendUrl = "http://localhost:3000";
    private VnpayProps vnpay = new VnpayProps();
    private OnepayProps onepay = new OnepayProps();    // onepayfee — thẻ nội địa
    private OnepayProps onepaytg = new OnepayProps();   // onepaytg — trả góp quốc tế
    private MomoProps momo = new MomoProps();
    private BankTransferProps bankTransfer = new BankTransferProps();

    @Data
    public static class BankTransferProps {
        private String bankName = "MB Bank";
        private String accountNumber = "";
        private String accountName = "";
        private String transferContent = "[Họ tên] + [Số điện thoại]";
        private String zaloPhone = "";
    }

    @Data
    public static class VnpayProps {
        private String server = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
        private String tmnCode;
        private String secret;
    }

    @Data
    public static class OnepayProps {
        private String server = "https://mtf.onepay.vn/paygate/vpcpay.op";
        private String accessCode;
        private String merchant;
        private String secret;
    }

    @Data
    public static class MomoProps {
        private String server = "https://test-payment.momo.vn";
        private String partnerCode;
        private String accessKey;
        private String secretKey;
    }
}
