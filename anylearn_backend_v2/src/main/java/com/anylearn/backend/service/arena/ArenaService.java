package com.anylearn.backend.service.arena;

import com.anylearn.backend.service.arena.ArenaRules.Kind;
import com.anylearn.backend.service.arena.ArenaRules.Phase;
import com.anylearn.backend.service.arena.ArenaRules.Timing;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.quiz.QuizBoardRules;
import com.anylearn.backend.service.quiz.QuizRules;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Đấu trường Leo (plan 18): sessions, the room, the questions and the answers. Every moment is worked out from the server
 * clock; the right answer of a question leaves the server only after its time is up.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ArenaService {

    /** A session row with its pace. */
    public record Session(long id, LocalDate day, String status, Timing timing, LocalDateTime remindersSentAt, LocalDateTime settledAt, int players,
                          String kind, String title, LocalDateTime expectedAt) {
        public boolean custom() { return "custom".equals(kind); }
        /** A custom arena the back office has not started yet: its start is parked far away, so every phase reads "before". */
        public boolean waiting() { return custom() && "waiting".equals(status); }
    }

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final ArenaSettings settings;
    private final ArenaQuestionPicker picker;
    private final GameEventService events;
    private final com.anylearn.backend.service.fun.FunSettings funSettings;

    private final Map<Long, CachedBoard> boardCache = new ConcurrentHashMap<>();
    private volatile long lastEnsure = 0;

    private record CachedBoard(long at, List<Map<String, Object>> rows) {}

    LocalDateTime now() {
        return LocalDateTime.now(clock);
    }

    long millis(LocalDateTime t) {
        return t.atZone(clock.getZone()).toInstant().toEpochMilli();
    }

    ZoneId zone() {
        return clock.getZone();
    }

    // ---------------------------------------------------------------- sessions

    private Session mapSession(java.sql.ResultSet rs) throws java.sql.SQLException {
        Timing t = new Timing(rs.getTimestamp("starts_at").toLocalDateTime(), rs.getTimestamp("open_at").toLocalDateTime(), rs.getInt("question_count"),
                rs.getInt("countdown_seconds"), rs.getInt("answer_seconds"), rs.getInt("reveal_seconds"), rs.getInt("gap_seconds"));
        Timestamp rem = rs.getTimestamp("reminders_sent_at");
        Timestamp set = rs.getTimestamp("settled_at");
        Timestamp exp = rs.getTimestamp("expected_at");
        return new Session(rs.getLong("id"), rs.getDate("day").toLocalDate(), rs.getString("status"), t,
                rem == null ? null : rem.toLocalDateTime(), set == null ? null : set.toLocalDateTime(), rs.getInt("players"),
                rs.getString("kind"), rs.getString("title"), exp == null ? null : exp.toLocalDateTime());
    }

    private static final String SESSION_COLS = "id, day, starts_at, open_at, question_count, countdown_seconds, answer_seconds, reveal_seconds, gap_seconds, status, reminders_sent_at, settled_at, players, kind, title, expected_at";

    public Session session(long id) {
        List<Session> rows = jdbc.query("SELECT " + SESSION_COLS + " FROM arena_sessions WHERE id = ?", (rs, i) -> mapSession(rs), id);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** The session people should see now: the first one (not cancelled) that has not ended yet. Null when none. */
    public Session current() {
        LocalDateTime now = now();
        List<Session> rows = jdbc.query("SELECT " + SESSION_COLS + " FROM arena_sessions WHERE kind = 'auto' AND status <> 'cancelled' AND day >= ? ORDER BY day LIMIT 3",
                (rs, i) -> mapSession(rs), java.sql.Date.valueOf(now.toLocalDate().minusDays(1)));
        for (Session s : rows) {
            if (now.isBefore(ArenaRules.endsAt(s.timing()))) return s;
        }
        return null;
    }

    /** Id of the session that ended today (so the banner can offer the result), or null. */
    public Long endedToday() {
        LocalDateTime now = now();
        List<Session> rows = jdbc.query("SELECT " + SESSION_COLS + " FROM arena_sessions WHERE kind = 'auto' AND status <> 'cancelled' AND day = ?", (rs, i) -> mapSession(rs), java.sql.Date.valueOf(now.toLocalDate()));
        for (Session s : rows) {
            if (!now.isBefore(ArenaRules.endsAt(s.timing()))) return s.id();
        }
        return null;
    }

    /** Makes sure today's session (if it is a running day and not over) and the next running day have a session with questions. */
    public void ensureUpcoming() {
        lastEnsure = System.currentTimeMillis();
        if (!settings.enabled()) return;
        LocalDateTime now = now();
        LocalDate day = now.toLocalDate();
        List<LocalDate> wanted = new ArrayList<>();
        LocalDate first = ArenaRules.nextRunDay(day, settings.days());
        if (first == null) return;
        if (first.equals(day) && !now.isBefore(ArenaRules.endsAt(settings.timing(day)))) {
            first = ArenaRules.nextRunDay(day.plusDays(1), settings.days());
        }
        if (first != null) {
            wanted.add(first);
            LocalDate second = ArenaRules.nextRunDay(first.plusDays(1), settings.days());
            if (second != null) wanted.add(second);
        }
        for (LocalDate d : wanted) createFor(d);
        refreshScheduled();
    }

    private void lazyEnsure() {
        if (System.currentTimeMillis() - lastEnsure > 60_000) {
            try {
                ensureUpcoming();
            } catch (Exception e) {
                log.warn("[arena] ensureUpcoming failed: {}", e.getMessage());
            }
        }
    }

    private void createFor(LocalDate day) {
        Integer exists = jdbc.queryForObject("SELECT COUNT(*) FROM arena_sessions WHERE kind = 'auto' AND day = ?", Integer.class, java.sql.Date.valueOf(day));
        if (exists != null && exists > 0) return;
        Timing t = settings.timing(day);
        List<ArenaQuestionPicker.Pick> picks = pickFor(day, t.questionCount(), null);
        if (picks.isEmpty()) {
            log.warn("[arena] no questions for {}: the question bank is empty", day);
            return;
        }
        int inserted = jdbc.update("INSERT IGNORE INTO arena_sessions (day, starts_at, open_at, question_count, countdown_seconds, answer_seconds, reveal_seconds, gap_seconds, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')",
                java.sql.Date.valueOf(day), Timestamp.valueOf(t.startsAt()), Timestamp.valueOf(t.openAt()), picks.size(), t.countdownSeconds(), t.answerSeconds(), t.revealSeconds(), t.gapSeconds());
        if (inserted == 0) return;
        Long id = jdbc.queryForObject("SELECT id FROM arena_sessions WHERE kind = 'auto' AND day = ?", Long.class, java.sql.Date.valueOf(day));
        savePicks(id, picks);
        if (picks.size() < t.questionCount()) log.warn("[arena] {}: only {} of {} questions found", day, picks.size(), t.questionCount());
    }

    List<ArenaQuestionPicker.Pick> pickFor(LocalDate day, int count, Long exceptSession) {
        List<String> topics = picker.topics(settings.topics());
        List<ArenaRules.Slot> plan = ArenaRules.evenPlan(count, settings.levels(), topics, (int) (day.toEpochDay() % Math.max(1, topics.size())));
        return picker.pick(plan, settings.num("no_repeat_days"), exceptSession);
    }

    private void savePicks(long sessionId, List<ArenaQuestionPicker.Pick> picks) {
        for (ArenaQuestionPicker.Pick p : picks) {
            jdbc.update("INSERT INTO arena_questions (session_id, q_no, question_id, topic, difficulty) VALUES (?, ?, ?, ?, ?)", sessionId, p.qNo(), p.questionId(), p.topic(), p.difficulty());
        }
    }

    /** A settings change reaches the sessions that have not opened their room yet; an opened one keeps its pace. */
    @Transactional
    public void refreshScheduled() {
        LocalDateTime now = now();
        List<Session> rows = jdbc.query("SELECT " + SESSION_COLS + " FROM arena_sessions WHERE kind = 'auto' AND status = 'scheduled'", (rs, i) -> mapSession(rs));
        for (Session s : rows) {
            if (!now.isBefore(s.timing().openAt())) continue;
            if (!settings.days().contains(s.day().getDayOfWeek())) {
                jdbc.update("UPDATE arena_sessions SET status = 'cancelled' WHERE id = ? AND status = 'scheduled'", s.id());
                continue;
            }
            Timing t = settings.timing(s.day());
            Integer have = jdbc.queryForObject("SELECT COUNT(*) FROM arena_questions WHERE session_id = ?", Integer.class, s.id());
            boolean same = t.startsAt().equals(s.timing().startsAt()) && t.openAt().equals(s.timing().openAt())
                    && t.countdownSeconds() == s.timing().countdownSeconds() && t.answerSeconds() == s.timing().answerSeconds()
                    && t.revealSeconds() == s.timing().revealSeconds() && t.gapSeconds() == s.timing().gapSeconds();
            int count = have == null ? 0 : have;
            if (!same || (t.questionCount() != s.timing().questionCount())) {
                if (t.questionCount() != count) {
                    List<ArenaQuestionPicker.Pick> picks = pickFor(s.day(), t.questionCount(), s.id());
                    if (!picks.isEmpty()) {
                        jdbc.update("DELETE FROM arena_questions WHERE session_id = ?", s.id());
                        savePicks(s.id(), picks);
                        count = picks.size();
                    }
                }
                jdbc.update("UPDATE arena_sessions SET starts_at = ?, open_at = ?, question_count = ?, countdown_seconds = ?, answer_seconds = ?, reveal_seconds = ?, gap_seconds = ? WHERE id = ? AND status = 'scheduled'",
                        Timestamp.valueOf(t.startsAt()), Timestamp.valueOf(t.openAt()), count, t.countdownSeconds(), t.answerSeconds(), t.revealSeconds(), t.gapSeconds(), s.id());
            }
        }
    }

    // ---------------------------------------------------------------- reading

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    private int registered(long sessionId) {
        return count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND registered_at IS NOT NULL", sessionId);
    }

    /** A timestamp column comes back as `Timestamp` or `LocalDateTime` depending on the driver path. */
    private static LocalDateTime toLocal(Object value) {
        return value instanceof Timestamp t ? t.toLocalDateTime() : (LocalDateTime) value;
    }

    private int inRoom(long sessionId) {
        return count("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND last_seen_at >= ?", sessionId, Timestamp.valueOf(now().minusSeconds(settings.num("presence_seconds"))));
    }

    private Map<String, Object> timingMap(Session s) {
        Map<String, Object> t = new LinkedHashMap<>();
        t.put("sessionId", s.id());
        t.put("day", s.day().toString());
        t.put("startsAt", millis(s.timing().startsAt()));
        t.put("openAt", millis(s.timing().openAt()));
        t.put("questionCount", s.timing().questionCount());
        t.put("countdownSeconds", s.timing().countdownSeconds());
        t.put("answerSeconds", s.timing().answerSeconds());
        t.put("revealSeconds", s.timing().revealSeconds());
        t.put("gapSeconds", s.timing().gapSeconds());
        return t;
    }

    private Map<String, Object> phaseMap(Session s) {
        Phase p = ArenaRules.phaseAt(s.timing(), now());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("kind", p.kind().name().toLowerCase());
        m.put("qNo", p.qNo());
        m.put("nextQNo", p.nextQNo());
        m.put("millisToNext", p.millisToNext());
        return m;
    }

    /** Banner of the Vui học page. */
    public Map<String, Object> banner(long userId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("serverNow", clock.millis());
        out.put("enabled", settings.enabled());
        if (!settings.enabled()) return out;
        lazyEnsure();
        out.put("custom", customBanner(userId));
        Session s = current();
        out.put("endedSessionId", endedToday());
        if (s == null) {
            out.put("sessionId", null);
            return out;
        }
        out.putAll(timingMap(s));
        out.put("status", s.status());
        out.put("phase", phaseMap(s));
        out.put("registeredCount", registered(s.id()));
        out.put("inRoomCount", inRoom(s.id()));
        List<Map<String, Object>> mine = jdbc.queryForList("SELECT registered_at, last_seen_at, entered_at FROM arena_entries WHERE session_id = ? AND user_id = ?", s.id(), userId);
        out.put("registered", !mine.isEmpty() && mine.get(0).get("registered_at") != null);
        out.put("inRoom", !mine.isEmpty() && mine.get(0).get("last_seen_at") != null
                && toLocal(mine.get(0).get("last_seen_at")).isAfter(now().minusSeconds(settings.num("presence_seconds"))));
        out.put("rules", rules());
        return out;
    }

    // ---------------------------------------------------------------- custom ("đấu trường riêng")

    /** Where a custom arena waits for its start: far enough that no phase can begin before the back office starts it. */
    static final LocalDateTime PARKED = LocalDateTime.of(2099, 1, 1, 0, 0);

    /** The custom arena people can see: the newest one that the back office has not closed. Null when none. */
    public Session customCurrent() {
        List<Session> rows = jdbc.query("SELECT " + SESSION_COLS + " FROM arena_sessions WHERE kind = 'custom' AND status <> 'cancelled' ORDER BY id DESC LIMIT 1", (rs, i) -> mapSession(rs));
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** The orange banner's data, or null when there is no custom arena. */
    public Map<String, Object> customBanner(long userId) {
        Session s = customCurrent();
        if (s == null) return null;
        Map<String, Object> out = new LinkedHashMap<>(timingMap(s));
        out.put("title", s.title());
        out.put("status", s.status());
        out.put("waiting", s.waiting());
        out.put("expectedAt", s.expectedAt() == null ? null : millis(s.expectedAt()));
        if (s.waiting()) out.put("startsAt", null);
        out.put("phase", phaseMap(s));
        out.put("inRoomCount", inRoom(s.id()));
        out.put("rules", customRules(s));
        return out;
    }

    /** True when the custom arena is gone (closed by the back office), so a screen can send people back to Vui học. */
    public Map<String, Object> customState(long sessionId) {
        Session s = session(sessionId);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("serverNow", clock.millis());
        out.put("closed", s == null || !s.custom() || "cancelled".equals(s.status()));
        return out;
    }

    /** Numbers for the "Đấu trường riêng là gì?" sheet. */
    public Map<String, Object> customRules(Session s) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("title", s.title());
        r.put("questionCount", s.timing().questionCount());
        r.put("answerSeconds", s.timing().answerSeconds());
        r.put("expectedAt", s.expectedAt() == null ? null : millis(s.expectedAt()));
        return r;
    }

    /** Creates a custom arena in the waiting state with its own set of questions. One at a time: the back office closes the old one first. */
    @Transactional
    public Session createCustom(String title, LocalDateTime expectedAt, Integer questionCount, Integer answerSeconds) {
        String name = title == null ? "" : title.trim();
        if (name.isEmpty()) throw new IllegalStateException("Nhập tên đấu trường");
        if (name.length() > 80) throw new IllegalStateException("Tên đấu trường tối đa 80 ký tự");
        if (customCurrent() != null) throw new IllegalStateException("Đang có một đấu trường riêng, hãy đóng nó trước khi tạo cái mới");
        int count = questionCount == null ? settings.num("question_count") : questionCount;
        if (count < 3 || count > 50) throw new IllegalStateException("Số câu hỏi từ 3 đến 50");
        int answer = answerSeconds == null ? settings.num("answer_seconds") : answerSeconds;
        if (answer < 5 || answer > 120) throw new IllegalStateException("Thời gian trả lời từ 5 đến 120 giây");
        int countdown = settings.num("countdown_seconds");
        int reveal = settings.num("reveal_seconds");
        int gap = Math.max(settings.num("gap_seconds"), countdown + answer + reveal + 10);
        List<ArenaQuestionPicker.Pick> picks = pickFor(now().toLocalDate(), count, null);
        if (picks.isEmpty()) throw new IllegalStateException("Kho câu hỏi đang trống");
        LocalDateTime now = now();
        jdbc.update("INSERT INTO arena_sessions (kind, title, expected_at, day, starts_at, open_at, question_count, countdown_seconds, answer_seconds, reveal_seconds, gap_seconds, status) VALUES ('custom', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'waiting')",
                name, expectedAt == null ? null : Timestamp.valueOf(expectedAt), java.sql.Date.valueOf(now.toLocalDate()), Timestamp.valueOf(PARKED), Timestamp.valueOf(now),
                picks.size(), countdown, answer, reveal, gap);
        Long id = jdbc.queryForObject("SELECT MAX(id) FROM arena_sessions WHERE kind = 'custom'", Long.class);
        savePicks(id, picks);
        return session(id);
    }

    /** Starts the countdown: the first question comes one minute from now. */
    @Transactional
    public Session startCustom(long sessionId) {
        Session s = session(sessionId);
        if (s == null || !s.custom()) throw new IllegalStateException("Không tìm thấy đấu trường riêng này");
        if (!s.waiting()) throw new IllegalStateException("Đấu trường này đã bắt đầu hoặc đã đóng");
        int have = count("SELECT COUNT(*) FROM arena_questions WHERE session_id = ?", sessionId);
        if (have == 0) throw new IllegalStateException("Đấu trường chưa có câu hỏi");
        LocalDateTime starts = now().plusSeconds(CUSTOM_START_SECONDS);
        jdbc.update("UPDATE arena_sessions SET starts_at = ?, question_count = ?, status = 'scheduled' WHERE id = ? AND status = 'waiting'", Timestamp.valueOf(starts), have, sessionId);
        return session(sessionId);
    }

    static final int CUSTOM_START_SECONDS = 60;

    /** Closes the custom arena at any moment: its banner disappears and the people inside are sent back to Vui học. */
    @Transactional
    public void closeCustom(long sessionId) {
        Session s = session(sessionId);
        if (s == null || !s.custom()) throw new IllegalStateException("Không tìm thấy đấu trường riêng này");
        jdbc.update("UPDATE arena_sessions SET status = 'cancelled', closed_at = ? WHERE id = ? AND status <> 'cancelled'", Timestamp.valueOf(now()), sessionId);
    }

    /** Numbers for the "Đấu trường Leo là gì?" sheet. */
    public Map<String, Object> rules() {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("startTime", settings.raw("start_time"));
        r.put("questionCount", settings.num("question_count"));
        r.put("answerSeconds", settings.num("answer_seconds"));
        r.put("openMinutes", settings.num("open_minutes"));
        r.put("rewardCoins", settings.rewardCoins());
        r.put("rewardSticker", settings.flag("reward_sticker"));
        r.put("rewardMinScore", settings.num("reward_min_score"));
        r.put("rewardParticipation", settings.num("reward_participation"));
        r.put("coinName", funSettings.coinName());
        return r;
    }

    @Transactional
    public Map<String, Object> register(long userId, long sessionId) {
        Session s = open(sessionId);
        if (!now().isBefore(ArenaRules.endsAt(s.timing()))) throw new IllegalStateException("Trận này đã kết thúc");
        jdbc.update("INSERT INTO arena_entries (session_id, user_id, registered_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE registered_at = COALESCE(registered_at, VALUES(registered_at))",
                sessionId, userId, Timestamp.valueOf(now()));
        events.record(userId, GameEventService.GAME_ARENA, "register", s.day().toString(), 0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("registered", true);
        out.put("registeredCount", registered(sessionId));
        return out;
    }

    @Transactional
    public Map<String, Object> unregister(long userId, long sessionId) {
        Session s = open(sessionId);
        jdbc.update("UPDATE arena_entries SET registered_at = NULL WHERE session_id = ? AND user_id = ?", sessionId, userId);
        events.record(userId, GameEventService.GAME_ARENA, "unregister", s.day().toString(), 0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("registered", false);
        out.put("registeredCount", registered(sessionId));
        return out;
    }

    private Session open(long sessionId) {
        if (!settings.enabled()) throw new IllegalStateException("Đấu trường Leo đang tạm đóng");
        Session s = session(sessionId);
        if (s == null || "cancelled".equals(s.status())) throw new IllegalStateException("Không tìm thấy trận này");
        return s;
    }

    private void markPresent(long sessionId, long userId) {
        Timestamp t = Timestamp.valueOf(now());
        jdbc.update("INSERT INTO arena_entries (session_id, user_id, entered_at, last_seen_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE entered_at = COALESCE(entered_at, VALUES(entered_at)), last_seen_at = VALUES(last_seen_at)",
                sessionId, userId, t, t);
    }

    /** The newest question whose time is up, 0 when none. */
    static int lastFinished(Timing t, LocalDateTime now) {
        int last = 0;
        for (int q = 1; q <= t.questionCount(); q++) {
            if (!now.isBefore(ArenaRules.answerEndsAt(t, q))) last = q;
        }
        return last;
    }

    /** Lobby: also the signal that the person is in the room. */
    public Map<String, Object> lobby(long userId) {
        return lobby(userId, null);
    }

    /** The lobby of the automatic arena, or of the custom one when {@code sessionId} is sent. A closed custom arena answers {@code closed: true}. */
    public Map<String, Object> lobby(long userId, Long sessionId) {
        if (!settings.enabled()) throw new IllegalStateException("Đấu trường Leo đang tạm đóng");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("serverNow", clock.millis());
        Session s;
        if (sessionId != null) {
            s = session(sessionId);
            if (s == null || !s.custom() || "cancelled".equals(s.status())) {
                out.put("closed", true);
                return out;
            }
            out.put("custom", true);
            out.put("title", s.title());
            out.put("waiting", s.waiting());
            out.put("expectedAt", s.expectedAt() == null ? null : millis(s.expectedAt()));
        } else {
            lazyEnsure();
            s = current();
            out.put("endedSessionId", endedToday());
            if (s == null) {
                out.put("sessionId", null);
                return out;
            }
        }
        LocalDateTime now = now();
        Phase phase = ArenaRules.phaseAt(s.timing(), now);
        if (!now.isBefore(s.timing().openAt())) markPresent(s.id(), userId);
        out.putAll(timingMap(s));
        if (s.waiting()) out.put("startsAt", null);
        out.put("phase", phaseMap(s));
        out.put("rules", s.custom() ? customRules(s) : rules());
        int last = lastFinished(s.timing(), now);
        boolean pre = last == 0 && (phase.kind() == Kind.BEFORE || phase.kind() == Kind.OPEN || (phase.kind() == Kind.COUNTDOWN && phase.qNo() == 1));
        out.put("started", !pre);
        out.put("lastFinished", last);
        out.put("board", pre ? preBoard(s, userId) : rankBoard(s, userId, last));
        out.put("me", me(s, userId, last));
        Map<String, Object> counts = new LinkedHashMap<>();
        counts.put("inRoom", inRoom(s.id()));
        counts.put("registered", registered(s.id()));
        out.put("counts", counts);
        List<Map<String, Object>> mine = jdbc.queryForList("SELECT registered_at FROM arena_entries WHERE session_id = ? AND user_id = ?", s.id(), userId);
        out.put("registered", !mine.isEmpty() && mine.get(0).get("registered_at") != null);
        return out;
    }

    private String nameOf(Object raw) {
        return QuizBoardRules.displayName(raw == null ? null : String.valueOf(raw));
    }

    /** Before the first question: people who registered or came in, those in the room first. */
    private List<Map<String, Object>> preBoard(Session s, long viewer) {
        Timestamp since = Timestamp.valueOf(now().minusSeconds(settings.num("presence_seconds")));
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT e.user_id AS userId, u.name AS name, (e.last_seen_at >= ?) AS inRoom, COALESCE(e.registered_at, e.entered_at) AS orderAt FROM arena_entries e " +
                        "JOIN users u ON u.id = e.user_id LEFT JOIN quiz_profiles p ON p.user_id = e.user_id " +
                        "WHERE e.session_id = ? AND (e.registered_at IS NOT NULL OR e.entered_at IS NOT NULL) AND e.disqualified = 0 " +
                        "AND (e.user_id = ? OR (COALESCE(p.hide_board, 0) = 0 AND COALESCE(p.board_blocked, 0) = 0)) " +
                        "ORDER BY inRoom DESC, orderAt ASC, e.user_id ASC LIMIT 50", since, s.id(), viewer);
        List<Map<String, Object>> out = new ArrayList<>();
        int rank = 1;
        for (Map<String, Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("rank", rank++);
            m.put("name", nameOf(r.get("name")));
            boolean in = r.get("inRoom") != null && ((Number) r.get("inRoom")).intValue() == 1;
            m.put("inRoom", in);
            m.put("status", in ? "in_room" : s.custom() ? "away" : "registered");
            m.put("me", ((Number) r.get("userId")).longValue() == viewer);
            out.add(m);
        }
        return out;
    }

    /** Scores from the answers of finished questions only, so a score never shows before the answer of its question is public. */
    private List<Map<String, Object>> rankBoard(Session s, long viewer, int lastFinished) {
        CachedBoard cached = boardCache.get(s.id() * 1000 + lastFinished);
        List<Map<String, Object>> base;
        if (cached != null && System.currentTimeMillis() - cached.at() < 2000) {
            base = cached.rows();
        } else {
            base = computeRanking(s, lastFinished, 50, false, viewer);
            boardCache.put(s.id() * 1000 + lastFinished, new CachedBoard(System.currentTimeMillis(), base));
            if (boardCache.size() > 200) boardCache.clear();
        }
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : base) {
            Map<String, Object> m = new LinkedHashMap<>(r);
            m.put("me", ((Number) r.get("userId")).longValue() == viewer);
            m.remove("userId");
            out.add(m);
        }
        return out;
    }

    /** All entries ranked by the finished questions. {@code withViewer} adds the viewer's own row even if hidden. */
    private List<Map<String, Object>> computeRanking(Session s, int lastFinished, int limit, boolean everyone, long viewer) {
        Timestamp since = Timestamp.valueOf(now().minusSeconds(settings.num("presence_seconds")));
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT e.user_id AS userId, u.name AS name, COALESCE(SUM(a.correct), 0) AS score, COALESCE(SUM(CASE WHEN a.correct = 1 THEN a.ms ELSE 0 END), 0) AS correctMs, " +
                        "COALESCE(MAX(CASE WHEN a.q_no = ? AND a.correct = 1 THEN 1 ELSE 0 END), 0) AS lastCorrect, (e.last_seen_at >= ?) AS inRoom, " +
                        "UNIX_TIMESTAMP(COALESCE(e.registered_at, e.entered_at)) * 1000 AS orderAt, " +
                        "COALESCE(p.hide_board, 0) AS hideBoard, COALESCE(p.board_blocked, 0) AS boardBlocked, e.disqualified AS disqualified " +
                        "FROM arena_entries e JOIN users u ON u.id = e.user_id LEFT JOIN quiz_profiles p ON p.user_id = e.user_id " +
                        "LEFT JOIN arena_answers a ON a.session_id = e.session_id AND a.user_id = e.user_id AND a.q_no <= ? " +
                        "WHERE e.session_id = ? AND (e.entered_at IS NOT NULL OR e.answered > 0) " +
                        "GROUP BY e.user_id, u.name, e.last_seen_at, e.registered_at, e.entered_at, p.hide_board, p.board_blocked, e.disqualified",
                lastFinished, since, lastFinished, s.id());
        List<Map<String, Object>> shown = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            long id = ((Number) r.get("userId")).longValue();
            boolean hidden = ((Number) r.get("hideBoard")).intValue() == 1 || ((Number) r.get("boardBlocked")).intValue() == 1 || ((Number) r.get("disqualified")).intValue() == 1;
            if (hidden && !everyone && id != viewer) continue;
            shown.add(r);
        }
        shown.sort(Comparator.comparing((Map<String, Object> r) -> new ArenaRules.Entry(((Number) r.get("userId")).longValue(), ((Number) r.get("score")).intValue(),
                ((Number) r.get("correctMs")).longValue(), r.get("orderAt") == null ? Long.MAX_VALUE : ((Number) r.get("orderAt")).longValue()), ArenaRules.ranking()));
        List<Map<String, Object>> out = new ArrayList<>();
        int rank = 1;
        for (Map<String, Object> r : shown) {
            if (out.size() >= limit) break;
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", r.get("userId"));
            m.put("rank", rank++);
            m.put("name", nameOf(r.get("name")));
            m.put("score", ((Number) r.get("score")).intValue());
            m.put("correctMs", ((Number) r.get("correctMs")).longValue());
            m.put("lastCorrect", ((Number) r.get("lastCorrect")).intValue() == 1);
            m.put("inRoom", r.get("inRoom") != null && ((Number) r.get("inRoom")).intValue() == 1);
            out.add(m);
        }
        return out;
    }

    /** The viewer's own line (always fresh): rank among everyone who is shown, score, time. Null when they are not in the room. */
    private Map<String, Object> me(Session s, long userId, int lastFinished) {
        Integer in = jdbc.queryForObject("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND user_id = ? AND (entered_at IS NOT NULL OR registered_at IS NOT NULL)", Integer.class, s.id(), userId);
        if (in == null || in == 0) return null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name", nameOf(jdbc.queryForObject("SELECT name FROM users WHERE id = ?", String.class, userId)));
        if (lastFinished == 0) {
            m.put("score", 0);
            m.put("correctMs", 0);
            m.put("rank", null);
            return m;
        }
        List<Map<String, Object>> all = computeRanking(s, lastFinished, Integer.MAX_VALUE, true, userId);
        for (Map<String, Object> r : all) {
            if (((Number) r.get("userId")).longValue() == userId) {
                m.put("rank", r.get("rank"));
                m.put("score", r.get("score"));
                m.put("correctMs", r.get("correctMs"));
                m.put("lastCorrect", r.get("lastCorrect"));
                return m;
            }
        }
        m.put("score", 0);
        m.put("correctMs", 0);
        m.put("rank", null);
        return m;
    }

    // ---------------------------------------------------------------- questions and answers

    private record Q(long id, String topic, int difficulty, String body, String[] options, int correct, String explanation) {}

    private Q questionOf(long sessionId, int qNo) {
        List<Q> rows = jdbc.query("SELECT q.id, q.topic, q.difficulty, q.body, q.opt_a, q.opt_b, q.opt_c, q.opt_d, q.correct, q.explanation FROM arena_questions aq " +
                        "JOIN quiz_questions q ON q.id = aq.question_id WHERE aq.session_id = ? AND aq.q_no = ?",
                (rs, i) -> new Q(rs.getLong("id"), rs.getString("topic"), rs.getInt("difficulty"), rs.getString("body"),
                        new String[]{rs.getString("opt_a"), rs.getString("opt_b"), rs.getString("opt_c"), rs.getString("opt_d")}, rs.getInt("correct"), rs.getString("explanation")),
                sessionId, qNo);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** A question for the screen. The right answer and the explanation are added only once the time of the question is up. */
    public Map<String, Object> question(long userId, long sessionId, int qNo) {
        Session s = open(sessionId);
        Timing t = s.timing();
        if (qNo < 1 || qNo > t.questionCount()) throw new IllegalStateException("Không có câu hỏi này");
        LocalDateTime now = now();
        if (now.isBefore(ArenaRules.questionAt(t, qNo).minusSeconds(1))) throw new IllegalStateException("Chưa tới giờ của câu này");
        Q q = questionOf(sessionId, qNo);
        if (q == null) throw new IllegalStateException("Không có câu hỏi này");
        markPresent(sessionId, userId);
        boolean over = !now.isBefore(ArenaRules.answerEndsAt(t, qNo));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("serverNow", clock.millis());
        out.put("qNo", qNo);
        out.put("questionCount", t.questionCount());
        out.put("topicLabel", jdbc.query("SELECT label FROM quiz_topics WHERE topic_key = ?", (rs, i) -> rs.getString(1), q.topic()).stream().findFirst().orElse(q.topic()));
        out.put("levelLabel", QuizRules.LEVEL_LABELS.getOrDefault(q.difficulty(), ""));
        out.put("body", q.body());
        out.put("options", List.of(q.options()));
        out.put("startsAt", millis(ArenaRules.questionAt(t, qNo)));
        out.put("expiresAt", millis(ArenaRules.answerEndsAt(t, qNo)));
        out.put("over", over);
        out.put("answeredCount", count("SELECT COUNT(*) FROM arena_answers WHERE session_id = ? AND q_no = ?", sessionId, qNo));
        out.put("inRoom", Math.max(inRoom(sessionId), count("SELECT COUNT(*) FROM arena_answers WHERE session_id = ? AND q_no = ?", sessionId, qNo)));
        List<Map<String, Object>> mine = jdbc.queryForList("SELECT option_idx, correct FROM arena_answers WHERE session_id = ? AND q_no = ? AND user_id = ?", sessionId, qNo, userId);
        if (!mine.isEmpty()) {
            Map<String, Object> m = new LinkedHashMap<>();
            Object opt = mine.get(0).get("option_idx");
            m.put("option", opt);
            if (over) m.put("correct", ((Number) mine.get(0).get("correct")).intValue() == 1);
            out.put("mine", m);
        }
        if (over) {
            out.put("rightOption", q.correct());
            out.put("explanation", q.explanation());
            if (mine.isEmpty()) out.put("mine", Map.of("correct", false));
        }
        return out;
    }

    /** Records an answer. The reply never says whether it was right; that comes with the question once time is up. */
    @Transactional
    public Map<String, Object> answer(long userId, long sessionId, int qNo, int option, boolean away) {
        Session s = open(sessionId);
        Timing t = s.timing();
        if (qNo < 1 || qNo > t.questionCount()) throw new IllegalStateException("Không có câu hỏi này");
        if (option < 0 || option > 3) throw new IllegalStateException("Đáp án không hợp lệ");
        LocalDateTime now = now();
        LocalDateTime at = ArenaRules.questionAt(t, qNo);
        if (now.isBefore(at.minusSeconds(1))) throw new IllegalStateException("Chưa tới giờ của câu này");
        if (ArenaRules.late(now, t, qNo)) throw new IllegalStateException("Hết giờ rồi");
        Q q = questionOf(sessionId, qNo);
        if (q == null) throw new IllegalStateException("Không có câu hỏi này");
        boolean correct = option == q.correct();
        long ms = Math.max(0, Duration.between(at, now).toMillis());
        String reason = ArenaRules.flagReason(ms, correct, away, settings.num("flag_fast_ms"), settings.flag("flag_away"));
        int rows = jdbc.update("INSERT IGNORE INTO arena_answers (session_id, q_no, user_id, option_idx, correct, ms, away, flagged, answered_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                sessionId, qNo, userId, option, correct ? 1 : 0, (int) Math.min(ms, Integer.MAX_VALUE), away ? 1 : 0, reason == null ? 0 : 1, Timestamp.valueOf(now));
        if (rows == 0) throw new IllegalStateException("Bạn đã trả lời câu này");
        Timestamp stamp = Timestamp.valueOf(now);
        jdbc.update("INSERT INTO arena_entries (session_id, user_id, entered_at, last_seen_at, score, correct_ms, answered, flagged, flag_reason) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?) " +
                        "ON DUPLICATE KEY UPDATE score = score + VALUES(score), correct_ms = correct_ms + VALUES(correct_ms), answered = answered + 1, last_seen_at = VALUES(last_seen_at), " +
                        "entered_at = COALESCE(entered_at, VALUES(entered_at)), flagged = GREATEST(flagged, VALUES(flagged)), flag_reason = COALESCE(flag_reason, VALUES(flag_reason))",
                sessionId, userId, stamp, stamp, correct ? 1 : 0, correct ? ms : 0, reason == null ? 0 : 1, reason);
        events.record(userId, GameEventService.GAME_ARENA, "answer", (correct ? "correct" : "wrong") + " q" + qNo + " " + ms + "ms", 0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("accepted", true);
        out.put("option", option);
        return out;
    }

    // ---------------------------------------------------------------- result board

    /** The board of a finished session (the newest one when no id). */
    public Map<String, Object> board(long userId, Long sessionId) {
        if (!settings.enabled()) throw new IllegalStateException("Đấu trường Leo đang tạm đóng");
        Session s;
        if (sessionId == null) {
            List<Session> rows = jdbc.query("SELECT " + SESSION_COLS + " FROM arena_sessions WHERE kind = 'auto' AND status = 'done' ORDER BY day DESC LIMIT 1", (rs, i) -> mapSession(rs));
            s = rows.isEmpty() ? null : rows.get(0);
        } else {
            s = session(sessionId);
            if (s != null && !"done".equals(s.status())) s = null;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("serverNow", clock.millis());
        List<Map<String, Object>> days = jdbc.queryForList("SELECT id, day FROM arena_sessions WHERE kind = 'auto' AND status = 'done' ORDER BY day DESC LIMIT 14");
        out.put("days", days.stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", d.get("id"));
            m.put("day", String.valueOf(d.get("day")));
            return m;
        }).toList());
        if (s == null) {
            out.put("session", null);
            return out;
        }
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", s.id());
        info.put("day", s.day().toString());
        info.put("questionCount", s.timing().questionCount());
        info.put("players", s.players());
        if (s.custom()) {
            info.put("custom", true);
            info.put("title", s.title());
        }
        out.put("session", info);
        out.put("rules", s.custom() ? customRules(s) : rules());
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT e.user_id AS userId, u.name AS name, e.final_rank AS place, e.score AS score, e.correct_ms AS correctMs, e.reward_coins AS rewardCoins FROM arena_entries e " +
                        "JOIN users u ON u.id = e.user_id LEFT JOIN quiz_profiles p ON p.user_id = e.user_id " +
                        "WHERE e.session_id = ? AND e.final_rank IS NOT NULL AND e.disqualified = 0 AND e.answered > 0 " +
                        "AND (e.user_id = ? OR (COALESCE(p.hide_board, 0) = 0 AND COALESCE(p.board_blocked, 0) = 0)) ORDER BY e.final_rank ASC LIMIT 100", s.id(), userId);
        List<Map<String, Object>> shown = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("rank", r.get("place"));
            m.put("name", nameOf(r.get("name")));
            m.put("score", r.get("score"));
            m.put("correctMs", r.get("correctMs"));
            m.put("rewardCoins", r.get("rewardCoins"));
            m.put("me", ((Number) r.get("userId")).longValue() == userId);
            shown.add(m);
        }
        out.put("rows", shown);
        List<Map<String, Object>> mine = jdbc.queryForList("SELECT final_rank AS place, score, correct_ms AS correctMs, reward_coins AS rewardCoins, answered FROM arena_entries WHERE session_id = ? AND user_id = ? AND final_rank IS NOT NULL", s.id(), userId);
        if (!mine.isEmpty() && ((Number) mine.get(0).get("answered")).intValue() > 0) {
            Map<String, Object> m = new LinkedHashMap<>(mine.get(0));
            m.remove("answered");
            // `rank` is a reserved word in MySQL 8, so the column is read as `place`
            m.put("rank", m.remove("place"));
            m.put("name", nameOf(jdbc.queryForObject("SELECT name FROM users WHERE id = ?", String.class, userId)));
            out.put("me", m);
        }
        return out;
    }
}
