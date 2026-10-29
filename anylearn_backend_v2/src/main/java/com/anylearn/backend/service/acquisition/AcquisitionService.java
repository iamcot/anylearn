package com.anylearn.backend.service.acquisition;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * "Nguồn khách" (plan 19.A4): the first source of each account (`user_acquisition`, written at registration from what
 * the browser kept), visits per day by source (`landing_visits`, also for visitors who never register), and the report of
 * the back office (visits, sign-ups, first orders by channel, campaign and video).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AcquisitionService {

    private final JdbcTemplate jdbc;

    /** Landing calls per IP in the current minute: {minute, count}. */
    private final Map<String, long[]> perIp = new ConcurrentHashMap<>();

    /**
     * Saves where a new account came from: the UTM values the browser kept from its first visit, the landing address, and
     * the referral code. Every account gets a row (no UTM = direct or referral), once. Never throws: registering must not fail.
     */
    public void recordSignup(long userId, Map<String, ?> body, String ref) {
        try {
            Map<String, String> utm = AcquisitionRules.utm(body);
            String path = AcquisitionRules.cleanPath(body == null ? null : str(body.get("landing_path")));
            LocalDateTime seen = AcquisitionRules.firstSeen(body == null ? null : str(body.get("first_seen_at")), LocalDateTime.now());
            String cleanRef = ref == null || ref.isBlank() ? null : ref.trim().substring(0, Math.min(ref.trim().length(), 30));
            jdbc.update("INSERT IGNORE INTO user_acquisition (user_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, explore_post_id, ref, landing_path, first_seen_at) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    userId, utm.get("utm_source"), utm.get("utm_medium"), utm.get("utm_campaign"), utm.get("utm_content"), utm.get("utm_term"),
                    AcquisitionRules.explorePostId(path, utm.get("utm_content")), cleanRef, path, seen);
        } catch (Exception e) {
            log.warn("[acquisition] could not save the source of user {}: {}", userId, e.getMessage());
        }
    }

    private static String str(Object v) {
        return v == null ? null : String.valueOf(v);
    }

    /** True while this IP is under the per-minute limit of landing calls (counts the call). */
    boolean allow(String ip) {
        long minute = System.currentTimeMillis() / 60_000;
        long[] slot = perIp.compute(ip == null ? "?" : ip, (k, v) -> v == null || v[0] != minute ? new long[]{minute, 1} : new long[]{minute, v[1] + 1});
        if (perIp.size() > 10_000) perIp.entrySet().removeIf(e -> e.getValue()[0] != minute);
        return slot[1] <= AcquisitionRules.LANDING_PER_MINUTE;
    }

    /** Counts one arrival with UTM values (the site calls it once per browser session and source). False = ignored. */
    public boolean trackLanding(Map<String, ?> body, String ip) {
        Map<String, String> utm = AcquisitionRules.utm(body);
        if (utm.get("utm_source") == null && utm.get("utm_campaign") == null) return false;
        if (!allow(ip)) return false;
        jdbc.update("INSERT INTO landing_visits (day, utm_source, utm_medium, utm_campaign, utm_content, visits) VALUES (?, ?, ?, ?, ?, 1) " +
                        "ON DUPLICATE KEY UPDATE visits = visits + 1",
                LocalDate.now(), utm.getOrDefault("utm_source", ""), utm.getOrDefault("utm_medium", ""), utm.getOrDefault("utm_campaign", ""), utm.getOrDefault("utm_content", ""));
        return true;
    }

    // ---- back office ----

    /** Accounts created in the window with their source and whether (and how much) they bought: orders delivered. */
    private static final String SIGNUPS = "SELECT a.user_id, a.utm_source, a.utm_medium, a.utm_campaign, a.utm_content, a.explore_post_id, a.ref, " +
            "(SELECT COUNT(*) FROM orders o WHERE o.user_id = a.user_id AND o.status = 'delivered') AS orders, " +
            "(SELECT COALESCE(SUM(o.amount), 0) FROM orders o WHERE o.user_id = a.user_id AND o.status = 'delivered') AS revenue " +
            "FROM user_acquisition a WHERE a.created_at >= ?";

    /** The report of the last `days` days (7, 30 or 90). */
    public Map<String, Object> report(int rawDays) {
        int days = AcquisitionRules.days(rawDays);
        LocalDate from = LocalDate.now().minusDays(days - 1L);
        List<Map<String, Object>> signups = jdbc.queryForList(SIGNUPS, from.atStartOfDay());
        List<Map<String, Object>> visits = jdbc.queryForList("SELECT day, utm_source, utm_medium, utm_campaign, utm_content, visits FROM landing_visits WHERE day >= ?", from);

        Map<String, Map<String, Object>> channels = new LinkedHashMap<>();
        Map<String, Map<String, Object>> campaigns = new LinkedHashMap<>();
        Map<String, Map<String, Object>> contents = new LinkedHashMap<>();
        Map<String, Map<String, Object>> daily = new LinkedHashMap<>();
        for (LocalDate d = from; !d.isAfter(LocalDate.now()); d = d.plusDays(1)) bucket(daily, d.toString(), Map.of("day", d.toString()));

        long totalVisits = 0;
        for (Map<String, Object> v : visits) {
            long n = ((Number) v.get("visits")).longValue();
            totalVisits += n;
            String source = blank(v.get("utm_source")), medium = blank(v.get("utm_medium")), campaign = blank(v.get("utm_campaign")), content = blank(v.get("utm_content"));
            add(bucket(channels, AcquisitionRules.channel(source, medium, null), Map.of("channel", AcquisitionRules.channel(source, medium, null))), "visits", n);
            if (campaign != null) add(bucket(campaigns, campaign, Map.of("campaign", campaign)), "visits", n);
            if (content != null) add(bucket(contents, content, contentKey(content, null)), "visits", n);
            add(bucket(daily, v.get("day").toString(), Map.of()), "visits", n);
        }
        long buyers = 0, revenue = 0;
        for (Map<String, Object> s : signups) {
            long orders = ((Number) s.get("orders")).longValue();
            long money = ((Number) s.get("revenue")).longValue();
            boolean bought = orders > 0;
            if (bought) buyers++;
            revenue += money;
            String source = blank(s.get("utm_source")), medium = blank(s.get("utm_medium")), campaign = blank(s.get("utm_campaign")), content = blank(s.get("utm_content"));
            String channel = AcquisitionRules.channel(source, medium, blank(s.get("ref")));
            countSignup(bucket(channels, channel, Map.of("channel", channel)), bought, money);
            if (campaign != null) countSignup(bucket(campaigns, campaign, Map.of("campaign", campaign)), bought, money);
            Long postId = s.get("explore_post_id") == null ? null : ((Number) s.get("explore_post_id")).longValue();
            if (content != null || postId != null) {
                String key = content != null ? content : "explore-" + postId;
                countSignup(bucket(contents, key, contentKey(key, postId)), bought, money);
            }
        }
        // the day of a sign-up
        for (Map<String, Object> row : jdbc.queryForList("SELECT DATE(created_at) AS day, COUNT(*) AS n FROM user_acquisition WHERE created_at >= ? GROUP BY DATE(created_at)", from.atStartOfDay())) {
            add(bucket(daily, row.get("day").toString(), Map.of()), "signups", ((Number) row.get("n")).longValue());
        }
        attachPostTitles(contents.values());

        Map<String, Object> totals = new LinkedHashMap<>();
        totals.put("visits", totalVisits);
        totals.put("signups", signups.size());
        totals.put("buyers", buyers);
        totals.put("revenue", revenue);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("days", days);
        out.put("from", from.toString());
        out.put("totals", totals);
        out.put("channels", sorted(channels.values()));
        out.put("campaigns", sorted(campaigns.values()));
        out.put("contents", sorted(contents.values()));
        out.put("daily", new ArrayList<>(daily.values()));
        return out;
    }

    private static String blank(Object v) {
        return v == null || v.toString().isBlank() ? null : v.toString();
    }

    private static Map<String, Object> contentKey(String content, Long postId) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("content", content);
        Long id = postId != null ? postId : AcquisitionRules.explorePostId(null, content);
        if (id != null) m.put("postId", id);
        return m;
    }

    private static Map<String, Object> bucket(Map<String, Map<String, Object>> map, String key, Map<String, Object> init) {
        return map.computeIfAbsent(key, k -> {
            Map<String, Object> m = new LinkedHashMap<>(init);
            m.put("visits", 0L);
            m.put("signups", 0L);
            m.put("buyers", 0L);
            m.put("revenue", 0L);
            return m;
        });
    }

    private static void add(Map<String, Object> row, String field, long n) {
        row.put(field, ((Number) row.get(field)).longValue() + n);
    }

    private static void countSignup(Map<String, Object> row, boolean bought, long money) {
        add(row, "signups", 1);
        if (bought) add(row, "buyers", 1);
        add(row, "revenue", money);
    }

    private static List<Map<String, Object>> sorted(java.util.Collection<Map<String, Object>> rows) {
        List<Map<String, Object>> list = new ArrayList<>(rows);
        list.sort((a, b) -> {
            int bySignups = Long.compare(((Number) b.get("signups")).longValue(), ((Number) a.get("signups")).longValue());
            return bySignups != 0 ? bySignups : Long.compare(((Number) b.get("visits")).longValue(), ((Number) a.get("visits")).longValue());
        });
        return list;
    }

    private void attachPostTitles(java.util.Collection<Map<String, Object>> rows) {
        List<Long> ids = rows.stream().map(r -> r.get("postId")).filter(java.util.Objects::nonNull).map(v -> ((Number) v).longValue()).distinct().toList();
        if (ids.isEmpty()) return;
        Map<Long, String> titles = new java.util.HashMap<>();
        jdbc.query("SELECT id, title FROM explore_posts WHERE id IN (" + String.join(",", ids.stream().map(String::valueOf).toList()) + ")",
                rs -> { titles.put(rs.getLong(1), rs.getString(2)); });
        for (Map<String, Object> r : rows) {
            if (r.get("postId") instanceof Number n) r.put("postTitle", titles.get(n.longValue()));
        }
    }
}
