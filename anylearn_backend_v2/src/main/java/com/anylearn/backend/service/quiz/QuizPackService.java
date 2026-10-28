package com.anylearn.backend.service.quiz;

import com.anylearn.backend.service.shop.ShopRules;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * Training packs of the rank quiz (plan 15, section 5): bought in the shop (`ShopService`), set up and switched on here. A pack has a number of
 * questions; every question handed out in practice mode uses one. Rows of `quiz_packs`; the profile points at the pack in use (`active_pack_id`).
 */
@Service
@RequiredArgsConstructor
public class QuizPackService {

    public static final String ACTIVE = "active";
    public static final String USED_UP = "used_up";

    private final JdbcTemplate jdbc;
    private final QuizGameSettings settings;

    /** One pack row. `topics` is null for "every topic". */
    public record Pack(long id, long userId, String type, Integer difficulty, String topic, List<String> topics, int total, int remaining, String status) {
        /** A topic pack is ready to use only when its topic is chosen; a level pack always is (no topic = all). */
        public boolean configured() {
            return ShopRules.TYPE_LEVEL.equals(type) || topic != null;
        }
    }

    private static List<String> split(String text) {
        if (text == null || text.isBlank()) return null;
        return Arrays.stream(text.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static Pack map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new Pack(rs.getLong("id"), rs.getLong("user_id"), rs.getString("type"), (Integer) rs.getObject("difficulty"), rs.getString("topic"),
                split(rs.getString("topics")), rs.getInt("total"), rs.getInt("remaining"), rs.getString("status"));
    }

    private static final String COLUMNS = "id, user_id, type, difficulty, topic, topics, total, remaining, status";

    /** A new pack of the person's, with the full number of questions and no topic chosen yet. */
    @Transactional
    public Pack create(long userId, String type, Integer difficulty, int price) {
        boolean byLevel = ShopRules.needsDifficulty(type);
        if (byLevel && (difficulty == null || !QuizRules.DIFFICULTIES.contains(difficulty))) throw new IllegalArgumentException("Chọn cấp độ cho gói này");
        int size = settings.packSize();
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            var ps = con.prepareStatement("INSERT INTO quiz_packs (user_id, type, difficulty, total, remaining, price) VALUES (?, ?, ?, ?, ?, ?)", java.sql.Statement.RETURN_GENERATED_KEYS);
            ps.setLong(1, userId);
            ps.setString(2, type);
            if (byLevel) ps.setInt(3, difficulty); else ps.setObject(3, null);
            ps.setInt(4, size);
            ps.setInt(5, size);
            ps.setInt(6, price);
            return ps;
        }, keys);
        return find(userId, Objects.requireNonNull(keys.getKey()).longValue());
    }

    public Pack find(long userId, long packId) {
        List<Pack> rows = jdbc.query("SELECT " + COLUMNS + " FROM quiz_packs WHERE id = ? AND user_id = ?", (rs, i) -> map(rs), packId, userId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy gói này");
        return rows.get(0);
    }

    /** The packs with questions left, oldest first. */
    public List<Pack> active(long userId) {
        return jdbc.query("SELECT " + COLUMNS + " FROM quiz_packs WHERE user_id = ? AND status = 'active' AND remaining > 0 ORDER BY id", (rs, i) -> map(rs), userId);
    }

    /** The pack the person switched on, or null (a pack that is gone, used up or not set up is switched off here). */
    public Pack inUse(long userId) {
        List<Long> ids = jdbc.query("SELECT active_pack_id FROM quiz_profiles WHERE user_id = ?", (rs, i) -> (Long) rs.getObject("active_pack_id"), userId);
        Long id = ids.isEmpty() ? null : ids.get(0);
        if (id == null) return null;
        List<Pack> rows = jdbc.query("SELECT " + COLUMNS + " FROM quiz_packs WHERE id = ? AND user_id = ?", (rs, i) -> map(rs), id, userId);
        if (rows.isEmpty() || !ACTIVE.equals(rows.get(0).status()) || rows.get(0).remaining() <= 0 || !rows.get(0).configured()) {
            deactivate(userId);
            return null;
        }
        return rows.get(0);
    }

    /** Saves the topics of a pack and switches it on. `topics` = keys (a level pack: none or all = every topic; the others: exactly one). */
    @Transactional
    public Pack saveAndActivate(long userId, long packId, List<String> topics) {
        Pack pack = find(userId, packId);
        if (!ACTIVE.equals(pack.status()) || pack.remaining() <= 0) throw new IllegalStateException("Gói này đã dùng hết");
        Set<String> valid = new HashSet<>(jdbc.queryForList("SELECT topic_key FROM quiz_topics WHERE active = 1", String.class));
        ShopRules.PackOptions options = ShopRules.packOptions(pack.type(), topics, valid);
        jdbc.update("UPDATE quiz_packs SET topic = ?, topics = ? WHERE id = ?", options.topic(), options.topics() == null ? null : String.join(",", options.topics()), packId);
        jdbc.update("INSERT IGNORE INTO quiz_profiles (user_id) VALUES (?)", userId);
        jdbc.update("UPDATE quiz_profiles SET active_pack_id = ? WHERE user_id = ?", packId, userId);
        return find(userId, packId);
    }

    @Transactional
    public void deactivate(long userId) {
        jdbc.update("UPDATE quiz_profiles SET active_pack_id = NULL WHERE user_id = ?", userId);
    }

    /** Uses one question of the pack; the last one marks it used up and switches it off. Returns what is left. */
    @Transactional
    public int consume(Pack pack) {
        int rows = jdbc.update("UPDATE quiz_packs SET remaining = remaining - 1 WHERE id = ? AND remaining > 0", pack.id());
        if (rows != 1) throw new IllegalStateException("Gói này đã dùng hết");
        Integer left = jdbc.queryForObject("SELECT remaining FROM quiz_packs WHERE id = ?", Integer.class, pack.id());
        int remaining = left == null ? 0 : left;
        if (remaining <= 0) {
            jdbc.update("UPDATE quiz_packs SET status = 'used_up' WHERE id = ?", pack.id());
            deactivate(pack.userId());
        }
        return remaining;
    }

    /** One pack as the API shows it. */
    public Map<String, Object> view(Pack p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.id());
        m.put("type", p.type());
        m.put("typeLabel", ShopRules.packLabel(p.type()));
        m.put("difficulty", p.difficulty());
        m.put("difficultyLabel", p.difficulty() == null ? null : QuizRules.LEVEL_LABELS.get(p.difficulty()));
        m.put("topic", p.topic());
        m.put("topics", p.topics());
        m.put("topicLabels", topicLabels(p));
        m.put("total", p.total());
        m.put("remaining", p.remaining());
        m.put("configured", p.configured());
        m.put("status", p.status());
        return m;
    }

    private List<String> topicLabels(Pack p) {
        if (p.topics() == null) return List.of();
        Map<String, String> labels = new HashMap<>();
        jdbc.query("SELECT topic_key, label FROM quiz_topics", rs -> { labels.put(rs.getString("topic_key"), rs.getString("label")); });
        return p.topics().stream().map(k -> labels.getOrDefault(k, k)).toList();
    }
}
