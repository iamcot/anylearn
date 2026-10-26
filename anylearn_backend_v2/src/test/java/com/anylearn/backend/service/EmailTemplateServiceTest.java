package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmailTemplateServiceTest {

    private final ConfigurationRepository configs = mock(ConfigurationRepository.class);
    private final EmailService emailService = mock(EmailService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final EmailTemplateService service = new EmailTemplateService(configs, emailService, users);

    private static User user(String name, String email) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        return user;
    }

    @Test
    void everyRegisteredTemplateHasAFileThatUsesItsVariables() {
        EmailTemplates.TEMPLATES.forEach((key, info) -> {
            String html = EmailTemplates.loadDefault(key);
            assertThat(html).as(key).isNotBlank();
            // schedule_reminder shows the whole line in itemTitle and keeps date for old customised copies
            info.vars().stream().filter(name -> !(key.equals("email-schedule_reminder") && name.equals("date")))
                    .forEach(name -> assertThat(html).as(key + " uses {{" + name + "}}").contains("{{" + name + "}}"));
        });
    }

    @Test
    void userNameIsFilledFromTheAccount() {
        User person = user("Lan", "lan@example.com");
        when(users.findById(7L)).thenReturn(Optional.of(person));
        service.sendToUser(7L, "email-order_cancelled", "Hủy", Map.of("orderId", "5", "reason", "Hết hạn"));
        verify(emailService).sendEmail(eq("lan@example.com"), eq("Hủy"), org.mockito.ArgumentMatchers.contains("Xin chào Lan"));
    }

    @Test
    void aPersonWithoutEmailGetsNothing() {
        when(users.findById(7L)).thenReturn(Optional.of(user("Lan", "")));
        service.sendToUser(7L, "email-order_cancelled", "Hủy", Map.of());
        verify(emailService, never()).sendEmail(any(), any(), any());
    }

    @Test
    void adminEmailsMergeTheEnvListAndTheBackOfficeRecipientsWithoutDuplicates() {
        ReflectionTestUtils.setField(service, "adminRecipients", "Team@Example.com, other@example.com");
        when(users.findAdminNotificationRecipients()).thenReturn(List.of(user("A", "team@example.com"), user("B", "b@example.com"), user("C", null)));
        service.sendToAdmins("Đơn mới", "email-admin_notice", Map.of("title", "Đơn mới", "content", "x"));
        verify(emailService, times(3)).sendEmail(any(), eq("Đơn mới"), any());
        verify(emailService).sendEmail(eq("b@example.com"), any(), any());
    }

    @Test
    void moneyUsesDotsAndTheDongSign() {
        assertThat(EmailTemplateService.money(1200000L)).isEqualTo("1.200.000đ");
        assertThat(EmailTemplateService.money(null)).isEqualTo("0đ");
    }

    @Test
    void testSendNeedsAKnownTemplateAndAnAddress() {
        assertThat(service.sendTest("email-nope", "a@b.c")).contains("Không tìm thấy");
        assertThat(service.sendTest("email-admin_notice", " ")).contains("chưa có email");
        assertThat(service.sendTest("email-admin_notice", "me@example.com")).isNull();
        verify(emailService).sendEmail(eq("me@example.com"), org.mockito.ArgumentMatchers.startsWith("[Gửi thử]"), any());
    }
}
