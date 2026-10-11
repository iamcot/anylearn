package com.anylearn.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailService {

    @Value("${spring.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.log-only:false}")
    private boolean logOnly;

    @Value("${spring.mail.from:noreply@anylearn.vn}")
    private String fromEmail;

    private final JavaMailSender mailSender;

    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Async("emailExecutor")
    public void sendEmail(String to, String subject, String htmlBody) {
        if (!mailEnabled) {
            log.debug("[EMAIL] disabled — to={} subject={}", to, subject);
            return;
        }
        if (logOnly) {
            log.info("[EMAIL LOG-ONLY] to={} subject={}\n{}", to, subject, htmlBody);
            return;
        }
        if (mailSender == null) {
            log.warn("[EMAIL] no mailSender configured — to={} subject={}", to, subject);
            return;
        }
        try {
            var message = mailSender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("[EMAIL] sent — to={} subject={}", to, subject);
        } catch (Exception e) {
            log.error("[EMAIL] failed — to={} subject={} error={}", to, subject, e.getMessage());
        }
    }
}
