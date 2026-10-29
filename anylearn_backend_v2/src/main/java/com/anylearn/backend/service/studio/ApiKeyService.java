package com.anylearn.backend.service.studio;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Machine keys (plan 19.A6): a long-lived key that acts as one account (the creator "anyLEARN Studio") on the creator
 * routes of Khám phá and the studio routes only. Only a hash is stored; the key is shown once when created.
 */
@Service
@RequiredArgsConstructor
public class ApiKeyService {

    private final JdbcTemplate jdbc;
    private final UserRepository users;
    private final SecureRandom random = new SecureRandom();

    public record Match(long keyId, User user) {}

    /** The account of a valid key (not revoked, account active), and notes its use. */
    public Optional<Match> authenticate(String key) {
        if (!StudioRules.looksLikeKey(key)) return Optional.empty();
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, user_id FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL", StudioRules.hash(key));
        if (rows.isEmpty()) return Optional.empty();
        long id = ((Number) rows.get(0).get("id")).longValue();
        long userId = ((Number) rows.get(0).get("user_id")).longValue();
        Optional<User> user = users.findById(userId).filter(u -> u.getStatus() != null && u.getStatus() == 1);
        if (user.isEmpty()) return Optional.empty();
        jdbc.update("UPDATE api_keys SET last_used_at = NOW() WHERE id = ? AND (last_used_at IS NULL OR last_used_at < DATE_SUB(NOW(), INTERVAL 1 MINUTE))", id);
        return Optional.of(new Match(id, user.get()));
    }

    /** Creates a key for an account; returns the key itself (the only time it is visible). */
    public Map<String, Object> create(String name, long userId, Long createdBy) {
        String cleanName = name == null || name.isBlank() ? "t2m" : name.trim();
        if (cleanName.length() > 100) throw new IllegalArgumentException("Tên tối đa 100 ký tự");
        if (users.findById(userId).isEmpty()) throw new IllegalArgumentException("Không tìm thấy tài khoản");
        String key = StudioRules.newKey(random);
        jdbc.update("INSERT INTO api_keys (name, user_id, key_prefix, key_hash, created_by) VALUES (?, ?, ?, ?, ?)",
                cleanName, userId, StudioRules.prefixOf(key), StudioRules.hash(key), createdBy);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("key", key);
        out.put("prefix", StudioRules.prefixOf(key));
        return out;
    }

    public List<Map<String, Object>> list() {
        return jdbc.queryForList("SELECT k.id, k.name, k.user_id AS userId, u.name AS userName, u.phone AS userPhone, k.key_prefix AS prefix, k.scope, " +
                "k.created_at AS createdAt, k.last_used_at AS lastUsedAt, k.revoked_at AS revokedAt FROM api_keys k LEFT JOIN users u ON u.id = k.user_id ORDER BY k.revoked_at IS NULL DESC, k.id DESC");
    }

    public boolean revoke(long id) {
        return jdbc.update("UPDATE api_keys SET revoked_at = NOW() WHERE id = ? AND revoked_at IS NULL", id) > 0;
    }
}
