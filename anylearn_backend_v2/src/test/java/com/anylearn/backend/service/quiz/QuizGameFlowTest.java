package com.anylearn.backend.service.quiz;

import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.sticker.StickerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** The whole game against the real schema (needs the database like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class QuizGameFlowTest {

    @Autowired QuizGameService game;
    @Autowired CoinService coins;
    @Autowired StickerService stickers;
    @Autowired JdbcTemplate jdbc;

    private long user() {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role) VALUES ('Test', ?, ?, 'x', 'member')", phone, phone);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    private void questions(int difficulty, int count) {
        for (int i = 0; i < count; i++) {
            String body = "Câu hỏi thử số " + difficulty + "-" + i + "-" + System.nanoTime();
            jdbc.update("INSERT INTO quiz_questions (topic, difficulty, body, opt_a, opt_b, opt_c, opt_d, correct, explanation, hash, status) VALUES ('science', ?, ?, 'A', 'B', 'C', 'D', 1, 'Vì B', ?, 'active')",
                    difficulty, body, QuizRules.hash(body));
        }
    }

    private void give(long user, String item, int qty) {
        jdbc.update("INSERT INTO quiz_user_items (user_id, item_key, qty) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE qty = ?", user, item, qty, qty);
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> map(Object o) {
        return (Map<String, Object>) o;
    }

    /** The shown position of option B (the right answer in the test questions). */
    private int rightPosition(long attemptId) {
        int[] order = java.util.Arrays.stream(jdbc.queryForObject("SELECT option_order FROM quiz_attempts WHERE id = ?", String.class, attemptId).split(",")).mapToInt(Integer::parseInt).toArray();
        for (int i = 0; i < 4; i++) if (order[i] == 1) return i;
        throw new IllegalStateException();
    }

    @Test
    void lobbyStartsAtBronzeWithGuard() {
        long u = user();
        Map<String, Object> me = game.me(u);
        Map<String, Object> profile = map(me.get("profile"));
        assertEquals("Đồng", profile.get("rankName"));
        assertEquals(true, profile.get("guard"));
        assertEquals(true, me.get("boxReady"));
        assertEquals(8, map(me.get("profile")).get("ranks") instanceof List<?> l ? l.size() : 0);
    }

    @Test
    void boxOpensOncePerDayAndGivesBothKinds() {
        long u = user();
        Map<String, Object> box = game.openBox(u);
        assertTrue(((List<?>) box.get("given")).size() >= 2);
        assertThrows(IllegalStateException.class, () -> game.openBox(u));
        assertEquals(false, game.me(u).get("boxReady"));
    }

    @Test
    void rightAnswerGivesAStarAndNeverLeaksTheAnswer() {
        long u = user();
        questions(1, 5);
        Map<String, Object> q = game.start(u, null, false, null);
        assertEquals(4, ((List<?>) q.get("options")).size());
        assertFalse(q.containsKey("correct"));
        long id = ((Number) q.get("attemptId")).longValue();
        Map<String, Object> res = game.answer(u, id, rightPosition(id), false);
        assertEquals(true, res.get("correct"));
        assertEquals(1, map(res.get("profile")).get("stars"));
        assertEquals(rightPosition(id), res.get("correctIndex"));
        assertThrows(IllegalStateException.class, () -> game.answer(u, id, 0, false));
    }

    @Test
    void wrongAtZeroStarsOnlyCostsTheGuard() {
        long u = user();
        questions(1, 5);
        long id = ((Number) game.start(u, null, false, null).get("attemptId")).longValue();
        int wrong = (rightPosition(id) + 1) % 4;
        Map<String, Object> res = game.answer(u, id, wrong, false);
        assertEquals(false, res.get("correct"));
        assertEquals(true, res.get("guardLost"));
        assertEquals(false, map(res.get("profile")).get("guard"));
    }

    @Test
    void luckyStarsAndShieldAreTakenAtStart() {
        long u = user();
        questions(1, 5);
        assertThrows(IllegalStateException.class, () -> game.start(u, "mult2", false, null));
        give(u, "mult3", 1);
        give(u, "shield", 1);
        Map<String, Object> q = game.start(u, "mult3", true, null);
        assertEquals(0, jdbc.queryForObject("SELECT COALESCE(SUM(qty), 0) FROM quiz_user_items WHERE user_id = ?", Integer.class, u));
        long id = ((Number) q.get("attemptId")).longValue();
        Map<String, Object> res = game.answer(u, id, rightPosition(id), false);
        assertEquals(3, res.get("starsGained"));
        assertEquals(3, map(res.get("profile")).get("stars"));
    }

    @Test
    void lifelinesWorkOnceEach() {
        long u = user();
        questions(1, 6);
        for (String item : List.of("fifty", "community", "time", "swap")) give(u, item, 2);
        Map<String, Object> q = game.start(u, null, false, null);
        long id = ((Number) q.get("attemptId")).longValue();

        Map<String, Object> fifty = game.lifeline(u, id, "fifty");
        List<?> hidden = (List<?>) fifty.get("hidden");
        assertEquals(2, hidden.size());
        assertFalse(hidden.contains(rightPosition(id)));
        assertThrows(IllegalStateException.class, () -> game.lifeline(u, id, "fifty"));

        Map<String, Object> votes = game.lifeline(u, id, "community");
        List<?> shares = (List<?>) votes.get("community");
        assertEquals(100, shares.stream().mapToInt(o -> ((Number) o).intValue()).sum());

        long before = ((Number) q.get("expiresAt")).longValue();
        assertEquals(before + 15000, ((Number) game.lifeline(u, id, "time").get("expiresAt")).longValue());

        Map<String, Object> swapped = game.lifeline(u, id, "swap");
        assertNotEquals(q.get("body"), swapped.get("body"));
        assertEquals(List.of(), swapped.get("hidden"));
        // the clock is kept and the answer is graded against the new question
        Map<String, Object> res = game.answer(u, id, rightPosition(id), false);
        assertEquals(true, res.get("correct"));
    }

    @Test
    void leavingAnOpenQuestionCountsAsWrong() {
        long u = user();
        questions(1, 5);
        game.start(u, null, false, null);
        Map<String, Object> me = game.me(u);
        assertNotNull(me.get("forfeited"));
        assertEquals(1, map(me.get("profile")).get("wrong"));
        assertNull(jdbc.queryForObject("SELECT active_attempt_id FROM quiz_profiles WHERE user_id = ?", Long.class, u));
    }

    @Test
    void lateAnswerIsWrong() {
        long u = user();
        questions(1, 5);
        long id = ((Number) game.start(u, null, false, null).get("attemptId")).longValue();
        jdbc.update("UPDATE quiz_attempts SET expires_at = DATE_SUB(expires_at, INTERVAL 30 SECOND) WHERE id = ?", id);
        Map<String, Object> res = game.answer(u, id, rightPosition(id), false);
        assertEquals(false, res.get("correct"));
        assertEquals("timeout", res.get("outcome"));
    }

    @Test
    void questionsDoNotRepeatWhileThereAreFreshOnes() {
        long u = user();
        questions(1, 4);
        java.util.Set<Object> seen = new java.util.HashSet<>();
        for (int i = 0; i < 4; i++) {
            Map<String, Object> q = game.start(u, null, false, null);
            seen.add(q.get("body"));
            game.answer(u, ((Number) q.get("attemptId")).longValue(), null, false);
        }
        assertEquals(4, seen.size());
        // the bank is used up for this person: the game repeats instead of stopping
        assertNotNull(game.start(u, null, false, null));
    }

    @Test
    void emptyBankGivesAClearMessage() {
        long u = user();
        jdbc.update("UPDATE quiz_questions SET status = 'hidden'");
        assertThrows(IllegalStateException.class, () -> game.start(u, null, false, null));
    }

    @Test
    void rankUpPaysCoinsAShieldAndASticker() {
        long u = user();
        questions(1, 20);
        jdbc.update("INSERT INTO quiz_profiles (user_id, rank_idx, stars, guard) VALUES (?, 0, 4, 1)", u);
        long id = ((Number) game.start(u, null, false, null).get("attemptId")).longValue();
        Map<String, Object> res = game.answer(u, id, rightPosition(id), false);
        assertEquals(true, res.get("rankedUp"));
        assertEquals("Bạc", map(res.get("profile")).get("rankName"));
        assertEquals(20L, coins.balance(u));
        assertEquals(1, map(res.get("reward")).get("shield"));
        assertNotNull(map(res.get("reward")).get("sticker"));
    }

    @Test
    void buyingNeedsCoinsAndRespectsTheDailyCap() {
        long u = user();
        assertThrows(IllegalStateException.class, () -> game.buy(u, "fifty"));
        coins.credit(u, 1000, CoinService.SOURCE_ADMIN, "test");
        Map<String, Object> out = game.buy(u, "fifty");
        assertEquals(985L, out.get("coins"));
        assertEquals(1, map(out.get("items")).get("fifty"));
        for (int i = 0; i < 4; i++) game.buy(u, i % 2 == 0 ? "time" : "swap");
        assertThrows(IllegalStateException.class, () -> game.buy(u, "fifty"));
        assertThrows(IllegalArgumentException.class, () -> game.buy(u, "nope"));
    }

    @Test
    void stickerAlbumLoadsForANewPlayer() {
        long u = user();
        Map<String, Object> album = stickers.album(u);
        assertNotNull(album.get("items"));
    }
}
