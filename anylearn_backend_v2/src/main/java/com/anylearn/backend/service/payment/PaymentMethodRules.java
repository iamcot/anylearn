package com.anylearn.backend.service.payment;

import java.util.List;
import java.util.Optional;

/** Which payment methods exist and when one is offered. Pure; the switches and amounts are saved by {@link PaymentMethodService}. */
public final class PaymentMethodRules {

    /** A method the checkout can offer: `min` / `max` are the order totals (VND) between which it shows, 0 = no limit. */
    public record Definition(String key, String label, long defaultMin, long defaultMax) {}

    public static final List<Definition> DEFINITIONS = List.of(
            new Definition("bank_transfer", "Chuyển khoản ngân hàng hoặc thanh toán tại trường", 0, 0),
            new Definition("card", "Thanh toán trực tuyến bằng thẻ", 0, 0),
            new Definition("vnpay", "Quét mã QR qua VNPay", 0, 0),
            new Definition("momo", "Thanh toán bằng ví MoMo", 1_000, 50_000_000),
            new Definition("installment", "Trả góp 0% lãi suất qua thẻ tín dụng, kỳ hạn 3 tháng", 3_000_000, 0));

    private PaymentMethodRules() {}

    public static Optional<Definition> definition(String key) {
        return DEFINITIONS.stream().filter(d -> d.key().equals(key)).findFirst();
    }

    public static boolean offered(boolean enabled, long min, long max, long total) {
        return enabled && total >= min && (max <= 0 || total <= max);
    }

    /** Problem to show when the saved list cannot work, or null. */
    public static String problem(long min, long max, String label) {
        if (min < 0 || max < 0) return "Số tiền của \"" + label + "\" không được âm";
        if (max > 0 && max < min) return "\"" + label + "\": mức tối đa phải lớn hơn mức tối thiểu";
        return null;
    }
}
