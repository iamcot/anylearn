package com.anylearn.backend.service.arena;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Chooses the questions of one session from the rank quiz bank (plan 18). One random question per slot of the even plan;
 * questions already used by the Arena in the last `no_repeat_days` and the ones already in this session are left out.
 * Fallback order when a cell is empty: same level other topic, nearer level same topic, nearer level other topic, then a repeat.
 */
@Component
@RequiredArgsConstructor
public class ArenaQuestionPicker {

    public record Pick(int qNo, long questionId, String topic, int difficulty) {}

    private final JdbcTemplate jdbc;
    private final Clock clock;

    /** Active topic keys the Arena may use: the configured list, else every active topic of the bank. */
    public List<String> topics(List<String> configured) {
        List<String> active = jdbc.query("SELECT topic_key FROM quiz_topics WHERE active = 1 ORDER BY sort_order, topic_key", (rs, i) -> rs.getString(1));
        if (configured == null || configured.isEmpty()) return active;
        List<String> kept = configured.stream().filter(active::contains).toList();
        return kept.isEmpty() ? active : kept;
    }

    /** Fewer picks than slots when the bank runs dry. {@code exceptSession} is left out of the no-repeat window (a re-pick of itself). */
    public List<Pick> pick(List<ArenaRules.Slot> plan, int noRepeatDays, Long exceptSession) {
        Set<Long> recent = recentlyUsed(noRepeatDays, exceptSession);
        Set<Long> own = new HashSet<>();
        List<Pick> out = new ArrayList<>();
        for (ArenaRules.Slot slot : plan) {
            Pick p = choose(out.size() + 1, slot.level(), slot.topic(), recent, own);
            if (p != null) {
                own.add(p.questionId());
                out.add(p);
            }
        }
        return out;
    }

    /** A different question of the same level and topic (or the nearest that exists), for the admin's "đổi câu khác". */
    public Pick replacement(int qNo, int level, String topic, Set<Long> exclude, int noRepeatDays, Long exceptSession) {
        return choose(qNo, level, topic, recentlyUsed(noRepeatDays, exceptSession), new HashSet<>(exclude));
    }

    private Set<Long> recentlyUsed(int noRepeatDays, Long exceptSession) {
        Timestamp since = Timestamp.valueOf(LocalDateTime.now(clock).minusDays(Math.max(0, noRepeatDays)));
        return new HashSet<>(jdbc.query("SELECT q.question_id FROM arena_questions q JOIN arena_sessions s ON s.id = q.session_id WHERE s.day >= ? AND s.id <> ?",
                (rs, i) -> rs.getLong(1), since, exceptSession == null ? -1L : exceptSession));
    }

    /** Fresh questions first (not used by the Arena lately), then a repeat of an old one; never twice in the same session. */
    private Pick choose(int qNo, int level, String topic, Set<Long> recent, Set<Long> own) {
        for (boolean fresh : new boolean[]{true, false}) {
            Set<Long> exclude = new HashSet<>(own);
            if (fresh) exclude.addAll(recent);
            if (topic != null) {
                Pick p = one(qNo, level, topic, exclude);
                if (p != null) return p;
            }
            // same level other topic comes before another level of the same topic
            Pick sameLevel = one(qNo, level, null, exclude);
            if (sameLevel != null) return sameLevel;
            if (topic != null) {
                for (int lv : levelOrder(level)) {
                    if (lv == level) continue;
                    Pick p = one(qNo, lv, topic, exclude);
                    if (p != null) return p;
                }
            }
            for (int lv : levelOrder(level)) {
                if (lv == level) continue;
                Pick p = one(qNo, lv, null, exclude);
                if (p != null) return p;
            }
        }
        return null;
    }

    /** The level first, then 1 step away on both sides, and so on. */
    static List<Integer> levelOrder(int level) {
        List<Integer> out = new ArrayList<>();
        out.add(level);
        for (int d = 1; d <= 4; d++) {
            if (level - d >= 1) out.add(level - d);
            if (level + d <= 5) out.add(level + d);
        }
        return out;
    }

    private Pick one(int qNo, int level, String topic, Set<Long> exclude) {
        StringBuilder sql = new StringBuilder("SELECT id, topic, difficulty FROM quiz_questions WHERE status = 'active' AND difficulty = ?");
        List<Object> args = new ArrayList<>();
        args.add(level);
        if (topic != null) { sql.append(" AND topic = ?"); args.add(topic); }
        if (!exclude.isEmpty()) {
            sql.append(" AND id NOT IN (").append(String.join(",", Collections.nCopies(exclude.size(), "?"))).append(")");
            args.addAll(exclude);
        }
        sql.append(" ORDER BY RAND() LIMIT 1");
        List<Pick> rows = jdbc.query(sql.toString(), (rs, i) -> new Pick(qNo, rs.getLong("id"), rs.getString("topic"), rs.getInt("difficulty")), args.toArray());
        return rows.isEmpty() ? null : rows.get(0);
    }
}
