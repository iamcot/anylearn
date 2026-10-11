package com.anylearn.backend.service;

import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

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

    /** Resolve template, render with vars, send to user's email if they have one. */
    public void sendToUser(Long userId, String templateKey, String subject, Map<String, String> vars) {
        userRepository.findById(userId).ifPresent(user -> {
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

    /** Render and send to all admin recipients defined in application.yml. */
    public void sendToAdmins(String subject, String templateKey, Map<String, String> vars) {
        if (adminRecipients == null || adminRecipients.isBlank()) return;
        String template = getTemplate(templateKey);
        if (template == null) { log.warn("[EmailTemplateService] no template for key={}", templateKey); return; }
        String html = render(template, vars);
        for (String email : adminRecipients.split(",")) {
            String trimmed = email.trim();
            if (!trimmed.isBlank()) emailService.sendEmail(trimmed, subject, html);
        }
    }
}
