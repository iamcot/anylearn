package com.anylearn.backend.service.arena;

import com.anylearn.backend.service.quiz.QuizRules;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Đấu trường Leo against the real schema (needs the database like the other flow tests); every test rolls back.
 * The clock is a movable one so the whole evening runs in a few lines.
 */
@SpringBootTest
@Transactional
class ArenaFlowTest {

    static class MovableClock extends Clock {
        volatile Instant now = Instant.parse("2026-10-29T12:00:00Z");
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
        void at(String local) { now = LocalDateTime.parse(local).toInstant(ZoneOffset.UTC); }
    }

    @TestConfiguration
    static class Config {
        @Bean @Primary MovableClock arenaTestClock() { return new MovableClock(); }
    }

    @Autowired MovableClock clock;
    @Autowired ArenaService arena;
    @Autowired ArenaSettings settings;
    @Autowired ArenaScheduler scheduler;
    @Autowired ArenaSettlementService settlement;
    @Autowired JdbcTemplate jdbc;

    private long sessionId;

    private long user() {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Người Chơi Thử', ?, ?, 'x', 'member', NOW())", phone, phone);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object o) {
        return (Map<String, Object>) o;
    }

    @BeforeEach
    void setUp() {
        jdbc.update("UPDATE quiz_questions SET status = 'hidden'");
        for (int level = 1; level <= 5; level++) {
            for (int i = 0; i < 3; i++) {
                String body = "Câu thử Đấu trường " + level + "-" + i + "-" + System.nanoTime();
                // option index 1 (B) is always the right one
                jdbc.update("INSERT INTO quiz_questions (topic, difficulty, body, opt_a, opt_b, opt_c, opt_d, correct, explanation, hash, status) VALUES ('science', ?, ?, 'A', 'B', 'C', 'D', 1, 'Vì B', ?, 'active')",
                        level, body, QuizRules.hash(body));
            }
        }
        assertNull(settings.save(Map.of("question_count", 5, "reward_participation", 20, "reward_min_score", 1, "flag_fast_ms", 0, "reward_sticker", false)));
        clock.at("2026-10-29T19:00:00");
        arena.ensureUpcoming();
        sessionId = arena.current().id();
    }

    private void answerAll(long user, int option, int upTo) {
        for (int q = 1; q <= upTo; q++) {
            clock.at("2026-10-29T20:00:00");
            clock.now = clock.now.plusSeconds((long) (q - 1) * 60 + 5);
            arena.answer(user, sessionId, q, option, false);
        }
    }

    @Test
    void sessionIsCreatedWithEvenQuestions() {
        assertEquals(5, jdbc.queryForObject("SELECT COUNT(*) FROM arena_questions WHERE session_id = ?", Integer.class, sessionId));
        assertEquals(List.of(1, 2, 3, 4, 5), jdbc.queryForList("SELECT difficulty FROM arena_questions WHERE session_id = ? ORDER BY q_no", Integer.class, sessionId));
    }

    @Test
    void questionIsRefusedBeforeItsTimeAndHidesTheRightAnswerUntilTimeIsUp() {
        long u = user();
        clock.at("2026-10-29T19:50:00");
        assertThrows(IllegalStateException.class, () -> arena.question(u, sessionId, 1));
        clock.at("2026-10-29T20:00:00");
        Map<String, Object> q = arena.question(u, sessionId, 1);
        assertFalse(q.containsKey("rightOption"));
        assertFalse(q.containsKey("explanation"));
        arena.answer(u, sessionId, 1, 1, false);
        // answered, but still no verdict while the question is open
        Map<String, Object> again = arena.question(u, sessionId, 1);
        assertFalse(again.containsKey("rightOption"));
        assertFalse(map(again.get("mine")).containsKey("correct"));
        clock.at("2026-10-29T20:00:16");
        Map<String, Object> over = arena.question(u, sessionId, 1);
        assertEquals(1, over.get("rightOption"));
        assertEquals(true, map(over.get("mine")).get("correct"));
    }

    @Test
    void answerNeverSaysIfItWasRightAndOnlyCountsOnce() {
        long u = user();
        clock.at("2026-10-29T20:00:03");
        Map<String, Object> res = arena.answer(u, sessionId, 1, 1, false);
        assertEquals(true, res.get("accepted"));
        assertFalse(res.containsKey("correct"));
        assertThrows(IllegalStateException.class, () -> arena.answer(u, sessionId, 1, 2, false));
        clock.at("2026-10-29T20:00:30");
        assertThrows(IllegalStateException.class, () -> arena.answer(user(), sessionId, 1, 1, false));
    }

    @Test
    void scoresShowOnlyAfterTheQuestionIsOver() {
        long u = user();
        clock.at("2026-10-29T20:00:03");
        arena.answer(u, sessionId, 1, 1, false);
        clock.at("2026-10-29T20:00:10");
        assertEquals(0, map(map(arena.lobby(u)).get("me")).get("score"));
        clock.at("2026-10-29T20:00:25");
        Map<String, Object> lobby = arena.lobby(u);
        assertEquals(1, map(lobby.get("me")).get("score"));
        assertEquals(1, map(((List<?>) lobby.get("board")).get(0)).get("score"));
    }

    @Test
    void registerAndRoomBeforeTheStart() {
        long a = user();
        long b = user();
        arena.register(a, sessionId);
        clock.at("2026-10-29T19:55:00");
        Map<String, Object> lobby = arena.lobby(b);
        List<?> board = (List<?>) lobby.get("board");
        assertEquals(2, board.size());
        // the person in the room is listed first
        assertEquals("in_room", map(board.get(0)).get("status"));
        assertEquals("registered", map(board.get(1)).get("status"));
        arena.unregister(a, sessionId);
        assertEquals(0, arena.banner(a).get("registeredCount") instanceof Number n ? n.intValue() : -1);
    }

    @Test
    void bannerStaysAvailableAfterBeingInTheRoomAndAfterTheEnd() {
        long u = user();
        clock.at("2026-10-29T19:55:00");
        arena.lobby(u);
        Map<String, Object> inRoom = arena.banner(u);
        assertEquals(sessionId, ((Number) inRoom.get("sessionId")).longValue());
        assertEquals(Boolean.TRUE, inRoom.get("inRoom"));
        clock.at("2026-10-29T20:00:03");
        arena.answer(u, sessionId, 1, 1, false);
        assertEquals(sessionId, ((Number) arena.banner(u).get("sessionId")).longValue());
        clock.at("2026-10-29T20:25:00");
        Map<String, Object> over = arena.banner(u);
        assertEquals(sessionId, ((Number) over.get("endedSessionId")).longValue());
    }

    @Test
    void customArenaWaitsStartsByHandRanksOnlyItsPlayersAndClosesAnytime() {
        long a = user();
        long b = user();
        clock.at("2026-10-29T19:00:00");
        long id = arena.createCustom("Thi đấu lớp Sao", LocalDateTime.parse("2026-10-29T21:00:00"), 5, 15).id();
        // a second one is refused while the first is open
        assertThrows(IllegalStateException.class, () -> arena.createCustom("Khác", null, 5, 15));
        // the banner shows it as waiting with the expected time, and the automatic one is untouched
        Map<String, Object> custom = map(arena.banner(a).get("custom"));
        assertEquals(Boolean.TRUE, custom.get("waiting"));
        assertNull(custom.get("startsAt"));
        assertEquals("Thi đấu lớp Sao", custom.get("title"));
        assertEquals(sessionId, arena.current().id());
        // people can walk in at once; nothing is asked before the start
        Map<String, Object> lobby = arena.lobby(a, id);
        assertEquals(Boolean.TRUE, lobby.get("custom"));
        assertEquals(Boolean.TRUE, lobby.get("waiting"));
        assertEquals(2, ((List<?>) arena.lobby(b, id).get("board")).size());
        clock.at("2026-10-29T19:30:00");
        assertThrows(IllegalStateException.class, () -> arena.question(a, id, 1));
        // start: the first question is a minute away
        arena.startCustom(id);
        assertThrows(IllegalStateException.class, () -> arena.startCustom(id));
        clock.at("2026-10-29T19:30:30");
        assertThrows(IllegalStateException.class, () -> arena.question(a, id, 1));
        clock.at("2026-10-29T19:31:03");
        arena.answer(a, id, 1, 1, false);
        arena.answer(b, id, 1, 0, false);
        // the board of the custom arena only has its own players
        clock.at("2026-10-29T19:32:30");
        List<?> board = (List<?>) arena.lobby(a, id).get("board");
        assertEquals(2, board.size());
        assertEquals(1, map(board.get(0)).get("score"));
        // closing at any moment: the lobby says closed and the banner has no custom part any more
        arena.closeCustom(id);
        assertEquals(Boolean.TRUE, arena.lobby(a, id).get("closed"));
        assertNull(arena.banner(a).get("custom"));
        assertEquals(Boolean.TRUE, arena.customState(id).get("closed"));
        assertThrows(IllegalStateException.class, () -> arena.answer(a, id, 2, 1, false));
    }

    @Test
    void customArenaPaysNothingWhenItEnds() {
        long a = user();
        clock.at("2026-10-29T19:00:00");
        long id = arena.createCustom("Không thưởng", null, 3, 15).id();
        arena.startCustom(id);
        clock.at("2026-10-29T19:01:03");
        arena.answer(a, id, 1, 1, false);
        clock.at("2026-10-29T19:30:00");
        assertTrue(settlement.settle(id));
        assertEquals(1, jdbc.queryForObject("SELECT final_rank FROM arena_entries WHERE session_id = ? AND user_id = ?", Integer.class, id, a));
        assertEquals(0, jdbc.queryForObject("SELECT reward_coins FROM arena_entries WHERE session_id = ? AND user_id = ?", Integer.class, id, a));
        assertNull(jdbc.queryForObject("SELECT rewarded_at FROM arena_entries WHERE session_id = ? AND user_id = ?", java.sql.Timestamp.class, id, a));
        // the result board of the custom arena
        Map<String, Object> board = arena.board(a, id);
        assertEquals(1, map(((List<?>) board.get("rows")).get(0)).get("rank"));
        assertEquals(1, map(board.get("me")).get("rank"));
    }

    @Test
    void automaticSwitchLeavesTheCustomArenaAliveAndFeatureSwitchClosesBoth() {
        long a = user();
        clock.at("2026-10-29T19:00:00");
        long id = arena.createCustom("Riêng", null, 3, 15).id();
        assertNull(settings.save(Map.of("enabled", false)));
        assertEquals(false, arena.banner(a).get("enabled"));
        assertNotNull(arena.banner(a).get("custom"));
        assertEquals(true, arena.lobby(a, id).get("custom"));
        assertThrows(IllegalStateException.class, () -> arena.lobby(a));
        assertNull(settings.save(Map.of("feature_enabled", false)));
        assertNull(arena.banner(a).get("custom"));
        assertThrows(IllegalStateException.class, () -> arena.lobby(a, id));
    }

    @Test
    void remindersGoOnceToThoseWhoRegistered() {
        long a = user();
        long b = user();
        arena.register(a, sessionId);
        clock.at("2026-10-29T19:51:00");
        scheduler.run();
        assertNotNull(jdbc.queryForObject("SELECT reminders_sent_at FROM arena_sessions WHERE id = ?", java.sql.Timestamp.class, sessionId));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND type = 'arena_reminder'", Integer.class, a));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND type = 'arena_reminder'", Integer.class, b));
        scheduler.run();
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND type = 'arena_reminder'", Integer.class, a));
    }

    @Test
    void settlementPaysTopThreeAndParticipationOnce() {
        long[] u = {user(), user(), user(), user(), user()};
        // u0 right on all 5, u1 on 4, u2 on 3, u3 on 2 (rank 4 = participation), u4 never answers
        answerAll(u[0], 1, 5);
        answerAll(u[1], 1, 4);
        answerAll(u[2], 1, 3);
        answerAll(u[3], 1, 2);
        clock.at("2026-10-29T20:05:00");
        scheduler.run();
        assertEquals("done", jdbc.queryForObject("SELECT status FROM arena_sessions WHERE id = ?", String.class, sessionId));
        assertEquals(1, jdbc.queryForObject("SELECT final_rank FROM arena_entries WHERE session_id = ? AND user_id = ?", Integer.class, sessionId, u[0]));
        assertEquals(300, jdbc.queryForObject("SELECT reward_coins FROM arena_entries WHERE session_id = ? AND user_id = ?", Integer.class, sessionId, u[0]));
        assertEquals(100, jdbc.queryForObject("SELECT reward_coins FROM arena_entries WHERE session_id = ? AND user_id = ?", Integer.class, sessionId, u[2]));
        assertEquals(20, jdbc.queryForObject("SELECT reward_coins FROM arena_entries WHERE session_id = ? AND user_id = ?", Integer.class, sessionId, u[3]));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND user_id = ? AND rewarded_at IS NOT NULL", Integer.class, sessionId, u[4]));
        // a second run pays nothing more
        assertFalse(settlement.settle(sessionId));
        assertEquals(300, jdbc.queryForObject("SELECT balance FROM fun_wallets WHERE user_id = ?", Integer.class, u[0]));
        assertEquals(20, jdbc.queryForObject("SELECT balance FROM fun_wallets WHERE user_id = ?", Integer.class, u[3]));
        // the board shows the winners
        Map<String, Object> board = arena.board(u[0], sessionId);
        assertEquals(4, ((List<?>) board.get("rows")).size());
    }

    @Test
    void aFlaggedWinnerWaitsForTheBackOffice() {
        assertNull(settings.save(Map.of("flag_fast_ms", 5000)));
        long fast = user();
        clock.at("2026-10-29T20:00:01");
        arena.answer(fast, sessionId, 1, 1, false);
        clock.at("2026-10-29T20:05:00");
        scheduler.run();
        assertEquals(1, jdbc.queryForObject("SELECT final_rank FROM arena_entries WHERE session_id = ? AND user_id = ?", Integer.class, sessionId, fast));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND user_id = ? AND rewarded_at IS NOT NULL", Integer.class, sessionId, fast));
        Map<String, Object> cleared = settlement.clearFlag(sessionId, fast);
        assertEquals(true, cleared.get("paid"));
        assertEquals(300, jdbc.queryForObject("SELECT balance FROM fun_wallets WHERE user_id = ?", Integer.class, fast));
    }

    @Test
    void aCancelledSessionIsNotPlayedOrPaid() {
        long u = user();
        jdbc.update("UPDATE arena_sessions SET status = 'cancelled' WHERE id = ?", sessionId);
        clock.at("2026-10-29T20:00:03");
        assertThrows(IllegalStateException.class, () -> arena.answer(u, sessionId, 1, 1, false));
        clock.at("2026-10-29T20:05:00");
        scheduler.run();
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM arena_entries WHERE session_id = ? AND rewarded_at IS NOT NULL", Integer.class, sessionId));
    }

    @Test
    void settingsMustKeepAWideEnoughGap() {
        assertNotNull(settings.save(Map.of("gap_seconds", 30)));
        assertNull(settings.save(Map.of("gap_seconds", 45)));
    }
}
