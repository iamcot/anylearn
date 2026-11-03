package com.anylearn.backend.service.voucher;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

/** Back office page "Voucher" (plan 20): groups (with the course list), codes, events, grants, wallet lookup, report. */
@Service
@RequiredArgsConstructor
public class VoucherAdminService {

    /** Event types the system fires; "mission:{key}" is added by the system missions. */
    public static final List<Map<String, String>> EVENT_TYPES = List.of(
            Map.of("key", "register", "label", "Đăng ký tài khoản mới"),
            Map.of("key", "first_order", "label", "Đơn hàng đầu tiên được thanh toán"),
            Map.of("key", "buy_item", "label", "Mua một khóa học (chọn khóa, để trống = khóa bất kỳ)"),
            Map.of("key", "follow_partner", "label", "Theo dõi một đối tác (sự kiện của đối tác)"),
            Map.of("key", "buy_partner", "label", "Mua khóa bất kỳ của một đối tác (sự kiện của đối tác)"),
            Map.of("key", "journey_chapter", "label", "Xong một chương Hành trình anyLEARN (ô \"điều kiện\" = số chương 1-5)"));

    /** Event types whose trigger is a partner id (the event belongs to that partner). */
    public static final Set<String> PARTNER_TYPES = Set.of("follow_partner", "buy_partner");

    private final JdbcTemplate jdbc;
    private final VoucherService vouchers;
    private final Clock clock;

    private Timestamp now() { return Timestamp.valueOf(LocalDateTime.now(clock)); }

    // ── groups ───────────────────────────────────────────────────────────

    public List<Map<String, Object>> groups(String q) {
        String like = q == null || q.isBlank() ? null : "%" + q.trim() + "%";
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT g.id, g.title, g.type, g.generate_type, g.prefix, g.length, g.qtt, g.value, g.rule_min, g.status, g.collectible, g.wallet_days, g.created_at, "
                        + "g.partner_id, g.show_on, (SELECT name FROM users p WHERE p.id = g.partner_id) AS partner_name, "
                        + "(SELECT COUNT(*) FROM vouchers v WHERE v.voucher_group_id = g.id) AS codes, "
                        + "(SELECT COUNT(*) FROM vouchers_used u JOIN vouchers v ON v.id = u.voucher_id WHERE v.voucher_group_id = g.id) AS used, "
                        + "(SELECT COALESCE(SUM(u.discount), 0) FROM vouchers_used u JOIN vouchers v ON v.id = u.voucher_id WHERE v.voucher_group_id = g.id) AS discount, "
                        + "(SELECT COUNT(*) FROM user_vouchers w WHERE w.voucher_group_id = g.id) AS held, "
                        + "(SELECT MIN(v.voucher) FROM vouchers v WHERE v.voucher_group_id = g.id) AS first_code "
                        + "FROM voucher_groups g "
                        + (like != null ? "WHERE g.title LIKE ? OR g.prefix LIKE ? OR EXISTS (SELECT 1 FROM vouchers v WHERE v.voucher_group_id = g.id AND v.voucher LIKE ?) " : "")
                        + "ORDER BY g.id DESC LIMIT 300",
                like != null ? new Object[]{like, like, like} : new Object[]{});
        for (Map<String, Object> r : rows) {
            Set<Long> itemIds = vouchers.groupItems(((Number) r.get("id")).longValue());
            r.put("itemIds", itemIds);
            r.put("items", itemIds.isEmpty() ? List.of() : jdbc.queryForList(
                    "SELECT id, title, image, price FROM items WHERE id IN (" + String.join(",", itemIds.stream().map(String::valueOf).toList()) + ")"));
        }
        return rows;
    }

    @Transactional
    public long saveGroup(Long id, Map<String, Object> b) {
        String type = str(b.get("type"), "money");
        String generate = str(b.get("generateType"), "manual");
        long value = num(b.get("value"));
        if (value <= 0) throw new IllegalArgumentException("Nhập số tiền giảm");
        String prefix = str(b.get("prefix"), null);
        if (!"manual".equals(generate) && (prefix == null || prefix.isBlank())) throw new IllegalArgumentException("Mã động cần tiền tố (prefix)");
        Object[] args = {str(b.get("title"), null), type, generate, prefix == null ? null : prefix.trim().toUpperCase(),
                Math.max(4, Math.min(16, (int) numOr(b.get("length"), 6))), (int) numOr(b.get("qtt"), 0), String.valueOf(value),
                b.get("ruleMin") == null || String.valueOf(b.get("ruleMin")).isBlank() ? null : (int) num(b.get("ruleMin")),
                bool(b.get("status"), true) ? 1 : 0, bool(b.get("collectible"), false) ? 1 : 0,
                b.get("walletDays") == null || String.valueOf(b.get("walletDays")).isBlank() ? null : (int) num(b.get("walletDays")),
                b.get("partnerId") == null || String.valueOf(b.get("partnerId")).isBlank() ? null : num(b.get("partnerId")),
                b.get("showOn") == null ? null : String.join(",", VoucherRules.parsePlaces(b.get("showOn") instanceof Collection<?> c
                        ? String.join(",", c.stream().map(String::valueOf).toList()) : String.valueOf(b.get("showOn"))))};
        long gid;
        if (id == null) {
            jdbc.update("INSERT INTO voucher_groups (title, type, generate_type, prefix, length, qtt, value, rule_min, status, collectible, wallet_days, "
                    + "partner_id, show_on, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", concat(args, now(), now()));
            gid = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        } else {
            gid = id;
            jdbc.update("UPDATE voucher_groups SET title = ?, type = ?, generate_type = ?, prefix = ?, length = ?, qtt = ?, value = ?, rule_min = ?, "
                    + "status = ?, collectible = ?, wallet_days = ?, partner_id = ?, show_on = ?, updated_at = ? WHERE id = ?", concat(args, now(), id));
        }
        if (b.containsKey("itemIds")) {
            jdbc.update("DELETE FROM voucher_group_items WHERE voucher_group_id = ?", gid);
            for (Long item : ids(b.get("itemIds")))
                jdbc.update("INSERT IGNORE INTO voucher_group_items (voucher_group_id, item_id) VALUES (?, ?)", gid, item);
        }
        return gid;
    }

    public void setGroupStatus(long id, boolean on) {
        jdbc.update("UPDATE voucher_groups SET status = ?, updated_at = ? WHERE id = ?", on ? 1 : 0, now(), id);
    }

    // ── codes ────────────────────────────────────────────────────────────

    public Map<String, Object> codes(long groupId, int page) {
        int size = 50;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT v.id, v.voucher AS code, v.amount AS uses, v.status, v.expired, v.created_at, "
                        + "(SELECT COUNT(*) FROM vouchers_used u WHERE u.voucher_id = v.id) AS used, "
                        + "(SELECT GROUP_CONCAT(w.user_id) FROM user_vouchers w WHERE w.voucher_id = v.id) AS holders "
                        + "FROM vouchers v WHERE v.voucher_group_id = ? ORDER BY v.id DESC LIMIT ? OFFSET ?",
                groupId, size, Math.max(0, page) * size);
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM vouchers WHERE voucher_group_id = ?", Long.class, groupId);
        return Map.of("items", rows, "total", total == null ? 0 : total, "page", page, "size", size);
    }

    /** Dynamic group: {count} new codes; manual group: {code, uses, expiredAt (yyyy-MM-dd, optional)}. */
    public Object addCodes(long groupId, Map<String, Object> b) {
        if (b.get("count") != null) return Map.of("codes", vouchers.createCodes(groupId, (int) num(b.get("count"))));
        Integer exp = null;
        String d = str(b.get("expiredAt"), null);
        if (d != null && !d.isBlank())
            exp = (int) java.time.LocalDate.parse(d).plusDays(1).atStartOfDay(clock.getZone()).toEpochSecond();
        return Map.of("id", vouchers.addFixedCode(groupId, str(b.get("code"), ""), (int) numOr(b.get("uses"), 1), exp));
    }

    // ── events ───────────────────────────────────────────────────────────

    public Map<String, Object> events() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT e.id, e.type, e.title, e.`trigger`, e.targets, e.qtt, e.status, e.notif_template, e.created_at, e.ref_user_id, "
                        + "(SELECT name FROM users p WHERE p.id = e.ref_user_id) AS partner_name, "
                        + "(SELECT title FROM items i WHERE i.id = e.`trigger` AND e.type = 'buy_item') AS item_title, "
                        + "(SELECT COUNT(*) FROM voucher_event_logs l WHERE l.voucher_event_id = e.id) AS given "
                        + "FROM voucher_events e ORDER BY e.id DESC LIMIT 300");
        return Map.of("items", rows, "types", EVENT_TYPES);
    }

    @Transactional
    public long saveEvent(Long id, Map<String, Object> b) {
        String type = str(b.get("type"), "");
        if (type.isBlank()) throw new IllegalArgumentException("Chọn loại sự kiện");
        String title = str(b.get("title"), "");
        if (title.isBlank()) throw new IllegalArgumentException("Nhập tên sự kiện");
        List<Long> groups = ids(b.get("groupIds"));
        if (groups.isEmpty()) throw new IllegalArgumentException("Chọn ít nhất một bộ voucher");
        String targets = String.join(",", groups.stream().map(String::valueOf).toList());
        long trigger = numOr(b.get("trigger"), 0);
        Long partner = null;
        if (PARTNER_TYPES.contains(type)) {
            partner = numOr(b.get("partnerId"), trigger);
            if (partner <= 0) throw new IllegalArgumentException("Chọn đối tác của sự kiện");
            trigger = partner;
        }
        Object[] args = {type, title, (int) trigger, targets, Math.max(1, (int) numOr(b.get("qtt"), 1)),
                bool(b.get("status"), true) ? 1 : 0, str(b.get("notifTemplate"), null), partner};
        if (id == null) {
            jdbc.update("INSERT INTO voucher_events (type, title, `trigger`, targets, qtt, status, notif_template, ref_user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    concat(args, now(), now()));
            return jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        }
        jdbc.update("UPDATE voucher_events SET type = ?, title = ?, `trigger` = ?, targets = ?, qtt = ?, status = ?, notif_template = ?, ref_user_id = ?, updated_at = ? WHERE id = ?",
                concat(args, now(), id));
        return id;
    }

    // ── grant, wallet, report ────────────────────────────────────────────

    /** Put one voucher of a group into the wallets of the given people (by id or phone). */
    public Map<String, Object> grant(long groupId, Map<String, Object> b) {
        Set<Long> users = new LinkedHashSet<>(ids(b.get("userIds")));
        for (String phone : String.valueOf(b.getOrDefault("phones", "")).split("[,;\\s]+")) {
            if (phone.isBlank()) continue;
            jdbc.queryForList("SELECT id FROM users WHERE phone = ?", Long.class, phone.trim()).forEach(users::add);
        }
        int given = 0;
        List<Long> skipped = new ArrayList<>();
        for (Long u : users) {
            Long w = vouchers.issue(u, groupId, VoucherService.SOURCE_ADMIN, null);
            if (w != null) given++; else skipped.add(u);
        }
        return Map.of("given", given, "skipped", skipped, "people", users.size());
    }

    public List<Map<String, Object>> walletOf(String phoneOrId) {
        String key = phoneOrId == null ? "" : phoneOrId.trim();
        List<Long> ids = jdbc.queryForList("SELECT id FROM users WHERE phone = ? OR CAST(id AS CHAR) = ? LIMIT 1", Long.class, key, key);
        if (ids.isEmpty()) throw new IllegalArgumentException("Không tìm thấy người dùng");
        return vouchers.wallet(ids.get(0), null);
    }

    public Map<String, Object> report(int months) {
        int m = Math.max(1, Math.min(24, months));
        Timestamp from = Timestamp.valueOf(LocalDateTime.now(clock).minusMonths(m));
        List<Map<String, Object>> byMonth = jdbc.queryForList(
                "SELECT DATE_FORMAT(u.created_at, '%Y-%m') AS month, COUNT(*) AS uses, COALESCE(SUM(u.discount), 0) AS discount "
                        + "FROM vouchers_used u WHERE u.created_at >= ? GROUP BY month ORDER BY month", from);
        List<Map<String, Object>> bySource = jdbc.queryForList(
                "SELECT source, COUNT(*) AS issued, SUM(status = 'used') AS used FROM user_vouchers WHERE created_at >= ? GROUP BY source", from);
        List<Map<String, Object>> byEvent = jdbc.queryForList(
                "SELECT e.id, e.title, COUNT(l.id) AS issued FROM voucher_events e JOIN voucher_event_logs l ON l.voucher_event_id = e.id "
                        + "WHERE l.created_at >= ? GROUP BY e.id, e.title ORDER BY issued DESC LIMIT 50", from);
        return Map.of("byMonth", byMonth, "bySource", bySource, "byEvent", byEvent);
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private static Object[] concat(Object[] a, Object... more) {
        Object[] out = Arrays.copyOf(a, a.length + more.length);
        System.arraycopy(more, 0, out, a.length, more.length);
        return out;
    }

    private static String str(Object o, String def) {
        if (o == null) return def;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? def : s;
    }

    private static long num(Object o) {
        try { return Math.round(Double.parseDouble(String.valueOf(o).trim())); }
        catch (Exception e) { throw new IllegalArgumentException("Số không hợp lệ: " + o); }
    }

    private static long numOr(Object o, long def) {
        if (o == null || String.valueOf(o).isBlank()) return def;
        return num(o);
    }

    private static boolean bool(Object o, boolean def) {
        if (o == null) return def;
        if (o instanceof Boolean b) return b;
        String s = String.valueOf(o);
        return "1".equals(s) || "true".equalsIgnoreCase(s);
    }

    private static List<Long> ids(Object o) {
        if (o == null) return List.of();
        if (o instanceof Collection<?> c) {
            List<Long> out = new ArrayList<>();
            for (Object x : c) { try { out.add(Long.parseLong(String.valueOf(x))); } catch (Exception ignored) {} }
            return out;
        }
        return VoucherRules.parseIds(String.valueOf(o));
    }
}
