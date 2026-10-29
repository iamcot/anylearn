package com.anylearn.backend.service.adminaccess;

import com.anylearn.backend.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

/** Back-office permissions of non-admins (plan 19.A5, table `admin_permissions`). Lookups are kept 30 seconds. */
@Service
@RequiredArgsConstructor
public class AdminAccessService {

    private static final long CACHE_MS = 30_000L;

    private final JdbcTemplate jdbc;

    private record Cached(long at, Set<String> permissions) {}
    private final Map<Long, Cached> cache = new ConcurrentHashMap<>();

    public static boolean isAdmin(User user) {
        return user != null && "admin".equals(user.getRole());
    }

    public Set<String> permissions(Long userId) {
        if (userId == null) return Set.of();
        Cached hit = cache.get(userId);
        long now = System.currentTimeMillis();
        if (hit != null && now - hit.at() < CACHE_MS) return hit.permissions();
        Set<String> set = new HashSet<>(jdbc.queryForList("SELECT permission FROM admin_permissions WHERE user_id = ?", String.class, userId));
        cache.put(userId, new Cached(now, Set.copyOf(set)));
        return set;
    }

    /** An admin, or a member with "Duyệt nội dung" whose account is active. */
    public boolean canReviewContent(User user) {
        if (user == null) return false;
        if (isAdmin(user)) return true;
        return user.getStatus() != null && user.getStatus() == 1 && permissions(user.getId()).contains(AdminPermissions.CONTENT_REVIEW);
    }

    /** May this person sign in to the back office: an admin, or an active member with a permission. */
    public boolean canEnterBackOffice(User user) {
        if (isAdmin(user)) return true;
        return user != null && user.getStatus() != null && user.getStatus() == 1 && !permissions(user.getId()).isEmpty();
    }

    /** People with a permission, for the settings page. */
    public List<Map<String, Object>> list() {
        Map<Long, Map<String, Object>> byUser = new LinkedHashMap<>();
        for (Map<String, Object> r : jdbc.queryForList("SELECT p.user_id, p.permission, u.name, u.phone, u.role FROM admin_permissions p JOIN users u ON u.id = p.user_id ORDER BY u.name, p.user_id")) {
            long id = ((Number) r.get("user_id")).longValue();
            Map<String, Object> row = byUser.computeIfAbsent(id, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", id);
                m.put("name", r.get("name"));
                m.put("phone", r.get("phone"));
                m.put("role", r.get("role"));
                m.put("permissions", new ArrayList<String>());
                return m;
            });
            @SuppressWarnings("unchecked") List<String> perms = (List<String>) row.get("permissions");
            perms.add((String) r.get("permission"));
        }
        return new ArrayList<>(byUser.values());
    }

    /** Replaces the permissions of one person (empty = removes them from the back office). */
    @Transactional
    public void set(long userId, List<String> permissions, Long grantedBy) {
        Long exists = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id = ?", Long.class, userId);
        if (exists == null || exists == 0) throw new IllegalArgumentException("Không tìm thấy thành viên");
        List<String> clean = permissions == null ? List.of() : permissions.stream().filter(AdminPermissions::known).distinct().toList();
        jdbc.update("DELETE FROM admin_permissions WHERE user_id = ?", userId);
        for (String p : clean) jdbc.update("INSERT INTO admin_permissions (user_id, permission, granted_by) VALUES (?, ?, ?)", userId, p, grantedBy);
        cache.remove(userId);
    }
}
