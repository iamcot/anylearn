package com.anylearn.backend.service.voucher;

import com.anylearn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Vouchers (plan 20). The portal schema stays: voucher_events issue vouchers of a voucher_group,
 * a group says how codes are made (manual = fixed codes typed by the admin, otherwise prefix + random part)
 * and what they give; vouchers are the codes, vouchers_used the uses. Added: the wallet (user_vouchers),
 * an optional course list per group (voucher_group_items) and the real discount at checkout.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherService {

    public static final String SOURCE_EVENT = "event";
    public static final String SOURCE_COLLECT = "collect";
    public static final String SOURCE_SHOP = "shop";
    public static final String SOURCE_ADMIN = "admin";
    public static final String SOURCE_CODE = "code";

    private final JdbcTemplate jdbc;
    private final NotificationService notifications;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();

    // ── rows ─────────────────────────────────────────────────────────────

    public record CodeRow(long id, long groupId, String code, Integer allowed, boolean active, Integer expired) {}

    public record GroupRow(long id, String type, String generateType, String prefix, Integer length, Integer qtt,
                           long value, long minOrder, boolean active, String title, boolean collectible, Integer walletDays,
                           Long partnerId, String showOn) {
        public boolean dynamic() { return generateType != null && !"manual".equals(generateType); }
        public String displayTitle() {
            if (title != null && !title.isBlank()) return title;
            return "Giảm " + VoucherRules.money(value);
        }
    }

    /** A voucher checked against a cart. problem null = usable; walletId set when it came from the wallet. */
    public record Quote(Long voucherId, Long walletId, String code, long discount, String problem, String title) {
        public boolean ok() { return problem == null && voucherId != null; }
    }

    private LocalDateTime now() { return LocalDateTime.now(clock); }

    private long nowEpoch() { return clock.instant().getEpochSecond(); }

    Optional<CodeRow> findCode(String code) {
        String c = VoucherRules.normalize(code);
        if (c.isEmpty()) return Optional.empty();
        return jdbc.query("SELECT id, voucher_group_id, voucher, amount, status, expired FROM vouchers WHERE voucher = ? LIMIT 1",
                (rs, i) -> new CodeRow(rs.getLong(1), rs.getLong(2), rs.getString(3), (Integer) rs.getObject(4),
                        rs.getInt(5) == 1, (Integer) rs.getObject(6)), c).stream().findFirst();
    }

    Optional<CodeRow> codeById(long id, boolean lock) {
        return jdbc.query("SELECT id, voucher_group_id, voucher, amount, status, expired FROM vouchers WHERE id = ?"
                        + (lock ? " FOR UPDATE" : ""),
                (rs, i) -> new CodeRow(rs.getLong(1), rs.getLong(2), rs.getString(3), (Integer) rs.getObject(4),
                        rs.getInt(5) == 1, (Integer) rs.getObject(6)), id).stream().findFirst();
    }

    public Optional<GroupRow> group(long id) {
        return jdbc.query("SELECT id, type, generate_type, prefix, length, qtt, value, rule_min, status, title, collectible, wallet_days, "
                        + "partner_id, show_on FROM voucher_groups WHERE id = ?",
                (rs, i) -> new GroupRow(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4),
                        (Integer) rs.getObject(5), (Integer) rs.getObject(6), VoucherRules.parseValue(rs.getString(7)),
                        rs.getObject(8) == null ? 0 : rs.getLong(8), rs.getInt(9) == 1, rs.getString(10),
                        rs.getInt(11) == 1, (Integer) rs.getObject(12), rs.getObject(13) == null ? null : rs.getLong(13),
                        rs.getString(14)), id).stream().findFirst();
    }

    public Set<Long> groupItems(long groupId) {
        return new HashSet<>(jdbc.queryForList("SELECT item_id FROM voucher_group_items WHERE voucher_group_id = ?", Long.class, groupId));
    }

    private long usedCount(long voucherId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM vouchers_used WHERE voucher_id = ?", Long.class, voucherId);
        return n == null ? 0 : n;
    }

    private boolean usedBy(long voucherId, long userId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM vouchers_used WHERE voucher_id = ? AND user_id = ?", Long.class, voucherId, userId);
        return n != null && n > 0;
    }

    private VoucherRules.Group rulesGroup(GroupRow g) {
        return new VoucherRules.Group(g.type(), g.value(), g.minOrder(), groupItems(g.id()), g.partnerId());
    }

    // ── quote and checkout ───────────────────────────────────────────────

    /** Check a typed code or a wallet row against the cart lines. Nothing is written. */
    public Quote quote(String code, Long walletId, long userId, List<VoucherRules.Line> lines) {
        return quote(code, walletId, userId, lines, false);
    }

    private Quote quote(String code, Long walletId, long userId, List<VoucherRules.Line> lines, boolean lock) {
        Long fromWallet = null;
        CodeRow row;
        if (walletId != null) {
            List<Map<String, Object>> w = jdbc.queryForList(
                    "SELECT voucher_id, status, expires_at FROM user_vouchers WHERE id = ? AND user_id = ?", walletId, userId);
            if (w.isEmpty()) return new Quote(null, null, null, 0, "Không tìm thấy voucher trong ví", null);
            Map<String, Object> wr = w.get(0);
            if (!"active".equals(wr.get("status"))) return new Quote(null, walletId, null, 0, "Voucher này đã được dùng", null);
            if (expired(wr.get("expires_at"))) return new Quote(null, walletId, null, 0, "Voucher này đã hết hạn", null);
            fromWallet = walletId;
            row = codeById(((Number) wr.get("voucher_id")).longValue(), lock).orElse(null);
        } else {
            row = findCode(code).flatMap(r -> lock ? codeById(r.id(), true) : Optional.of(r)).orElse(null);
            if (row != null) {
                // A typed code the person already holds in the wallet counts as that wallet copy.
                List<Map<String, Object>> w = jdbc.queryForList(
                        "SELECT id, status, expires_at FROM user_vouchers WHERE user_id = ? AND voucher_id = ?", userId, row.id());
                if (!w.isEmpty()) {
                    if (expired(w.get(0).get("expires_at")) && "active".equals(w.get(0).get("status")))
                        return new Quote(null, null, row.code(), 0, "Voucher này đã hết hạn", null);
                    if ("active".equals(w.get(0).get("status"))) fromWallet = ((Number) w.get(0).get("id")).longValue();
                }
            }
        }
        if (row == null) return new Quote(null, null, code, 0, "Mã khuyến mãi không tồn tại", null);
        GroupRow g = group(row.groupId()).orElse(null);
        if (g == null) return new Quote(null, fromWallet, row.code(), 0, "Mã khuyến mãi không hợp lệ", null);
        String problem = VoucherRules.codeProblem(row.active(), g.active(), row.expired(),
                VoucherRules.usesLeft(row.allowed(), usedCount(row.id())), usedBy(row.id(), userId), nowEpoch());
        if (problem != null) return new Quote(row.id(), fromWallet, row.code(), 0, problem, g.displayTitle());
        VoucherRules.Evaluation ev = VoucherRules.evaluate(rulesGroup(g), lines);
        return new Quote(row.id(), fromWallet, row.code(), ev.discount(), ev.problem(), g.displayTitle());
    }

    /** Checkout: re-check with the code row locked; throws the Vietnamese reason when it cannot be used. */
    @Transactional
    public Quote reserve(String code, Long walletId, long userId, List<VoucherRules.Line> lines) {
        Quote q = quote(code, walletId, userId, lines, true);
        if (!q.ok()) throw new IllegalArgumentException(q.problem() != null ? q.problem() : "Mã khuyến mãi không hợp lệ");
        return q;
    }

    /** Record the use of a reserved voucher for an order (same transaction as the order). */
    @Transactional
    public void recordUse(Quote q, long userId, long orderId) {
        LocalDateTime now = now();
        jdbc.update("INSERT INTO vouchers_used (voucher_id, user_id, order_id, discount, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                q.voucherId(), userId, orderId, q.discount(), Timestamp.valueOf(now), Timestamp.valueOf(now));
        if (q.walletId() != null) {
            jdbc.update("UPDATE user_vouchers SET status = 'used', used_order_id = ?, used_at = ? WHERE id = ?",
                    orderId, Timestamp.valueOf(now), q.walletId());
        }
        codeById(q.voucherId(), false).ifPresent(c -> {
            if (VoucherRules.usesLeft(c.allowed(), usedCount(c.id())) <= 0)
                jdbc.update("UPDATE vouchers SET status = 0, updated_at = ? WHERE id = ?", Timestamp.valueOf(now), c.id());
        });
    }

    /** A cancelled order gives its voucher back: the use is removed and the wallet copy is usable again. */
    @Transactional
    public void releaseForOrder(long orderId) {
        List<Long> ids = jdbc.queryForList("SELECT voucher_id FROM vouchers_used WHERE order_id = ?", Long.class, orderId);
        if (ids.isEmpty()) return;
        Timestamp now = Timestamp.valueOf(now());
        jdbc.update("DELETE FROM vouchers_used WHERE order_id = ?", orderId);
        jdbc.update("UPDATE user_vouchers SET status = 'active', used_order_id = NULL, used_at = NULL WHERE used_order_id = ?", orderId);
        for (Long id : ids) jdbc.update("UPDATE vouchers SET status = 1, updated_at = ? WHERE id = ?", now, id);
    }

    /** Discount a voucher took off an order (0 = none). */
    public long discountOfOrder(long orderId) {
        Long v = jdbc.queryForObject("SELECT COALESCE(SUM(discount), 0) FROM vouchers_used WHERE order_id = ?", Long.class, orderId);
        return v == null ? 0 : v;
    }

    // ── wallet ───────────────────────────────────────────────────────────

    /** The person's wallet, newest first; with cart lines each usable row also says how much it takes off. */
    public List<Map<String, Object>> wallet(long userId, List<VoucherRules.Line> lines) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT uv.id, uv.voucher_id, uv.voucher_group_id, uv.source, uv.status, uv.expires_at, uv.used_order_id, uv.used_at, "
                        + "uv.created_at, v.voucher AS code FROM user_vouchers uv JOIN vouchers v ON v.id = uv.voucher_id "
                        + "WHERE uv.user_id = ? ORDER BY uv.created_at DESC, uv.id DESC LIMIT 200", userId);
        Map<Long, GroupRow> groups = new HashMap<>();
        Map<Long, Set<Long>> items = new HashMap<>();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            long gid = ((Number) r.get("voucher_group_id")).longValue();
            GroupRow g = groups.computeIfAbsent(gid, id -> group(id).orElse(null));
            if (g == null) continue;
            Set<Long> itemIds = items.computeIfAbsent(gid, this::groupItems);
            String state = "used".equals(r.get("status")) ? "used" : expired(r.get("expires_at")) ? "expired" : "active";
            if ("active".equals(state) && !g.active()) state = "expired";
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.get("id"));
            m.put("code", r.get("code"));
            m.put("title", g.displayTitle());
            m.put("value", g.value());
            m.put("minOrder", g.minOrder());
            m.put("itemIds", itemIds);
            m.put("partnerId", g.partnerId());
            m.put("partnerName", partnerName(g.partnerId()));
            m.put("source", r.get("source"));
            m.put("state", state);
            m.put("expiresAt", r.get("expires_at") != null ? r.get("expires_at").toString() : null);
            m.put("usedOrderId", r.get("used_order_id"));
            m.put("receivedAt", r.get("created_at") != null ? r.get("created_at").toString() : null);
            if (lines != null && "active".equals(state)) {
                VoucherRules.Evaluation ev = VoucherRules.evaluate(new VoucherRules.Group(g.type(), g.value(), g.minOrder(), itemIds, g.partnerId()), lines);
                m.put("discount", ev.discount());
                m.put("problem", ev.problem());
            }
            out.add(m);
        }
        return out;
    }

    /** Number of usable wallet vouchers (for badges and Leo). */
    public long activeCount(long userId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM user_vouchers uv JOIN voucher_groups g ON g.id = uv.voucher_group_id "
                + "WHERE uv.user_id = ? AND uv.status = 'active' AND g.status = 1 AND (uv.expires_at IS NULL OR uv.expires_at > ?)",
                Long.class, userId, Timestamp.valueOf(now()));
        return n == null ? 0 : n;
    }

    /** Save a typed code into the wallet (a code from a fanpage post, for example). */
    @Transactional
    public Map<String, Object> addCode(long userId, String code) {
        CodeRow row = findCode(code).orElseThrow(() -> new IllegalArgumentException("Mã khuyến mãi không tồn tại"));
        GroupRow g = group(row.groupId()).orElseThrow(() -> new IllegalArgumentException("Mã khuyến mãi không hợp lệ"));
        String problem = VoucherRules.codeProblem(row.active(), g.active(), row.expired(),
                VoucherRules.usesLeft(row.allowed(), usedCount(row.id())), usedBy(row.id(), userId), nowEpoch());
        if (problem != null) throw new IllegalArgumentException(problem);
        Long id = insertWallet(userId, row, g, SOURCE_CODE, null);
        if (id == null) throw new IllegalArgumentException("Mã này đã có trong ví của bạn");
        return Map.of("id", id, "title", g.displayTitle(), "code", row.code());
    }

    /** "Nhận voucher": a collectible group, one copy per person. */
    @Transactional
    public Map<String, Object> collect(long userId, long groupId) {
        GroupRow g = group(groupId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy voucher"));
        if (!g.active() || !g.collectible()) throw new IllegalArgumentException("Voucher này không còn nhận được");
        if (holdsGroup(userId, groupId)) throw new IllegalArgumentException("Bạn đã nhận voucher này rồi");
        Long id = issue(userId, groupId, SOURCE_COLLECT, null);
        if (id == null) throw new IllegalArgumentException("Voucher này đã hết lượt nhận");
        return Map.of("id", id, "title", g.displayTitle());
    }

    public boolean holdsGroup(long userId, long groupId) {
        Long n = jdbc.queryForObject("SELECT COUNT(*) FROM user_vouchers WHERE user_id = ? AND voucher_group_id = ?", Long.class, userId, groupId);
        return n != null && n > 0;
    }

    /**
     * Collectible groups shown to people, active ones, with how many copies are left (null = no limit).
     * place: home / search / pdp / partner / fun / tier (a group shows where its show_on says; empty show_on = everywhere
     * except partner and pdp, which show only the vouchers that cover that partner or course).
     */
    public List<Map<String, Object>> collectible(Long userId, String place, Long partnerId, Long itemId) {
        Long itemPartner = itemId == null ? null
                : jdbc.queryForList("SELECT user_id FROM items WHERE id = ?", Long.class, itemId).stream().findFirst().orElse(null);
        List<Long> ids = jdbc.queryForList("SELECT id FROM voucher_groups WHERE collectible = 1 AND status = 1 ORDER BY id DESC LIMIT 100", Long.class);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Long id : ids) {
            GroupRow g = group(id).orElse(null);
            if (g == null) continue;
            Set<Long> itemIds = groupItems(g.id());
            VoucherRules.Group rg = new VoucherRules.Group(g.type(), g.value(), g.minOrder(), itemIds, g.partnerId());
            if (!VoucherRules.showsAt(VoucherRules.parsePlaces(g.showOn()), place)) continue;
            if (partnerId != null && !VoucherRules.relatesToPartner(rg, partnerId, partnerOfItems(itemIds))) continue;
            if (itemId != null && !VoucherRules.covers(rg, itemId, itemPartner == null ? 0 : itemPartner)) continue;
            Long left = copiesLeft(g);
            if (left != null && left <= 0) continue;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("groupId", g.id());
            m.put("title", g.displayTitle());
            m.put("value", g.value());
            m.put("minOrder", g.minOrder());
            m.put("itemIds", itemIds);
            m.put("partnerId", g.partnerId());
            m.put("partnerName", partnerName(g.partnerId()));
            m.put("left", left);
            m.put("walletDays", g.walletDays());
            m.put("collected", userId != null && holdsGroup(userId, g.id()));
            out.add(m);
            if (out.size() >= 20) break;
        }
        return out;
    }

    private Set<Long> partnerOfItems(Set<Long> itemIds) {
        if (itemIds.isEmpty()) return Set.of();
        String in = String.join(",", Collections.nCopies(itemIds.size(), "?"));
        return new HashSet<>(jdbc.queryForList("SELECT DISTINCT user_id FROM items WHERE id IN (" + in + ")", Long.class, itemIds.toArray()));
    }

    private String partnerName(Long partnerId) {
        if (partnerId == null) return null;
        return jdbc.queryForList("SELECT name FROM users WHERE id = ?", String.class, partnerId).stream().findFirst().orElse(null);
    }

    /** Copies a group can still hand out: dynamic = qtt minus codes made (null when qtt is 0 = no limit); manual = uses left. */
    Long copiesLeft(GroupRow g) {
        if (g.dynamic()) {
            if (g.qtt() == null || g.qtt() <= 0) return null;
            Long made = jdbc.queryForObject("SELECT COUNT(*) FROM vouchers WHERE voucher_group_id = ?", Long.class, g.id());
            return Math.max(0, g.qtt() - (made == null ? 0 : made));
        }
        long left = 0;
        for (Map<String, Object> c : jdbc.queryForList("SELECT id, amount, status FROM vouchers WHERE voucher_group_id = ?", g.id())) {
            if (((Number) c.get("status")).intValue() != 1) continue;
            Integer allowed = c.get("amount") == null ? null : ((Number) c.get("amount")).intValue();
            long used = usedCount(((Number) c.get("id")).longValue());
            long held = jdbc.queryForObject("SELECT COUNT(*) FROM user_vouchers WHERE voucher_id = ? AND status = 'active'", Long.class, c.get("id"));
            left += Math.max(0, VoucherRules.usesLeft(allowed, used) - held);
        }
        return left;
    }

    /**
     * Put one voucher of a group into a wallet. Dynamic group: a new code (prefix + random part) while the group's
     * quantity allows; manual group: a code with uses left that the person does not hold yet. Returns the wallet row id,
     * or null when the group is off or has nothing left.
     */
    @Transactional
    public Long issue(long userId, long groupId, String source, Long eventId) {
        GroupRow g = group(groupId).orElse(null);
        if (g == null || !g.active()) return null;
        CodeRow code;
        if (g.dynamic()) {
            Long left = copiesLeft(g);
            if (left != null && left <= 0) return null;
            code = createCode(g);
        } else {
            code = null;
            for (Map<String, Object> c : jdbc.queryForList(
                    "SELECT id FROM vouchers WHERE voucher_group_id = ? AND status = 1 ORDER BY id", g.id())) {
                long id = ((Number) c.get("id")).longValue();
                CodeRow r = codeById(id, true).orElse(null);
                if (r == null || usedBy(id, userId)) continue;
                Long held = jdbc.queryForObject("SELECT COUNT(*) FROM user_vouchers WHERE voucher_id = ? AND user_id = ?", Long.class, id, userId);
                if (held != null && held > 0) continue;
                Long activeHolders = jdbc.queryForObject("SELECT COUNT(*) FROM user_vouchers WHERE voucher_id = ? AND status = 'active'", Long.class, id);
                if (VoucherRules.usesLeft(r.allowed(), usedCount(id)) - (activeHolders == null ? 0 : activeHolders) <= 0) continue;
                if (r.expired() != null && r.expired() > 0 && r.expired() < nowEpoch()) continue;
                code = r;
                break;
            }
            if (code == null) return null;
        }
        return insertWallet(userId, code, g, source, eventId);
    }

    /** Make n dynamic codes for a group without owners (admin "Tạo mã"). */
    @Transactional
    public List<String> createCodes(long groupId, int n) {
        GroupRow g = group(groupId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bộ voucher"));
        if (!g.dynamic()) throw new IllegalArgumentException("Bộ mã cố định: hãy thêm mã bằng tay");
        List<String> codes = new ArrayList<>();
        for (int i = 0; i < Math.max(0, Math.min(n, 1000)); i++) {
            Long left = copiesLeft(g);
            if (left != null && left <= 0) break;
            codes.add(createCode(g).code());
        }
        return codes;
    }

    /** Add a fixed code to a manual group (admin). */
    @Transactional
    public long addFixedCode(long groupId, String code, int uses, Integer expiredEpoch) {
        GroupRow g = group(groupId).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bộ voucher"));
        String c = VoucherRules.normalize(code);
        if (c.length() < 3) throw new IllegalArgumentException("Mã cần ít nhất 3 ký tự");
        if (findCode(c).isPresent()) throw new IllegalArgumentException("Mã " + c + " đã tồn tại");
        Timestamp now = Timestamp.valueOf(now());
        jdbc.update("INSERT INTO vouchers (voucher_group_id, voucher, amount, value, status, expired, created_at, updated_at) VALUES (?, ?, ?, ?, 1, ?, ?, ?)",
                g.id(), c, Math.max(1, uses), String.valueOf(g.value()), expiredEpoch == null ? 0 : expiredEpoch, now, now);
        return findCode(c).map(CodeRow::id).orElseThrow();
    }

    private CodeRow createCode(GroupRow g) {
        Timestamp now = Timestamp.valueOf(now());
        for (int attempt = 0; attempt < 8; attempt++) {
            String c = VoucherRules.generate(g.prefix(), g.length(), random);
            if (findCode(c).isPresent()) continue;
            jdbc.update("INSERT INTO vouchers (voucher_group_id, voucher, amount, value, status, expired, created_at, updated_at) VALUES (?, ?, 1, ?, 1, 0, ?, ?)",
                    g.id(), c, String.valueOf(g.value()), now, now);
            return findCode(c).orElseThrow();
        }
        throw new IllegalStateException("Không tạo được mã mới, hãy thử lại");
    }

    private Long insertWallet(long userId, CodeRow code, GroupRow g, String source, Long eventId) {
        LocalDateTime now = now();
        LocalDateTime exp = VoucherRules.walletExpiry(now, g.walletDays(), code.expired(), clock.getZone());
        int n = jdbc.update("INSERT IGNORE INTO user_vouchers (user_id, voucher_id, voucher_group_id, source, voucher_event_id, status, expires_at, created_at) "
                        + "VALUES (?, ?, ?, ?, ?, 'active', ?, ?)",
                userId, code.id(), g.id(), source, eventId, exp == null ? null : Timestamp.valueOf(exp), Timestamp.valueOf(now));
        if (n == 0) return null;
        return jdbc.queryForObject("SELECT id FROM user_vouchers WHERE user_id = ? AND voucher_id = ?", Long.class, userId, code.id());
    }

    // ── events ───────────────────────────────────────────────────────────

    /**
     * Something happened. Portal schema: voucher_events.type = what happened (register, buy_item, mission:{key}…),
     * trigger = the course id it is about (0 = any), targets = the voucher group ids it hands out (comma list),
     * qtt = copies of each group. Every switched-on matching event fills the wallet once per event and person
     * (checked in voucher_event_logs). Never throws; returns the number of vouchers given.
     */
    public int fire(String type, long userId, long triggerId) {
        int given = 0;
        try {
            List<Map<String, Object>> events = jdbc.queryForList(
                    "SELECT id, targets, `trigger`, qtt, notif_template FROM voucher_events WHERE status = 1 AND type = ?", type);
            for (Map<String, Object> e : events) {
                long eventId = ((Number) e.get("id")).longValue();
                long eventTrigger = e.get("trigger") == null ? 0 : ((Number) e.get("trigger")).longValue();
                if (!VoucherRules.triggerMatches(eventTrigger, triggerId)) continue;
                Long done = jdbc.queryForObject("SELECT COUNT(*) FROM voucher_event_logs WHERE voucher_event_id = ? AND user_id = ?",
                        Long.class, eventId, userId);
                if (done != null && done > 0) continue;
                int copies = Math.max(1, Math.min(5, e.get("qtt") == null ? 1 : ((Number) e.get("qtt")).intValue()));
                for (Long groupId : VoucherRules.parseIds((String) e.get("targets"))) {
                    for (int i = 0; i < copies; i++) {
                        Long walletId = issue(userId, groupId, SOURCE_EVENT, eventId);
                        if (walletId == null) break;
                        Long voucherId = jdbc.queryForObject("SELECT voucher_id FROM user_vouchers WHERE id = ?", Long.class, walletId);
                        Timestamp now = Timestamp.valueOf(now());
                        jdbc.update("INSERT INTO voucher_event_logs (voucher_event_id, user_id, `trigger`, target, data, voucher_id, created_at, updated_at) "
                                        + "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                                eventId, userId, (int) triggerId, groupId.intValue(), type, voucherId, now, now);
                        notifyReceived(userId, groupId, (String) e.get("notif_template"));
                        given++;
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("[voucher] event {} for user {} failed: {}", type, userId, ex.getMessage());
        }
        return given;
    }

    private void notifyReceived(long userId, long groupId, String template) {
        try {
            String title = group(groupId).map(GroupRow::displayTitle).orElse("Voucher mới");
            String content = template != null && !template.isBlank() ? template : "Bạn vừa nhận voucher \"" + title + "\". Xem trong ví voucher.";
            notifications.createNotification(userId, "voucher_received", "Bạn có voucher mới", content, "/account/vouchers");
        } catch (Exception e) {
            log.warn("[voucher] notify {} failed: {}", userId, e.getMessage());
        }
    }

    private boolean expired(Object expiresAt) {
        if (expiresAt == null) return false;
        LocalDateTime t = expiresAt instanceof Timestamp ts ? ts.toLocalDateTime()
                : expiresAt instanceof LocalDateTime ldt ? ldt : null;
        return t != null && !t.isAfter(now());
    }
}
