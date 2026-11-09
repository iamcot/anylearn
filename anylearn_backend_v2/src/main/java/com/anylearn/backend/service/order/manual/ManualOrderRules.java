package com.anylearn.backend.service.order.manual;

import com.anylearn.backend.service.signup.SignupRules;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Checks of an order an admin enters by hand (back office "Đơn hàng" > "Nhập đơn tay"). Pure: no Spring, no database.
 * The service passes whether the phone already has an account, since name and email are needed only to create one.
 */
public final class ManualOrderRules {

    private ManualOrderRules() {}

    /** Payment methods an admin can record; key = `orders.payment`. Keep in step with the admin page `ManualOrderModal.jsx`. */
    public static final Map<String, String> PAYMENTS = paymentMap();
    public static final int NOTE_MAX = 500;
    public static final int MAX_ORDERS_PER_CALL = 50;
    public static final int MAX_COURSES_PER_ORDER = 20;

    public record Line(Long itemId, Long scheduleId, String startDate) {}

    /**
     * One order of the form. `childId` picks a child the account already has; else `childName` (+ optional `childDob`
     * yyyy-MM-dd, `childDobYearOnly`) creates one, or reuses the child of the same name. `amount` = what was really collected
     * (null = the computed total). `paid` = the money is in: the order is approved at once (ZNS, enrollments, Foundation...).
     */
    public record Input(String phone, String name, String email,
                        boolean forChild, Long childId, String childName, String childDob, boolean childDobYearOnly,
                        List<Line> items, String payment, boolean paid, Long amount, String note) {}

    /** The problem to show for this order, or null when it can be created. */
    public static String problem(Input in, boolean accountExists) {
        if (in == null) return "Thiếu thông tin đơn hàng.";
        String phone = SignupRules.normalizePhone(in.phone());
        if (!SignupRules.validPhone(phone)) return "Số điện thoại không hợp lệ.";
        if (!accountExists) {
            // Same checks as a self registration; the password is made by the server.
            String signup = SignupRules.problem(in.name(), phone, in.email(), "000000");
            if (signup != null) return signup;
        }
        if (in.forChild() && in.childId() == null) {
            if (in.childName() == null || in.childName().trim().length() < 2) return "Vui lòng nhập tên của con.";
            if (in.childName().trim().length() > SignupRules.MAX_NAME_LENGTH) return "Tên của con quá dài.";
            if (in.childDob() != null && !in.childDob().isBlank()) {
                LocalDate dob = parseDate(in.childDob());
                if (dob == null) return "Ngày sinh của con không hợp lệ.";
                if (dob.isAfter(LocalDate.now())) return "Ngày sinh của con ở tương lai.";
            }
        }
        if (in.items() == null || in.items().isEmpty()) return "Chưa chọn khóa học.";
        if (in.items().size() > MAX_COURSES_PER_ORDER) return "Một đơn tối đa " + MAX_COURSES_PER_ORDER + " khóa học.";
        Set<Long> seen = new HashSet<>();
        for (Line line : in.items()) {
            if (line == null || line.itemId() == null) return "Có khóa học chưa chọn.";
            if (!seen.add(line.itemId())) return "Một khóa học được chọn hai lần trong cùng đơn.";
            if (line.startDate() != null && !line.startDate().isBlank() && parseDate(line.startDate()) == null)
                return "Ngày khai giảng không hợp lệ.";
        }
        if (in.payment() == null || !PAYMENTS.containsKey(in.payment())) return "Chọn hình thức thanh toán.";
        if (in.amount() != null && in.amount() < 0) return "Số tiền không được âm.";
        if (in.note() != null && in.note().length() > NOTE_MAX) return "Ghi chú tối đa " + NOTE_MAX + " ký tự.";
        return null;
    }

    static LocalDate parseDate(String raw) {
        try {
            return LocalDate.parse(raw.trim().substring(0, Math.min(10, raw.trim().length())));
        } catch (Exception e) {
            return null;
        }
    }

    private static Map<String, String> paymentMap() {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("bank_transfer", "Chuyển khoản");
        map.put("cash", "Tiền mặt");
        map.put("card", "Thẻ");
        map.put("other", "Khác");
        return java.util.Collections.unmodifiableMap(map);
    }
}
