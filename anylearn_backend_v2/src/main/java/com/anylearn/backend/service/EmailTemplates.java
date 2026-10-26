package com.anylearn.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public class EmailTemplates {

    public record TemplateInfo(String displayName, String file, List<String> vars) {}

    public static final Map<String, TemplateInfo> TEMPLATES = new LinkedHashMap<>() {{
        put("email-order_success", new TemplateInfo(
            "Xác nhận đơn hàng",
            "order_success.html",
            List.of("userName", "orderId", "items", "amount")
        ));
        put("email-activity_registration", new TemplateInfo(
            "Đăng ký hoạt động (gửi admin)",
            "activity_registration.html",
            List.of("studentName", "studentPhone", "activityType", "itemTitle", "date")
        ));
        put("email-schedule_reminder", new TemplateInfo(
            "Nhắc lịch học",
            "schedule_reminder.html",
            List.of("userName", "itemTitle", "date", "scheduleInfo")
        ));
        put("email-user_register", new TemplateInfo(
            "Chào mừng đăng ký",
            "user_register.html",
            List.of("userName", "phone")
        ));
        put("email-order_reminder", new TemplateInfo(
            "Nhắc thanh toán đơn hàng",
            "order_reminder.html",
            List.of("userName", "orderId", "amount", "deadline", "payUrl")
        ));
        put("email-order_cancelled", new TemplateInfo(
            "Đơn hàng đã hủy",
            "order_cancelled.html",
            List.of("userName", "orderId", "reason")
        ));
        put("email-admin_notice", new TemplateInfo(
            "Thông báo cho đội anyLEARN (đơn mới, chuyển khoản, hủy đăng ký...)",
            "admin_notice.html",
            List.of("title", "content")
        ));
    }};

    public static String loadDefault(String key) {
        TemplateInfo info = TEMPLATES.get(key);
        if (info == null) return null;
        try {
            var resource = new ClassPathResource("templates/email/" + info.file());
            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("[EmailTemplates] failed to load default template for key={}: {}", key, e.getMessage());
            return null;
        }
    }
}
