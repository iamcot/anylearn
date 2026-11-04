package com.anylearn.backend.service.foundation;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.achievement.AchievementRules;
import com.anylearn.backend.service.achievement.AchievementService;
import com.anylearn.backend.service.points.CommissionConfig;
import com.anylearn.backend.service.points.ItemPointsResolver;
import com.anylearn.backend.service.points.PointsEngine;
import com.anylearn.backend.service.settings.NumberSettings;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

/**
 * anyLEARN Foundation (plan 21): toilets for highland schools. Contributions come from paid orders (the foundation share
 * of the order, `foundation` transactions written by the points engine), milestones, and anyLEARN's own seed.
 * Progress is two stored numbers in `foundation_state` (see {@link FoundationRules}).
 */
@Service
@Slf4j
public class FoundationService {

    public static final String SOURCE_ORDER = "order";
    public static final String SOURCE_MILESTONE = "milestone";
    public static final String SOURCE_SEED = "seed";

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final NumberSettings settings;
    private final ConfigurationRepository configurationRepository;

    @Autowired(required = false) private NotificationService notifications;
    @Autowired(required = false) private AchievementService achievements;
    @Autowired(required = false) private ItemPointsResolver itemPoints;
    @Autowired(required = false) private PointsEngine pointsEngine;

    public FoundationService(JdbcTemplate jdbc, Clock clock, ConfigurationRepository configurationRepository) {
        this.jdbc = jdbc;
        this.clock = clock;
        this.configurationRepository = configurationRepository;
        this.settings = new NumberSettings("foundation", configurationRepository)
                .field("enabled", "Bật chương trình (1 = bật, 0 = tắt)", "Chung", 1, 0, 1)
                .field("house_value", "Giá trị một căn nhà vệ sinh (đ)", "Chung", 80_000_000, 1_000_000, 5_000_000_000L)
                .field("first_order_multiplier", "Đơn đầu tiên góp gấp mấy lần", "Chung", 2, 1, 10)
                .field("bucket_min", "Từ số tiền này là \"1 xô gạch\" (đ)", "Chữ hiển thị", 10_000, 1, 100_000_000)
                .field("paint_min", "Từ số tiền này là \"1 thùng sơn\" (đ)", "Chữ hiển thị", 20_000, 1, 100_000_000)
                .field("cement_min", "Từ số tiền này là \"1 bao xi măng\" (đ)", "Chữ hiển thị", 30_000, 1, 100_000_000)
                .field("barrow_min", "Từ số tiền này là \"1 xe rùa gạch\" (đ)", "Chữ hiển thị", 50_000, 1, 100_000_000)
                .field("truck_min", "Từ số tiền này là \"1 xe tải gạch\" (đ)", "Chữ hiển thị", 200_000, 1, 1_000_000_000)
                .field("brick_value", "Một viên gạch trong \"Gạch của tôi\" là (đ)", "Chữ hiển thị", 1_000, 1, 1_000_000);
    }

    public NumberSettings settings() { return settings; }

    public boolean enabled() { return settings.on("enabled"); }

    private Timestamp now() { return Timestamp.valueOf(LocalDateTime.now(clock)); }

    private double vndPerPoint() {
        return configurationRepository.findByKey("bonus_rate").map(c -> {
            try { double v = Double.parseDouble(c.getValue()); return v > 0 ? v : CommissionConfig.DEFAULT_BONUS_RATE; }
            catch (Exception e) { return CommissionConfig.DEFAULT_BONUS_RATE; }
        }).orElse(CommissionConfig.DEFAULT_BONUS_RATE);
    }

    // ── contributions ────────────────────────────────────────────────────

    /**
     * Adds a contribution (once per dedup key when given) and moves the progress. Returns the amount added (0 when off,
     * zero or already counted). Houses finished by it are recorded and their contributors told after.
     */
    @Transactional
    public long contribute(Long userId, String source, long amount, Long orderId, String dedupKey, String note) {
        return contribute(userId, source, amount, orderId, dedupKey, note, now(), true);
    }

    private long contribute(Long userId, String source, long amount, Long orderId, String dedupKey, String note,
                            Object at, boolean announce) {
        if (!enabled() || amount <= 0) return 0;
        Map<String, Object> state = jdbc.queryForMap("SELECT houses_built, current_amount FROM foundation_state WHERE id = 1 FOR UPDATE");
        FoundationRules.State before = new FoundationRules.State(((Number) state.get("houses_built")).intValue(),
                ((Number) state.get("current_amount")).longValue());
        int houseNo = before.housesBuilt() + 1;
        int rows = jdbc.update("INSERT IGNORE INTO foundation_contributions (user_id, source, amount, order_id, house_no, dedup_key, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                userId, source, amount, orderId, houseNo, dedupKey, note, at);
        if (rows != 1) return 0;
        FoundationRules.Added added = FoundationRules.add(before, settings.get("house_value"), amount);
        jdbc.update("UPDATE foundation_state SET houses_built = ?, current_amount = ?, total_amount = total_amount + ?, updated_at = ? WHERE id = 1",
                added.state().housesBuilt(), added.state().currentAmount(), amount, now());
        for (Integer no : added.finished()) {
            jdbc.update("INSERT IGNORE INTO foundation_houses (house_no, completed_at) VALUES (?, ?)", no, now());
            if (announce) announceHouse(no);
        }
        return amount;
    }

    /** The foundation share of a paid order (its `foundation` transactions), doubled for the buyer's first order. */
    public long onOrderPaid(long orderId, long buyerId, boolean firstOrder) {
        try {
            Long points = jdbc.queryForObject(
                    "SELECT COALESCE(SUM(t.amount), 0) FROM transactions t JOIN order_details d ON d.id = t.order_id "
                            + "WHERE d.order_id = ? AND t.type = 'foundation'", Long.class, orderId);
            long amount = FoundationRules.orderAmount(points == null ? 0 : points, vndPerPoint(),
                    firstOrder ? settings.getInt("first_order_multiplier") : 1);
            return contribute(buyerId, SOURCE_ORDER, amount, orderId, "order:" + orderId, firstOrder ? "Đơn đầu tiên" : null);
        } catch (Exception e) {
            log.warn("[foundation] order {} not counted: {}", orderId, e.getMessage());
            return 0;
        }
    }

    // ── orders from before the Foundation existed ───────────────────────

    /** An order with `foundation` transactions written before V78: `era` v2 (anyPoint, buyer = user_id) or portal (VND, buyer = ref_user_id). */
    public record OldOrder(long orderId, Long buyerId, long amount, Timestamp at, String era) {}

    private static final String OLD_NOT_COUNTED = "AND NOT EXISTS (SELECT 1 FROM foundation_contributions c WHERE c.dedup_key = CONCAT('order:', d.order_id)) ";

    /** Delivered orders whose foundation share was never added to the Foundation, oldest first. */
    public List<OldOrder> oldOrders(boolean includePortal) {
        double rate = vndPerPoint();
        List<OldOrder> out = new ArrayList<>(jdbc.query(
                "SELECT d.order_id, MAX(o.user_id), SUM(t.amount), MIN(t.created_at) FROM transactions t "
                        + "JOIN order_details d ON d.id = t.order_id JOIN orders o ON o.id = d.order_id "
                        + "WHERE t.type = 'foundation' AND t.pay_method = 'wallet_c' AND o.status = 'delivered' " + OLD_NOT_COUNTED
                        + "GROUP BY d.order_id",
                (rs, i) -> new OldOrder(rs.getLong(1), (Long) rs.getObject(2, Long.class),
                        FoundationRules.orderAmount(rs.getLong(3), rate, 1), rs.getTimestamp(4), "v2")));
        if (includePortal) out.addAll(jdbc.query(
                "SELECT d.order_id, MAX(t.ref_user_id), SUM(t.amount), MIN(t.created_at) FROM transactions t "
                        + "JOIN order_details d ON d.id = t.order_id JOIN orders o ON o.id = d.order_id "
                        + "WHERE t.type = 'foundation' AND t.pay_method = 'wallet_m' AND t.status = 1 AND o.status = 'delivered' " + OLD_NOT_COUNTED
                        + "GROUP BY d.order_id",
                (rs, i) -> new OldOrder(rs.getLong(1), (Long) rs.getObject(2, Long.class), Math.max(0, rs.getLong(3)),
                        rs.getTimestamp(4), "portal")));
        out.removeIf(o -> o.amount() <= 0);
        out.sort(Comparator.comparing(OldOrder::at, Comparator.nullsFirst(Comparator.naturalOrder())));
        return out;
    }

    /**
     * Adds the old orders to the Foundation in the buyer's name with their own date (once per order, same key as a
     * new order). apply = false only counts. No house announcements for these.
     */
    @Transactional
    public Map<String, Object> importOldOrders(boolean includePortal, boolean apply) {
        List<OldOrder> list = oldOrders(includePortal);
        long v2 = 0, portal = 0, added = 0;
        int v2n = 0, portaln = 0;
        for (OldOrder o : list) {
            if ("v2".equals(o.era())) { v2 += o.amount(); v2n++; } else { portal += o.amount(); portaln++; }
            if (apply) added += contribute(o.buyerId() != null && o.buyerId() > 0 ? o.buyerId() : null, SOURCE_ORDER, o.amount(),
                    o.orderId(), "order:" + o.orderId(), "Đơn trước khi có chương trình", o.at() != null ? o.at() : now(), false);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("v2Orders", v2n);
        out.put("v2Amount", v2);
        out.put("portalOrders", portaln);
        out.put("portalAmount", portal);
        out.put("orders", list.size());
        out.put("amount", v2 + portal);
        out.put("applied", apply);
        out.put("added", added);
        return out;
    }

    /** A milestone gift in the person's name (never throws). */
    public long milestone(long userId, long amount, String dedupKey, String note) {
        try {
            return contribute(userId, SOURCE_MILESTONE, amount, null, dedupKey, note);
        } catch (Exception e) {
            log.warn("[foundation] milestone {} for {} not counted: {}", dedupKey, userId, e.getMessage());
            return 0;
        }
    }

    private void announceHouse(int houseNo) {
        List<Long> people = jdbc.queryForList("SELECT DISTINCT user_id FROM foundation_contributions WHERE house_no = ? AND user_id IS NOT NULL AND removed_at IS NULL",
                Long.class, houseNo);
        for (Long u : people) {
            try {
                if (notifications != null)
                    notifications.createNotification(u, "foundation_house", FoundationRules.houseTitle(houseNo) + " (nhà vệ sinh) đã đủ tiền xây",
                            "Cảm ơn bạn đã góp gạch cho chương trình anyLEARN Foundation. anyLEARN sẽ cập nhật ảnh khi căn nhà hoàn thành.", "/foundation");
                if (achievements != null)
                    achievements.grant(u, AchievementRules.FOUNDATION, "foundation:" + houseNo,
                            "Mình đã góp gạch xây " + FoundationRules.houseOrdinal(houseNo), "Nhà vệ sinh cho trường vùng cao · anyLEARN Foundation", "house");
            } catch (Exception e) {
                log.warn("[foundation] house {} not announced to {}: {}", houseNo, u, e.getMessage());
            }
        }
    }

    // ── reads ────────────────────────────────────────────────────────────

    public String label(long amount) {
        return FoundationRules.brickLabel(amount, settings.get("bucket_min"), settings.get("paint_min"), settings.get("cement_min"), settings.get("barrow_min"), settings.get("truck_min"));
    }

    /** Public page and home strip: progress, finished houses, the latest contributions (names shortened, no amounts). */
    public Map<String, Object> publicState(int recent) {
        Map<String, Object> s = jdbc.queryForMap("SELECT houses_built, current_amount, total_amount FROM foundation_state WHERE id = 1");
        long value = settings.get("house_value");
        long current = ((Number) s.get("current_amount")).longValue();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", enabled());
        out.put("houseValue", value);
        out.put("housesBuilt", ((Number) s.get("houses_built")).intValue());
        out.put("currentHouse", ((Number) s.get("houses_built")).intValue() + 1);
        out.put("currentAmount", current);
        out.put("percent", FoundationRules.percent(current, value));
        out.put("remaining", FoundationRules.remaining(current, value));
        out.put("totalAmount", ((Number) s.get("total_amount")).longValue());
        Long people = jdbc.queryForObject("SELECT COUNT(DISTINCT user_id) FROM foundation_contributions WHERE user_id IS NOT NULL AND removed_at IS NULL", Long.class);
        out.put("contributors", people == null ? 0 : people);
        out.put("recent", jdbc.query(
                "SELECT c.id, c.user_id, c.source, c.amount, c.house_no, c.created_at, u.name, COALESCE(m.hide_name, 0) AS hide_name "
                        + "FROM foundation_contributions c LEFT JOIN users u ON u.id = c.user_id LEFT JOIN foundation_members m ON m.user_id = c.user_id "
                        + "WHERE c.removed_at IS NULL ORDER BY c.id DESC LIMIT ?",
                (rs, i) -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    long uid = rs.getLong("user_id");
                    boolean anyLearn = rs.wasNull();
                    r.put("id", rs.getLong("id"));
                    r.put("name", FoundationRules.publicName(rs.getString("name"), rs.getInt("hide_name") == 1, anyLearn));
                    r.put("label", label(rs.getLong("amount")));
                    r.put("source", rs.getString("source"));
                    r.put("houseNo", rs.getInt("house_no"));
                    r.put("at", rs.getTimestamp("created_at").toLocalDateTime().toString());
                    return r;
                }, Math.max(1, Math.min(100, recent))));
        out.put("houses", jdbc.queryForList(
                "SELECT house_no AS houseNo, completed_at AS completedAt, school, place, opened_on AS openedOn, photo_url AS photoUrl, proof_url AS proofUrl, note "
                        + "FROM foundation_houses ORDER BY house_no"));
        return out;
    }

    /** What a paid order gave the fund: amount, its brick label and the house state after it (null when nothing). */
    public Map<String, Object> ofOrder(long orderId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT amount, house_no FROM foundation_contributions WHERE order_id = ? AND source = 'order' AND removed_at IS NULL", orderId);
        if (rows.isEmpty()) return null;
        long amount = ((Number) rows.get(0).get("amount")).longValue();
        Map<String, Object> s = jdbc.queryForMap("SELECT houses_built, current_amount FROM foundation_state WHERE id = 1");
        long current = ((Number) s.get("current_amount")).longValue();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("amount", amount);
        out.put("label", label(amount));
        out.put("houseNo", ((Number) rows.get(0).get("house_no")).intValue());
        out.put("housesBuilt", ((Number) s.get("houses_built")).intValue());
        out.put("percent", FoundationRules.percent(current, settings.get("house_value")));
        return out;
    }

    /** "Gạch của tôi". */
    public Map<String, Object> mine(long userId) {
        Map<String, Object> t = jdbc.queryForMap(
                "SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS times FROM foundation_contributions WHERE user_id = ? AND removed_at IS NULL", userId);
        long total = ((Number) t.get("total")).longValue();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("total", total);
        out.put("times", ((Number) t.get("times")).intValue());
        out.put("bricks", FoundationRules.bricks(total, settings.get("brick_value")));
        out.put("houses", jdbc.queryForList("SELECT DISTINCT house_no FROM foundation_contributions WHERE user_id = ? AND removed_at IS NULL ORDER BY house_no", Integer.class, userId));
        List<Integer> hide = jdbc.queryForList("SELECT hide_name FROM foundation_members WHERE user_id = ?", Integer.class, userId);
        out.put("hideName", !hide.isEmpty() && hide.get(0) == 1);
        return out;
    }

    public void setHideName(long userId, boolean hide) {
        jdbc.update("INSERT INTO foundation_members (user_id, hide_name) VALUES (?, ?) ON DUPLICATE KEY UPDATE hide_name = VALUES(hide_name)", userId, hide ? 1 : 0);
    }

    /** What registering this course gives the fund (for the course page line), 0 when off or unknown. */
    public Map<String, Object> forItem(Item item) {
        Map<String, Object> out = new LinkedHashMap<>();
        long amount = 0;
        try {
            if (enabled() && itemPoints != null && pointsEngine != null && item.getPrice() != null) {
                var resolved = itemPoints.resolve(item);
                long points = pointsEngine.calculate(item.getPrice(), resolved.commissionRate(), resolved.config(), 0, false).foundationPoints();
                amount = Math.round(points * resolved.config().bonusRate());
            }
        } catch (Exception e) {
            log.debug("[foundation] item {} estimate failed: {}", item.getId(), e.getMessage());
        }
        out.put("amount", amount);
        out.put("label", amount > 0 ? label(amount) : null);
        return out;
    }

    // ── admin ────────────────────────────────────────────────────────────

    public Map<String, Object> adminState() {
        Map<String, Object> out = new LinkedHashMap<>(publicState(50));
        out.put("settings", settings.asMap());
        out.put("contributions", jdbc.queryForList(
                "SELECT c.id, c.user_id AS userId, u.name, u.phone, c.source, c.amount, c.order_id AS orderId, c.house_no AS houseNo, c.note, "
                        + "c.created_at AS at, c.removed_at AS removedAt FROM foundation_contributions c LEFT JOIN users u ON u.id = c.user_id "
                        + "ORDER BY c.id DESC LIMIT 200"));
        out.put("bySource", jdbc.queryForList("SELECT source, COUNT(*) AS times, COALESCE(SUM(amount), 0) AS amount FROM foundation_contributions WHERE removed_at IS NULL GROUP BY source"));
        return out;
    }

    /**
     * "Gỡ" in the back office: takes a contribution back out of the current house. The row stays with removed_at set,
     * so the same order is never imported again. Refused once a house was finished after it (the built count would change).
     */
    @Transactional
    public long remove(long contributionId) {
        Map<String, Object> state = jdbc.queryForMap("SELECT houses_built, current_amount FROM foundation_state WHERE id = 1 FOR UPDATE");
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT amount, house_no, removed_at FROM foundation_contributions WHERE id = ? FOR UPDATE", contributionId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy khoản góp");
        Map<String, Object> row = rows.get(0);
        if (row.get("removed_at") != null) throw new IllegalArgumentException("Khoản này đã gỡ rồi");
        long amount = ((Number) row.get("amount")).longValue();
        int houseNo = ((Number) row.get("house_no")).intValue();
        int built = ((Number) state.get("houses_built")).intValue();
        long current = ((Number) state.get("current_amount")).longValue();
        String problem = FoundationRules.removeProblem(houseNo, built, current, amount);
        if (problem != null) throw new IllegalArgumentException(problem);
        jdbc.update("UPDATE foundation_contributions SET removed_at = ? WHERE id = ?", now(), contributionId);
        jdbc.update("UPDATE foundation_state SET current_amount = current_amount - ?, total_amount = total_amount - ?, updated_at = ? WHERE id = 1",
                amount, amount, now());
        return amount;
    }

    public long seed(long amount, String note) {
        if (amount <= 0) throw new IllegalArgumentException("Số tiền phải lớn hơn 0");
        return contribute(null, SOURCE_SEED, amount, null, null, note == null || note.isBlank() ? "anyLEARN góp" : note.trim());
    }

    public void updateHouse(int houseNo, Map<String, Object> b) {
        int rows = jdbc.update("UPDATE foundation_houses SET school = ?, place = ?, opened_on = ?, photo_url = ?, proof_url = ?, note = ? WHERE house_no = ?",
                str(b.get("school")), str(b.get("place")), str(b.get("openedOn")), str(b.get("photoUrl")), str(b.get("proofUrl")), str(b.get("note")), houseNo);
        if (rows == 0) throw new IllegalArgumentException(FoundationRules.houseTitle(houseNo) + " chưa xây xong");
    }

    private static String str(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }
}
