package com.anylearn.backend.service.zns;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.ZnsService;
import com.anylearn.backend.service.notifications.NotificationPrefsService;
import com.anylearn.backend.service.notifications.NotificationTopics;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.Map;
import java.util.concurrent.Executor;

/**
 * Sends the approved ZNS templates to an account's phone. Every message is first claimed in `zns_messages` (unique
 * `dedup_key`, INSERT IGNORE, inside the caller's transaction), then sent after the commit on {@code znsExecutor}, so a
 * slow or failing Zalo call never delays or breaks the order / lifecycle code that asked for it. Skipped silently when the
 * template is off, the account has no phone, or the person switched the Zalo channel of that notification type off.
 */
@Service
@Slf4j
public class ZnsNotifier {

    private final JdbcTemplate jdbc;
    private final ZnsService zns;
    private final ZnsTemplateSettings settings;
    private final NotificationPrefsService prefs;
    private final UserRepository userRepository;
    private final Executor executor;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ZnsNotifier(JdbcTemplate jdbc, ZnsService zns, ZnsTemplateSettings settings, NotificationPrefsService prefs,
                       UserRepository userRepository, @Qualifier("znsExecutor") Executor executor) {
        this.jdbc = jdbc;
        this.zns = zns;
        this.settings = settings;
        this.prefs = prefs;
        this.userRepository = userRepository;
        this.executor = executor;
    }

    /**
     * Queues one template message for an account (a child's message goes to the parent: pass the account id).
     * `notificationType` decides the Zalo switch of Tài khoản > Thông báo (a transactional type is always sent).
     * Returns true when the message was queued now (false = off, no phone, switched off or already sent).
     */
    public boolean send(Long accountId, String notificationType, String templateKey, String dedupKey, Map<String, String> data) {
        try {
            String templateId = settings.activeTemplateId(templateKey).orElse(null);
            if (templateId == null || accountId == null) return false;
            User account = userRepository.findById(accountId).orElse(null);
            if (account == null || account.getPhone() == null || account.getPhone().isBlank()) return false;
            if (notificationType != null && !prefs.allows(accountId, notificationType, NotificationTopics.ZALO)) return false;
            Long id = claim(accountId, account.getPhone().trim(), templateKey, templateId, dedupKey, data);
            if (id == null) return false;
            String phone = account.getPhone().trim();
            afterCommit(() -> executor.execute(() -> deliver(id, phone, templateId, dedupKey, data)));
            return true;
        } catch (Exception e) {
            log.warn("[zns] {} {} not queued: {}", templateKey, dedupKey, e.getMessage());
            return false;
        }
    }

    /** Sends the template's sample data to a phone right away (back office "Gửi thử"). Returns the error, or null when sent. */
    public String sendTest(Long userId, String phone, String templateKey) {
        ZnsTemplates.Def def = ZnsTemplates.def(templateKey).orElse(null);
        if (def == null) return "Không có mẫu " + templateKey;
        if (phone == null || phone.isBlank()) return "Tài khoản của bạn chưa có số điện thoại";
        String templateId = settings.templateId(templateKey);
        if (templateId.isBlank()) return "Mẫu chưa có mã ZNS";
        String dedupKey = "test:%s:%d".formatted(templateKey, System.currentTimeMillis());
        Long id = claim(userId, phone.trim(), templateKey, templateId, dedupKey, def.sample());
        if (id == null) return "Không ghi được tin thử";
        return deliver(id, phone.trim(), templateId, dedupKey, def.sample());
    }

    /** Sends a claimed message and writes the outcome on its row. Returns the error, or null when sent. */
    String deliver(Long id, String phone, String templateId, String trackingId, Map<String, String> data) {
        if (!zns.isConfigured()) {
            jdbc.update("UPDATE zns_messages SET status = 'stub', error = 'ZALO_APP_ID trống: chỉ ghi log' WHERE id = ?", id);
            log.info("[zns] stub {} -> {} {}", templateId, phone, data);
            return null;
        }
        try {
            zns.sendTemplate(phone, templateId, data, trackingId);
            jdbc.update("UPDATE zns_messages SET status = 'sent', sent_at = NOW(), error = NULL WHERE id = ?", id);
            return null;
        } catch (Exception e) {
            String error = e.getMessage() == null ? e.getClass().getSimpleName() : e.getMessage();
            if (error.length() > 480) error = error.substring(0, 480);
            jdbc.update("UPDATE zns_messages SET status = 'failed', error = ? WHERE id = ?", error, id);
            log.warn("[zns] template {} to {} failed: {}", templateId, phone, error);
            return error;
        }
    }

    private Long claim(Long userId, String phone, String templateKey, String templateId, String dedupKey, Map<String, String> data) {
        String json;
        try {
            json = objectMapper.writeValueAsString(data);
        } catch (Exception e) {
            json = String.valueOf(data);
        }
        String body = json;
        KeyHolder keys = new GeneratedKeyHolder();
        int rows = jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement("""
                    INSERT IGNORE INTO zns_messages (user_id, phone, template_key, template_id, dedup_key, template_data)
                    VALUES (?, ?, ?, ?, ?, ?)""", Statement.RETURN_GENERATED_KEYS);
            statement.setObject(1, userId);
            statement.setString(2, phone);
            statement.setString(3, templateKey);
            statement.setString(4, templateId);
            statement.setString(5, dedupKey);
            statement.setString(6, body);
            return statement;
        }, keys);
        if (rows != 1 || keys.getKey() == null) return null;
        return keys.getKey().longValue();
    }

    private static void afterCommit(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            action.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                action.run();
            }
        });
    }
}
