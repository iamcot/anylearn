package com.anylearn.backend.service.arena;

import com.anylearn.backend.service.arena.ArenaService.Session;
import com.anylearn.backend.service.quiz.QuizRules;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** What the back office page "Đấu trường Leo" reads and does (plan 18, section 5). */
@Service
@RequiredArgsConstructor
public class ArenaAdminService {

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final ArenaSettings settings;
    private final ArenaService arena;
    private final ArenaQuestionPicker picker;

    private LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    /** "0912 345 678" → "0912…678" */
    static String maskPhone(Object phone) {
        if (phone == null) return "";
        String p = String.valueOf(phone).replaceAll("\\s", "");
        return p.length() <= 7 ? p : p.substring(0, 4) + "…" + p.substring(p.length() - 3);
    }

    private Session focus() {
        Session current = arena.current();
        if (current != null && current.day().equals(now().toLocalDate())) return current;
        // today's finished session still deserves a look; otherwise the next one
        List<Long> today = jdbc.queryForList("SELECT id FROM arena_sessions WHERE kind = 'auto' AND day = ? AND status <> 'cancelled'", Long.class, java.sql.Date.valueOf(now().toLocalDate()));
        if (!today.isEmpty()) return arena.session(today.get(0));
        return current;
    }

    /** The "Theo dõi hôm nay" tab. */
    public Map<String, Object> overview() {
        arena.ensureUpcoming();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("serverNow", clock.millis());
        Session s = focus();
        if (s == null) {
            out.put("session", null);
            out.put("warning", settings.enabled() ? "Chưa có trận nào được tạo. Kiểm tra ngày chạy và kho câu hỏi." : "Đấu trường Leo đang tắt.");
            return out;
        }
        out.put("session", sessionView(s));
        Map<String, Object> reminders = new LinkedHashMap<>();
        reminders.put("sentAt", s.remindersSentAt() == null ? null : s.remindersSentAt().atZone(clock.getZone()).toInstant().toEpochMilli());
        reminders.put("reminded", count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND reminded_at IS NOT NULL", s.id()));
        reminders.put("app", settings.flag("notify_app"));
        reminders.put("email", settings.flag("notify_email"));
        reminders.put("zns", settings.flag("notify_zns") && !settings.raw("zns_template_id").isBlank());
        out.put("reminders", reminders);
        out.put("questions", questionRows(s));
        out.put("top", topRows(s, 10));
        int have = count("SELECT COUNT(*) FROM arena_questions WHERE session_id = ?", s.id());
        if (have < s.timing().questionCount()) out.put("warning", "Kho câu hỏi không đủ: mới chọn được " + have + " câu.");
        return out;
    }

    private Map<String, Object> sessionView(Session s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.id());
        m.put("day", s.day().toString());
        m.put("status", s.status());
        m.put("kind", s.kind());
        m.put("title", s.title());
        m.put("waiting", s.waiting());
        m.put("expectedAt", s.expectedAt() == null ? null : s.expectedAt().atZone(clock.getZone()).toInstant().toEpochMilli());
        m.put("startsAt", s.waiting() ? null : s.timing().startsAt().atZone(clock.getZone()).toInstant().toEpochMilli());
        m.put("openAt", s.timing().openAt().atZone(clock.getZone()).toInstant().toEpochMilli());
        m.put("questionCount", s.timing().questionCount());
        m.put("answerSeconds", s.timing().answerSeconds());
        m.put("gapSeconds", s.timing().gapSeconds());
        ArenaRules.Phase p = ArenaRules.phaseAt(s.timing(), now());
        m.put("phase", p.kind().name().toLowerCase());
        m.put("qNo", p.qNo());
        m.put("millisToNext", p.millisToNext());
        if (p.kind() == ArenaRules.Kind.QUESTION) {
            m.put("secondsLeft", Math.max(0, java.time.Duration.between(now(), ArenaRules.answerEndsAt(s.timing(), p.qNo())).getSeconds()));
        }
        m.put("registered", count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND registered_at IS NOT NULL", s.id()));
        m.put("inRoom", count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND last_seen_at >= ?", s.id(), Timestamp.valueOf(now().minusSeconds(settings.num("presence_seconds")))));
        m.put("players", count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND answered > 0", s.id()));
        int q = p.qNo() > 0 ? p.qNo() : 0;
        if (q > 0) {
            m.put("answeredCurrent", count("SELECT COUNT(*) FROM arena_answers WHERE session_id = ? AND q_no = ?", s.id(), q));
            Double avg = jdbc.queryForObject("SELECT AVG(correct) FROM arena_answers WHERE session_id = ? AND q_no = ?", Double.class, s.id(), q);
            m.put("correctRate", avg == null ? null : Math.round(avg * 100));
        }
        m.put("settledAt", s.settledAt() == null ? null : s.settledAt().atZone(clock.getZone()).toInstant().toEpochMilli());
        return m;
    }

    private List<Map<String, Object>> questionRows(Session s) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT aq.q_no AS qNo, aq.question_id AS questionId, aq.topic AS topic, aq.difficulty AS difficulty, q.body AS body, q.opt_a AS a, q.opt_b AS b, q.opt_c AS c, q.opt_d AS d, q.correct AS correct, " +
                        "(SELECT COUNT(*) FROM arena_answers x WHERE x.session_id = aq.session_id AND x.q_no = aq.q_no) AS answers, " +
                        "(SELECT AVG(x.correct) FROM arena_answers x WHERE x.session_id = aq.session_id AND x.q_no = aq.q_no) AS correctAvg, " +
                        "(SELECT AVG(x.ms) FROM arena_answers x WHERE x.session_id = aq.session_id AND x.q_no = aq.q_no) AS avgMs " +
                        "FROM arena_questions aq JOIN quiz_questions q ON q.id = aq.question_id WHERE aq.session_id = ? ORDER BY aq.q_no", s.id());
        LocalDateTime now = now();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            int qNo = ((Number) r.get("qNo")).intValue();
            Map<String, Object> m = new LinkedHashMap<>(r);
            m.put("at", ArenaRules.questionAt(s.timing(), qNo).atZone(clock.getZone()).toInstant().toEpochMilli());
            m.put("levelLabel", QuizRules.LEVEL_LABELS.getOrDefault(((Number) r.get("difficulty")).intValue(), ""));
            Object avg = r.remove("correctAvg");
            m.put("correctPct", avg == null ? null : Math.round(((Number) avg).doubleValue() * 100));
            Object ms = r.remove("avgMs");
            m.put("avgSeconds", ms == null ? null : Math.round(((Number) ms).doubleValue() / 100.0) / 10.0);
            boolean started = !now.isBefore(ArenaRules.questionAt(s.timing(), qNo).minusSeconds(s.timing().countdownSeconds()));
            boolean over = !now.isBefore(ArenaRules.answerEndsAt(s.timing(), qNo));
            m.put("state", over ? "done" : started ? "live" : "waiting");
            m.put("locked", started);
            out.add(m);
        }
        return out;
    }

    private List<Map<String, Object>> topRows(Session s, int limit) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT e.user_id AS userId, u.name AS name, u.phone AS phone, e.score AS score, e.correct_ms AS correctMs, e.answered AS answered, e.flagged AS flagged, " +
                        "UNIX_TIMESTAMP(COALESCE(e.registered_at, e.entered_at)) * 1000 AS orderAt FROM arena_entries e JOIN users u ON u.id = e.user_id " +
                        "WHERE e.session_id = ? AND e.answered > 0 AND e.disqualified = 0", s.id());
        rows.sort(java.util.Comparator.comparing(r -> new ArenaRules.Entry(((Number) r.get("userId")).longValue(), ((Number) r.get("score")).intValue(),
                ((Number) r.get("correctMs")).longValue(), r.get("orderAt") == null ? Long.MAX_VALUE : ((Number) r.get("orderAt")).longValue()), ArenaRules.ranking()));
        List<Map<String, Object>> out = new ArrayList<>();
        int rank = 1;
        for (Map<String, Object> r : rows) {
            if (out.size() >= limit) break;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("rank", rank++);
            m.put("userId", r.get("userId"));
            m.put("name", r.get("name"));
            m.put("phone", maskPhone(r.get("phone")));
            m.put("score", r.get("score"));
            m.put("correctMs", r.get("correctMs"));
            m.put("answered", r.get("answered"));
            m.put("flagged", ((Number) r.get("flagged")).intValue() == 1);
            out.add(m);
        }
        return out;
    }

    /** The "Lịch sử" tab. */
    public Map<String, Object> sessions(int page) {
        int size = 20;
        int offset = Math.max(0, page) * size;
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, kind, title, day, status, question_count AS questionCount, players, settled_at AS settledAt FROM arena_sessions ORDER BY day DESC, id DESC LIMIT ? OFFSET ?", size, offset);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            long id = ((Number) r.get("id")).longValue();
            int qc = ((Number) r.get("questionCount")).intValue();
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", id);
            m.put("day", String.valueOf(r.get("day")));
            m.put("kind", r.get("kind"));
            m.put("title", r.get("title"));
            m.put("status", r.get("status"));
            m.put("questionCount", qc);
            m.put("registered", count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND registered_at IS NOT NULL", id));
            m.put("players", count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND answered > 0", id));
            m.put("finishedAll", count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND answered >= ?", id, qc));
            Double avg = jdbc.queryForObject("SELECT AVG(score) FROM arena_entries WHERE session_id = ? AND answered > 0", Double.class, id);
            m.put("avgScore", avg == null ? null : Math.round(avg * 10) / 10.0);
            List<String> top = jdbc.query("SELECT u.name FROM arena_entries e JOIN users u ON u.id = e.user_id WHERE e.session_id = ? AND e.final_rank = 1 AND e.disqualified = 0", (rs, i) -> rs.getString(1), id);
            m.put("top1", top.isEmpty() ? null : top.get(0));
            m.put("rewarded", count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND rewarded_at IS NOT NULL", id));
            m.put("settled", r.get("settledAt") != null);
            out.add(m);
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("rows", out);
        res.put("total", count("SELECT COUNT(*) FROM arena_sessions"));
        res.put("size", size);
        return res;
    }

    public Map<String, Object> sessionDetail(long id) {
        Session s = arena.session(id);
        if (s == null) throw new IllegalStateException("Không tìm thấy trận này");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("session", sessionView(s));
        out.put("questions", questionRows(s));
        out.put("top", topRows(s, 100));
        return out;
    }

    // ---------------------------------------------------------------- changing a session

    private Session editable(long id) {
        Session s = arena.session(id);
        if (s == null) throw new IllegalStateException("Không tìm thấy trận này");
        if (!"scheduled".equals(s.status()) && !"live".equals(s.status()) && !s.waiting()) throw new IllegalStateException("Trận này đã kết thúc hoặc đã hủy");
        return s;
    }

    /** Swaps one question (a random one of the same level and topic, or the id sent). Locked once the countdown of that question started. */
    public Map<String, Object> replaceQuestion(long sessionId, int qNo, Long questionId) {
        Session s = editable(sessionId);
        if (!now().isBefore(ArenaRules.questionAt(s.timing(), qNo).minusSeconds(s.timing().countdownSeconds()))) throw new IllegalStateException("Câu này đã bắt đầu, không đổi được nữa");
        List<Map<String, Object>> cur = jdbc.queryForList("SELECT question_id, topic, difficulty FROM arena_questions WHERE session_id = ? AND q_no = ?", sessionId, qNo);
        if (cur.isEmpty()) throw new IllegalStateException("Không có câu hỏi này");
        long newId;
        String topic;
        int level;
        if (questionId != null) {
            List<Map<String, Object>> found = jdbc.queryForList("SELECT id, topic, difficulty FROM quiz_questions WHERE id = ? AND status = 'active'", questionId);
            if (found.isEmpty()) throw new IllegalStateException("Không tìm thấy câu hỏi đang bật với mã " + questionId);
            Integer dup = jdbc.queryForObject("SELECT COUNT(*) FROM arena_questions WHERE session_id = ? AND question_id = ?", Integer.class, sessionId, questionId);
            if (dup != null && dup > 0) throw new IllegalStateException("Câu này đã có trong trận");
            newId = questionId;
            topic = String.valueOf(found.get(0).get("topic"));
            level = ((Number) found.get(0).get("difficulty")).intValue();
        } else {
            Set<Long> exclude = new HashSet<>(jdbc.queryForList("SELECT question_id FROM arena_questions WHERE session_id = ?", Long.class, sessionId));
            ArenaQuestionPicker.Pick p = picker.replacement(qNo, ((Number) cur.get(0).get("difficulty")).intValue(), String.valueOf(cur.get(0).get("topic")), exclude, settings.num("no_repeat_days"), sessionId);
            if (p == null) throw new IllegalStateException("Kho không còn câu khác để đổi");
            newId = p.questionId();
            topic = p.topic();
            level = p.difficulty();
        }
        jdbc.update("UPDATE arena_questions SET question_id = ?, topic = ?, difficulty = ? WHERE session_id = ? AND q_no = ?", newId, topic, level, sessionId, qNo);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("questions", questionRows(arena.session(sessionId)));
        return out;
    }

    /** Picks the whole set again; only before the room opens. */
    public Map<String, Object> repick(long sessionId) {
        Session s = editable(sessionId);
        if (!s.custom() && !now().isBefore(s.timing().openAt())) throw new IllegalStateException("Phòng đã mở, không chọn lại cả trận được nữa");
        if (s.custom() && !s.waiting()) throw new IllegalStateException("Đấu trường đã bắt đầu, không chọn lại cả bộ câu hỏi được nữa");
        List<ArenaQuestionPicker.Pick> picks = arena.pickFor(s.day(), s.timing().questionCount(), sessionId);
        if (picks.isEmpty()) throw new IllegalStateException("Kho câu hỏi đang trống");
        jdbc.update("DELETE FROM arena_questions WHERE session_id = ?", sessionId);
        for (ArenaQuestionPicker.Pick p : picks) {
            jdbc.update("INSERT INTO arena_questions (session_id, q_no, question_id, topic, difficulty) VALUES (?, ?, ?, ?, ?)", sessionId, p.qNo(), p.questionId(), p.topic(), p.difficulty());
        }
        jdbc.update("UPDATE arena_sessions SET question_count = ? WHERE id = ?", picks.size(), sessionId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("questions", questionRows(arena.session(sessionId)));
        return out;
    }

    /** Stops the session: nobody is paid. */
    public Map<String, Object> cancel(long sessionId) {
        Session s = editable(sessionId);
        if (s.custom()) {
            arena.closeCustom(sessionId);
            return Map.of("cancelled", true);
        }
        jdbc.update("UPDATE arena_sessions SET status = 'cancelled' WHERE id = ? AND status IN ('scheduled', 'live')", sessionId);
        return Map.of("cancelled", true);
    }

    /** Flagged players of the last 30 days, with what is still waiting. */
    public List<Map<String, Object>> flags() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT e.session_id AS sessionId, s.day AS day, s.status AS status, e.user_id AS userId, u.name AS name, u.phone AS phone, e.score AS score, e.final_rank AS finalRank, " +
                        "e.flag_reason AS reason, e.rewarded_at AS rewardedAt, e.disqualified AS disqualified, e.reward_coins AS rewardCoins FROM arena_entries e " +
                        "JOIN arena_sessions s ON s.id = e.session_id JOIN users u ON u.id = e.user_id " +
                        "WHERE e.flagged = 1 AND s.day >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) ORDER BY s.day DESC, e.final_rank IS NULL, e.final_rank LIMIT 200");
        List<Map<String, Object>> out = new ArrayList<>();
        int prizes = settings.rewardCoins().size();
        for (Map<String, Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("sessionId", r.get("sessionId"));
            m.put("day", String.valueOf(r.get("day")));
            m.put("userId", r.get("userId"));
            m.put("name", r.get("name"));
            m.put("phone", maskPhone(r.get("phone")));
            m.put("score", r.get("score"));
            m.put("rank", r.get("finalRank"));
            m.put("reason", r.get("reason"));
            boolean top = r.get("finalRank") != null && ((Number) r.get("finalRank")).intValue() <= prizes;
            m.put("top", top);
            m.put("waiting", top && r.get("rewardedAt") == null && ((Number) r.get("disqualified")).intValue() == 0 && "done".equals(r.get("status")));
            m.put("disqualified", ((Number) r.get("disqualified")).intValue() == 1);
            m.put("rewardCoins", r.get("rewardCoins"));
            out.add(m);
        }
        return out;
    }

    /** Flagged top 3 players whose prize is waiting for a decision (the red number of the menu). */
    public int flaggedWaiting() {
        return count("SELECT COUNT(*) FROM arena_entries e JOIN arena_sessions s ON s.id = e.session_id WHERE e.flagged = 1 AND e.disqualified = 0 AND e.rewarded_at IS NULL " +
                "AND e.final_rank IS NOT NULL AND e.final_rank <= ? AND s.status = 'done' AND s.kind = 'auto' AND s.day >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)", settings.rewardCoins().size());
    }

    public List<Map<String, Object>> topics() {
        return jdbc.queryForList("SELECT topic_key AS `key`, label FROM quiz_topics WHERE active = 1 ORDER BY sort_order, topic_key");
    }

    /** "20 câu, 5 cấp, 8 chủ đề: mỗi cấp 4 câu" for the settings form. */
    public String planText() {
        int count = settings.num("question_count");
        int levels = settings.levels().size();
        int topics = picker.topics(settings.topics()).size();
        int base = count / levels;
        String per = count % levels == 0 ? "mỗi cấp " + base + " câu" : "mỗi cấp " + base + " đến " + (base + 1) + " câu";
        return count + " câu, " + levels + " cấp, " + topics + " chủ đề: " + per;
    }

    // ---------------------------------------------------------------- custom arena ("Đấu trường riêng")

    /** The "Đấu trường riêng" tab: the live custom arena with its questions and ranking, or null, plus the last ones. */
    public Map<String, Object> custom() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("serverNow", clock.millis());
        Session s = arena.customCurrent();
        if (s == null) {
            out.put("session", null);
        } else {
            out.put("session", sessionView(s));
            out.put("questions", questionRows(s));
            out.put("top", topRows(s, 100));
        }
        out.put("history", jdbc.queryForList("SELECT id, title, day, status, players, question_count AS questionCount FROM arena_sessions WHERE kind = 'custom' ORDER BY id DESC LIMIT 10")
                .stream().map(r -> {
                    Map<String, Object> m = new LinkedHashMap<>(r);
                    m.put("day", String.valueOf(r.get("day")));
                    return m;
                }).toList());
        return out;
    }

    public Map<String, Object> createCustom(String title, Long expectedAtMillis, Integer questionCount, Integer answerSeconds) {
        LocalDateTime expected = expectedAtMillis == null ? null : LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(expectedAtMillis), clock.getZone());
        arena.createCustom(title, expected, questionCount, answerSeconds);
        return custom();
    }

    public Map<String, Object> startCustom(long id) {
        arena.startCustom(id);
        return custom();
    }

    public Map<String, Object> closeCustom(long id) {
        arena.closeCustom(id);
        return custom();
    }
}
