package com.anylearn.backend.service.quiz;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Leaderboards of the rank quiz (plan 14, section 6): "same rank" and "all time" read the profiles, "week" and "month"
 * read the net stars that {@link #accumulate} adds while answers are graded. The lists are cached for a minute; the
 * caller's own line is always fresh. Names are shown as a display name, never a phone or an e-mail; a person can hide
 * from the boards and the back office can block someone.
 */
@Service
@RequiredArgsConstructor
public class QuizBoardService {

    public static final String TYPE_RANK = "rank";
    public static final String TYPE_WEEK = "week";
    public static final String TYPE_MONTH = "month";
    public static final String TYPE_ALL = "all";
    private static final int LIMIT = 50;
    private static final long CACHE_MS = 60_000;

    private final JdbcTemplate jdbc;
    private final Clock clock;

    private record Cached(long at, List<Map<String, Object>> rows) {}

    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    private LocalDate today() {
        return LocalDate.now(clock);
    }

    /** Adds the net stars of one graded answer to the current week and month. Flagged answers do not count. */
    public void accumulate(long userId, int netStars, boolean flagged) {
        if (flagged) return;
        for (String kind : List.of(QuizBoardRules.WEEK, QuizBoardRules.MONTH)) {
            jdbc.update("INSERT INTO quiz_rank_weekly (user_id, period, net_stars, answers) VALUES (?, ?, ?, 1) " +
                    "ON DUPLICATE KEY UPDATE net_stars = net_stars + VALUES(net_stars), answers = answers + 1",
                    userId, QuizBoardRules.periodKey(kind, today()), netStars);
        }
    }

    public Map<String, Object> hide(long userId, boolean hidden) {
        jdbc.update("INSERT IGNORE INTO quiz_profiles (user_id) VALUES (?)", userId);
        jdbc.update("UPDATE quiz_profiles SET hide_board = ? WHERE user_id = ?", hidden ? 1 : 0, userId);
        cache.clear();
        return Map.of("hidden", hidden);
    }

    public void block(long userId, boolean blocked) {
        jdbc.update("INSERT IGNORE INTO quiz_profiles (user_id) VALUES (?)", userId);
        jdbc.update("UPDATE quiz_profiles SET board_blocked = ? WHERE user_id = ?", blocked ? 1 : 0, userId);
        cache.clear();
    }

    private static final String VISIBLE = " p.hide_board = 0 AND p.board_blocked = 0 ";

    /** The board of a type for a viewer: `{type, period, rank, entries, me, hidden}`. */
    public Map<String, Object> leaderboard(String type, Integer rank, long viewerId) {
        String kind = TYPE_MONTH.equals(type) ? QuizBoardRules.MONTH : TYPE_WEEK.equals(type) ? QuizBoardRules.WEEK : null;
        String period = kind == null ? null : QuizBoardRules.periodKey(kind, today());
        int rankIdx = Math.max(0, Math.min(rank == null ? 0 : rank, QuizRules.RANKS.size() - 1));
        String key = type + "|" + (TYPE_RANK.equals(type) ? rankIdx : period);
        Cached hit = cache.get(key);
        List<Map<String, Object>> rows;
        if (hit != null && System.currentTimeMillis() - hit.at() < CACHE_MS) {
            rows = hit.rows();
        } else {
            rows = load(type, period, rankIdx);
            cache.put(key, new Cached(System.currentTimeMillis(), rows));
        }
        List<Map<String, Object>> entries = new ArrayList<>();
        Map<String, Object> me = null;
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> entry = new LinkedHashMap<>(rows.get(i));
            entry.put("place", i + 1);
            boolean mine = ((Number) entry.get("userId")).longValue() == viewerId;
            entry.put("me", mine);
            entry.remove("userId");
            if (mine) me = entry;
            entries.add(entry);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("type", type);
        out.put("period", period);
        out.put("rank", TYPE_RANK.equals(type) ? rankIdx : null);
        out.put("entries", entries);
        boolean hidden = hiddenFlag(viewerId);
        out.put("hidden", hidden);
        out.put("me", me != null ? me : hidden ? null : ownLine(type, period, rankIdx, viewerId));
        return out;
    }

    public boolean isHidden(long userId) {
        return hiddenFlag(userId);
    }

    private boolean hiddenFlag(long userId) {
        List<Integer> v = jdbc.query("SELECT hide_board FROM quiz_profiles WHERE user_id = ?", (rs, i) -> rs.getInt(1), userId);
        return !v.isEmpty() && v.get(0) == 1;
    }

    private List<Map<String, Object>> load(String type, String period, int rankIdx) {
        if (TYPE_WEEK.equals(type) || TYPE_MONTH.equals(type)) {
            return rows(jdbc.queryForList("SELECT w.user_id AS userId, u.name AS name, p.rank_idx AS rankIdx, p.stars AS stars, w.net_stars AS netStars FROM quiz_rank_weekly w " +
                    "JOIN quiz_profiles p ON p.user_id = w.user_id JOIN users u ON u.id = w.user_id " +
                    "WHERE w.period = ? AND w.net_stars > 0 AND" + VISIBLE + "ORDER BY w.net_stars DESC, w.answers ASC, w.updated_at ASC LIMIT " + LIMIT, period));
        }
        if (TYPE_ALL.equals(type)) {
            return rows(jdbc.queryForList("SELECT p.user_id AS userId, u.name AS name, p.rank_idx AS rankIdx, p.stars AS stars, 0 AS netStars FROM quiz_profiles p " +
                    "JOIN users u ON u.id = p.user_id WHERE p.games > 0 AND" + VISIBLE + "ORDER BY p.rank_idx DESC, p.stars DESC, p.correct DESC, p.user_id ASC LIMIT " + LIMIT));
        }
        return rows(jdbc.queryForList("SELECT p.user_id AS userId, u.name AS name, p.rank_idx AS rankIdx, p.stars AS stars, 0 AS netStars FROM quiz_profiles p " +
                "JOIN users u ON u.id = p.user_id WHERE p.games > 0 AND p.rank_idx = ? AND" + VISIBLE + "ORDER BY p.stars DESC, p.correct DESC, p.user_id ASC LIMIT " + LIMIT, rankIdx));
    }

    private List<Map<String, Object>> rows(List<Map<String, Object>> raw) {
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : raw) {
            int idx = ((Number) r.get("rankIdx")).intValue();
            Map<String, Object> e = new LinkedHashMap<>();
            e.put("userId", r.get("userId"));
            e.put("name", QuizBoardRules.displayName((String) r.get("name")));
            e.put("rankKey", QuizRules.RANKS.get(idx).key());
            e.put("rankName", QuizRules.RANKS.get(idx).label());
            e.put("stars", ((Number) r.get("stars")).intValue());
            e.put("netStars", ((Number) r.get("netStars")).intValue());
            out.add(e);
        }
        return out;
    }

    /** The viewer's own place when they are not in the top list: counted fresh, null when they have no line. */
    private Map<String, Object> ownLine(String type, String period, int rankIdx, long userId) {
        List<Map<String, Object>> mine;
        long better;
        if (TYPE_WEEK.equals(type) || TYPE_MONTH.equals(type)) {
            mine = rows(jdbc.queryForList("SELECT w.user_id AS userId, u.name AS name, p.rank_idx AS rankIdx, p.stars AS stars, w.net_stars AS netStars FROM quiz_rank_weekly w " +
                    "JOIN quiz_profiles p ON p.user_id = w.user_id JOIN users u ON u.id = w.user_id WHERE w.period = ? AND w.user_id = ? AND w.net_stars > 0 AND" + VISIBLE, period, userId));
            if (mine.isEmpty()) return null;
            better = count("SELECT COUNT(*) FROM quiz_rank_weekly w JOIN quiz_profiles p ON p.user_id = w.user_id WHERE w.period = ? AND" + VISIBLE + "AND w.net_stars > ?", period, mine.get(0).get("netStars"));
        } else if (TYPE_ALL.equals(type)) {
            mine = rows(jdbc.queryForList("SELECT p.user_id AS userId, u.name AS name, p.rank_idx AS rankIdx, p.stars AS stars, 0 AS netStars FROM quiz_profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ? AND p.games > 0 AND" + VISIBLE, userId));
            if (mine.isEmpty()) return null;
            int idx = QuizRules.RANKS.stream().map(QuizRules.Rank::key).toList().indexOf(mine.get(0).get("rankKey"));
            better = count("SELECT COUNT(*) FROM quiz_profiles p WHERE p.games > 0 AND" + VISIBLE + "AND (p.rank_idx > ? OR (p.rank_idx = ? AND p.stars > ?))", idx, idx, mine.get(0).get("stars"));
        } else {
            mine = rows(jdbc.queryForList("SELECT p.user_id AS userId, u.name AS name, p.rank_idx AS rankIdx, p.stars AS stars, 0 AS netStars FROM quiz_profiles p JOIN users u ON u.id = p.user_id WHERE p.user_id = ? AND p.games > 0 AND p.rank_idx = ? AND" + VISIBLE, userId, rankIdx));
            if (mine.isEmpty()) return null;
            better = count("SELECT COUNT(*) FROM quiz_profiles p WHERE p.games > 0 AND p.rank_idx = ? AND" + VISIBLE + "AND p.stars > ?", rankIdx, mine.get(0).get("stars"));
        }
        Map<String, Object> me = new LinkedHashMap<>(mine.get(0));
        me.remove("userId");
        me.put("place", better + 1);
        me.put("me", true);
        return me;
    }

    private long count(String sql, Object... args) {
        Long v = jdbc.queryForObject(sql, Long.class, args);
        return v == null ? 0 : v;
    }

    /** Top places of a period for a settlement: visible, not blocked, with more than 0 net stars. */
    public List<Map<String, Object>> top(String period, int places) {
        return jdbc.queryForList("SELECT w.user_id AS userId, u.name AS name, w.net_stars AS netStars FROM quiz_rank_weekly w " +
                "JOIN quiz_profiles p ON p.user_id = w.user_id JOIN users u ON u.id = w.user_id " +
                "WHERE w.period = ? AND w.net_stars > 0 AND" + VISIBLE + "ORDER BY w.net_stars DESC, w.answers ASC, w.updated_at ASC LIMIT " + places, period);
    }

    public void clearCache() {
        cache.clear();
    }
}
