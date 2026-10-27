package com.anylearn.backend.service.membership;

import com.anylearn.backend.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Member tiers (plan 10.2): spending of the last 12 months in delivered orders, kept in `member_tiers`. */
@Service
@Slf4j
@RequiredArgsConstructor
public class MemberTierService {

    private final JdbcTemplate jdbc;
    private final MembershipSettings settings;

    public record TierInfo(String tier, long spent12m, double multiplier) {}

    private long spent12m(long userId) {
        Long sum = jdbc.queryForObject("SELECT COALESCE(SUM(amount), 0) FROM orders WHERE user_id = ? AND status = 'delivered' AND created_at >= ?",
                Long.class, userId, java.sql.Timestamp.valueOf(LocalDateTime.now().minusMonths(12)));
        return sum == null ? 0 : sum;
    }

    /** Recounts one member and stores the result. Not a member (partner, admin) or tiers switched off: plain "member". */
    public TierInfo refresh(Long userId, String role) {
        if (userId == null || !"member".equals(role)) return new TierInfo(MemberTierRules.MEMBER, 0, 1.0);
        long spent = spent12m(userId);
        String tier = MemberTierRules.tierFor(spent, settings.thresholds());
        jdbc.update("INSERT INTO member_tiers (user_id, tier, spent_12m, updated_at) VALUES (?, ?, ?, NOW()) "
                + "ON DUPLICATE KEY UPDATE tier = VALUES(tier), spent_12m = VALUES(spent_12m), updated_at = NOW()", userId, tier, spent);
        return info(tier, spent);
    }

    private TierInfo info(String tier, long spent) {
        return new TierInfo(tier, spent, settings.tiersEnabled() ? settings.multipliers().of(tier) : 1.0);
    }

    /** The stored tier (counted now when the member has no row yet). */
    public TierInfo of(User user) {
        if (user == null || !"member".equals(user.getRole())) return new TierInfo(MemberTierRules.MEMBER, 0, 1.0);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT tier, spent_12m FROM member_tiers WHERE user_id = ?", user.getId());
        if (rows.isEmpty()) return refresh(user.getId(), user.getRole());
        return info((String) rows.get(0).get("tier"), ((Number) rows.get(0).get("spent_12m")).longValue());
    }

    public double multiplier(User user) {
        return settings.tiersEnabled() ? of(user).multiplier() : 1.0;
    }

    /** Everything the account page and the anyPoint page show. */
    public Map<String, Object> view(User user) {
        TierInfo info = of(user);
        MemberTierRules.Thresholds t = settings.thresholds();
        String next = MemberTierRules.next(info.tier());
        Map<String, Object> out = new LinkedHashMap<>();
        boolean applies = settings.tiersEnabled() && user != null && "member".equals(user.getRole());
        out.put("applies", applies);
        out.put("tier", info.tier());
        out.put("label", MemberTierRules.label(info.tier()));
        out.put("spent12m", info.spent12m());
        out.put("multiplier", info.multiplier());
        out.put("next", next);
        out.put("nextLabel", next == null ? null : MemberTierRules.label(next));
        out.put("remaining", MemberTierRules.remainingToNext(info.tier(), info.spent12m(), t));
        List<Map<String, Object>> tiers = new java.util.ArrayList<>();
        for (String key : MemberTierRules.ORDER) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("key", key);
            row.put("label", MemberTierRules.label(key));
            row.put("minSpent", t.of(key));
            row.put("multiplier", settings.multipliers().of(key));
            tiers.add(row);
        }
        out.put("tiers", tiers);
        return out;
    }

    /** Tier of other people for the chat badge (users with no row are plain members). */
    public Map<Long, String> tiersOf(java.util.Collection<Long> userIds) {
        Map<Long, String> map = new java.util.HashMap<>();
        if (userIds.isEmpty() || !settings.tiersEnabled()) return map;
        String in = String.join(",", java.util.Collections.nCopies(userIds.size(), "?"));
        jdbc.query("SELECT user_id, tier FROM member_tiers WHERE user_id IN (" + in + ")", rs -> {
            map.put(rs.getLong("user_id"), rs.getString("tier"));
        }, userIds.toArray());
        return map;
    }

    @Scheduled(cron = "0 30 0 * * *")
    public void refreshAll() {
        List<Map<String, Object>> members = jdbc.queryForList(
                "SELECT DISTINCT u.id FROM users u JOIN orders o ON o.user_id = u.id AND o.status = 'delivered' "
                        + "WHERE u.role = 'member' AND o.created_at >= ? UNION SELECT user_id FROM member_tiers WHERE tier <> 'member'",
                java.sql.Timestamp.valueOf(LocalDateTime.now().minusMonths(13)));
        int n = 0;
        for (Map<String, Object> row : members) {
            try {
                refresh(((Number) row.values().iterator().next()).longValue(), "member");
                n++;
            } catch (Exception e) {
                log.warn("[tier] refresh failed: {}", e.getMessage());
            }
        }
        log.info("[tier] refreshed {} members", n);
    }

    public Map<String, Long> distribution() {
        Map<String, Long> map = new LinkedHashMap<>();
        for (String key : MemberTierRules.ORDER) map.put(key, 0L);
        jdbc.query("SELECT tier, COUNT(*) c FROM member_tiers GROUP BY tier", rs -> { map.put(rs.getString("tier"), rs.getLong("c")); });
        return map;
    }
}
