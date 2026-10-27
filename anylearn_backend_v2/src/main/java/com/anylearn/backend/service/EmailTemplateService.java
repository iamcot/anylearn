package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailTemplateService {

    private final ConfigurationRepository configurationRepository;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @Value("${admin.email.recipients:}")
    private String adminRecipients;

    /** Returns custom template from DB if exists, else loads default HTML file. */
    public String getTemplate(String key) {
        return configurationRepository.findByKey(key)
                .map(c -> c.getValue())
                .filter(v -> v != null && !v.isBlank())
                .orElseGet(() -> EmailTemplates.loadDefault(key));
    }

    /** True if admin has saved a custom override for this template key. */
    public boolean isCustomized(String key) {
        return configurationRepository.findByKey(key).isPresent();
    }

    /** Replace {{varName}} placeholders in the template with provided values. */
    public String render(String template, Map<String, String> vars) {
        if (template == null) return "";
        String result = template;
        for (var entry : vars.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
        }
        return result;
    }

    /** Resolve template, render with vars, send to user's email if they have one. `userName` is filled from the account when not given. */
    public void sendToUser(Long userId, String templateKey, String subject, Map<String, String> givenVars) {
        userRepository.findById(userId).ifPresent(user -> {
            Map<String, String> vars = new HashMap<>(givenVars);
            vars.putIfAbsent("userName", user.getName() != null && !user.getName().isBlank() ? user.getName() : "bạn");
            if (user.getEmail() == null || user.getEmail().isBlank()) {
                log.info("[EmailTemplateService] skip userId={} — no email", userId);
                return;
            }
            String template = getTemplate(templateKey);
            if (template == null) { log.warn("[EmailTemplateService] no template for key={}", templateKey); return; }
            log.info("[EmailTemplateService] sending key={} to={}", templateKey, user.getEmail());
            emailService.sendEmail(user.getEmail(), subject, render(template, vars));
        });
    }

    /** Render and send to every back office recipient: the addresses in application.yml plus the admins and members added in the back office. */
    public void sendToAdmins(String subject, String templateKey, Map<String, String> vars) {
        Set<String> emails = adminEmails();
        if (emails.isEmpty()) return;
        String template = getTemplate(templateKey);
        if (template == null) { log.warn("[EmailTemplateService] no template for key={}", templateKey); return; }
        String html = render(template, vars);
        emails.forEach(email -> emailService.sendEmail(email, subject, html));
    }

    private Set<String> adminEmails() {
        Set<String> emails = new LinkedHashSet<>();
        if (adminRecipients != null) {
            for (String email : adminRecipients.split(",")) if (!email.isBlank()) emails.add(email.trim().toLowerCase());
        }
        for (User recipient : userRepository.findAdminNotificationRecipients()) {
            if (recipient.getEmail() != null && !recipient.getEmail().isBlank()) emails.add(recipient.getEmail().trim().toLowerCase());
        }
        return emails;
    }

    /** "1.200.000đ" */
    public static String money(Long amount) {
        long value = amount == null ? 0 : amount;
        return java.text.NumberFormat.getIntegerInstance(new java.util.Locale("vi", "VN")).format(value) + "đ";
    }

    private static final Map<String, String> SAMPLE_VALUES = Map.ofEntries(
            Map.entry("userName", "Nguyễn Văn A"), Map.entry("orderId", "1234"),
            Map.entry("items", "Piano cơ bản; Tiếng Anh giao tiếp"), Map.entry("amount", "1.200.000đ"),
            Map.entry("deadline", "18:00 ngày 30/10"), Map.entry("payUrl", "https://anylearn.vn/order/1234"),
            Map.entry("reason", "Đơn hàng đã hết hạn thanh toán nên được hủy."), Map.entry("phone", "0900000000"),
            Map.entry("itemTitle", "Piano cơ bản lúc 17:00 vào ngày mai"), Map.entry("date", "30/10/2026"),
            Map.entry("scheduleInfo", "Mở lịch học để xem chi tiết"), Map.entry("studentName", "Bé An"),
            Map.entry("studentPhone", "0900000000"), Map.entry("activityType", "Học thử"),
            Map.entry("learnerName", "Bé An"), Map.entry("startDate", "02/11/2026 lúc 17:30"), Map.entry("daysText", "ngày mai"),
            Map.entry("classInfo", "• Piano cơ bản<br>&nbsp;&nbsp;&nbsp;Giờ tập trung: 17:15<br>&nbsp;&nbsp;&nbsp;Mang theo: Sách bài tập"),
            Map.entry("todayUrl", "https://anylearn.vn/today"), Map.entry("misses", "2"),
            Map.entry("surveyUrl", "https://anylearn.vn/today?survey=1"),
            Map.entry("message", "Bé An còn 2 buổi Piano cơ bản. Gia hạn để học tiếp →"),
            Map.entry("ctaUrl", "https://anylearn.vn/today"),
            Map.entry("title", "Đơn hàng mới cần duyệt"), Map.entry("content", "Đơn #1234 · Nguyễn Văn A · Piano cơ bản"));

    /** Sends the saved (or default) template with sample values, so the team can see how it looks. Returns the problem, or null. */
    public String sendTest(String templateKey, String to) {
        var info = EmailTemplates.TEMPLATES.get(templateKey);
        if (info == null) return "Không tìm thấy template: " + templateKey;
        if (to == null || to.isBlank()) return "Tài khoản của bạn chưa có email";
        String template = getTemplate(templateKey);
        if (template == null) return "Template không có nội dung";
        Map<String, String> vars = new HashMap<>();
        info.vars().forEach(name -> vars.put(name, SAMPLE_VALUES.getOrDefault(name, name)));
        emailService.sendEmail(to.trim(), "[Gửi thử] " + info.displayName(), render(template, vars));
        return null;
    }
}
