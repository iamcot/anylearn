package com.anylearn.backend.service.zns;

import com.anylearn.backend.service.payment.bank.TransferNote;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * The Zalo ZNS templates approved for anyLEARN (docs/zns-templates.md) and the data each one is sent with. Pure: no Spring,
 * no database. The parameter names must be exactly the ones of the template registered on Zalo; a missing or extra name
 * makes Zalo refuse the message. Values are always strings (numbers as plain digits, dates dd/MM/yyyy, date and time HH:mm dd/MM/yyyy).
 */
public final class ZnsTemplates {

    public static final String ORDER_SUCCESS = "order_success";
    public static final String ORDER_REMINDER = "order_reminder";
    public static final String COURSE_START = "course_start";
    public static final String MID_SURVEY = "mid_survey";
    /** An admin created the account while entering an order by hand (no approved id yet: the team types it in the back office). */
    public static final String ACCOUNT_CREATED = "account_created";

    /** Lengths kept under Zalo's usual limits (name 30, short text 100); longer values are cut with "…". */
    static final int NAME_MAX = 30;
    static final int TEXT_MAX = 100;
    static final int CODE_MAX = 30;

    /** CSKH templates may only go out in this window (hour from inclusive, to exclusive). */
    public static final int SEND_FROM_HOUR = 8;
    public static final int SEND_TO_HOUR = 21;

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    public record Def(String key, String label, String defaultTemplateId, String when, List<String> params,
                      Map<String, String> sample) {}

    public static final List<Def> DEFS = List.of(
            new Def(ORDER_SUCCESS, "Xác nhận đăng ký thành công", "659722",
                    "Đơn hàng được thanh toán (giao dịch, gửi ngay)",
                    List.of("customer_name", "order_code", "course_name", "learner", "price", "date", "phone_number"),
                    orderSuccess("Nguyễn Văn An", 1234L, List.of("Piano cơ bản cho bé"), List.of("Bin"), 1500000L,
                            LocalDate.of(2026, 11, 2), "0901234567")),
            new Def(ORDER_REMINDER, "Nhắc thanh toán đơn hàng", "659976",
                    "Đơn chưa thanh toán sau mốc nhắc thứ 2 (mặc định 24 giờ), trong khung 8h-21h",
                    List.of("customer_name", "order_code", "amount", "bank_transfer_note", "deadline"),
                    orderReminder("Nguyễn Văn An", 1234L, 1500000L, LocalDateTime.of(2026, 11, 5, 10, 0))),
            new Def(COURSE_START, "Lớp học sắp khai giảng", "659979",
                    "Mốc nhắc gần nhất trước buổi học đầu (mặc định 1 ngày), trong khung 8h-21h",
                    List.of("customer_name", "order_code", "date", "course_name", "start_time"),
                    courseStart("Nguyễn Văn An", 1234L, LocalDate.of(2026, 11, 2), "Piano cơ bản cho bé", LocalDate.of(2026, 11, 9), LocalTime.of(18, 0))),
            new Def(MID_SURVEY, "Khảo sát giữa khóa", "659981",
                    "Học được nửa số buổi (cài đặt khảo sát giữa khóa), trong khung 8h-21h",
                    List.of("order_code", "date", "course_name", "learner_name"),
                    midSurvey(1234L, LocalDate.of(2026, 11, 2), "Piano cơ bản cho bé", "Bin")),
            new Def(ACCOUNT_CREATED, "Tài khoản đã được tạo", "",
                    "Admin nhập đơn hàng bằng tay cho một số điện thoại chưa có tài khoản (giao dịch, gửi ngay)",
                    List.of("customer_name", "phone_number"),
                    accountCreated("Nguyễn Văn An", "0901234567")));

    private ZnsTemplates() {}

    public static Optional<Def> def(String key) {
        return DEFS.stream().filter(def -> def.key().equals(key)).findFirst();
    }

    /** Template 659722: an order was paid. One message per order; several courses and learners are joined. */
    public static Map<String, String> orderSuccess(String customerName, long orderId, List<String> courseTitles,
                                                   List<String> learnerNames, Long amount, LocalDate paidDate, String phone) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("customer_name", name(customerName, phone));
        data.put("order_code", orderCode(orderId));
        data.put("course_name", cut(joinTitles(courseTitles), TEXT_MAX));
        data.put("learner", cut(String.join(", ", distinct(learnerNames)), NAME_MAX));
        data.put("price", number(amount));
        data.put("date", date(paidDate));
        data.put("phone_number", phone == null ? "" : phone.trim());
        return data;
    }

    /** Template 659976: an order still waits for payment; the note is what the buyer writes in the bank transfer. */
    public static Map<String, String> orderReminder(String customerName, long orderId, Long amount, LocalDateTime deadline) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("customer_name", name(customerName, null));
        data.put("order_code", orderCode(orderId));
        data.put("amount", number(amount));
        data.put("bank_transfer_note", transferNote(orderId));
        data.put("deadline", deadline == null ? "" : deadline.format(DATE_TIME));
        return data;
    }

    /** Template 659979: the first session is near. `orderDate` = when the order was placed; `startTime` may be null (date only). */
    public static Map<String, String> courseStart(String customerName, long orderId, LocalDate orderDate, String courseName,
                                                  LocalDate startDate, LocalTime startTime) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("customer_name", name(customerName, null));
        data.put("order_code", orderCode(orderId));
        data.put("date", date(orderDate));
        data.put("course_name", cut(courseName, TEXT_MAX));
        data.put("start_time", startDate == null ? "" : startTime == null ? date(startDate) : startDate.atTime(startTime).format(DATE_TIME));
        return data;
    }

    /** Template 659981: half of the course is over, ask for a score. */
    public static Map<String, String> midSurvey(long orderId, LocalDate orderDate, String courseName, String learnerName) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("order_code", orderCode(orderId));
        data.put("date", date(orderDate));
        data.put("course_name", cut(courseName, TEXT_MAX));
        data.put("learner_name", cut(blankToNull(learnerName) == null ? "Học viên" : learnerName.trim(), NAME_MAX));
        return data;
    }

    /**
     * Template "Tài khoản đã được tạo": the phone is the login. No password is sent (owner's choice, 2026-11-09): the person
     * sets one with "Quên mật khẩu" (OTP).
     */
    public static Map<String, String> accountCreated(String customerName, String phone) {
        Map<String, String> data = new LinkedHashMap<>();
        data.put("customer_name", name(customerName, phone));
        data.put("phone_number", phone == null ? "" : phone.trim());
        return data;
    }

    /** True when a CSKH message may be sent at this hour. */
    public static boolean inSendWindow(int hour) {
        return hour >= SEND_FROM_HOUR && hour < SEND_TO_HOUR;
    }

    public static String transferNote(long orderId) {
        return TransferNote.forOrder(orderId); // the SePay webhook reads it back to match the transfer
    }

    static String orderCode(long orderId) {
        return cut(String.valueOf(orderId), CODE_MAX);
    }

    static String name(String name, String fallback) {
        String value = blankToNull(name);
        if (value == null) value = blankToNull(fallback);
        return cut(value == null ? "bạn" : value, NAME_MAX);
    }

    static String number(Long amount) {
        return String.valueOf(amount == null ? 0L : Math.max(0L, amount));
    }

    static String date(LocalDate date) {
        return date == null ? "" : date.format(DATE);
    }

    static String joinTitles(List<String> titles) {
        List<String> list = distinct(titles);
        if (list.isEmpty()) return "";
        if (list.size() == 1) return list.get(0);
        return list.get(0) + " và " + (list.size() - 1) + " khóa khác";
    }

    static String cut(String text, int max) {
        if (text == null) return "";
        String value = text.trim().replaceAll("\\s+", " ");
        if (value.length() <= max) return value;
        return value.substring(0, max - 1).trim() + "…";
    }

    private static List<String> distinct(List<String> values) {
        if (values == null) return List.of();
        return values.stream().map(ZnsTemplates::blankToNull).filter(v -> v != null).distinct().toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
