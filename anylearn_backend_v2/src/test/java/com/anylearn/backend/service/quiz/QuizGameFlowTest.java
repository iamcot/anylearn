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
    @Autowired QuizBoardService board;
    @Autowired QuizSettlementService settlements;
    @Autowired QuizGameSettings gameSettings;

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
    void chosenTopicIsKeptEvenWhenItHasNoQuestionAtTheDrawnLevel() {
        long u = user();
        long before = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_questions WHERE status = 'active' AND topic = 'science'", Long.class);
        // a new player draws level 1; the chosen topic only has a level 4 question
        for (int i = 0; i < 3; i++) {
            String body = "Câu lịch sử " + i + "-" + System.nanoTime();
            jdbc.update("INSERT INTO quiz_questions (topic, difficulty, body, opt_a, opt_b, opt_c, opt_d, correct, explanation, hash, status) VALUES ('history', 1, ?, 'A', 'B', 'C', 'D', 1, 'Vì B', ?, 'active')", body, QuizRules.hash(body));
        }
        jdbc.update("DELETE FROM quiz_questions WHERE topic = 'science'");
        String body = "Câu khoa học khó " + System.nanoTime();
        jdbc.update("INSERT INTO quiz_questions (topic, difficulty, body, opt_a, opt_b, opt_c, opt_d, correct, explanation, hash, status) VALUES ('science', 4, ?, 'A', 'B', 'C', 'D', 1, 'Vì B', ?, 'active')", body, QuizRules.hash(body));
        give(u, "topic", 1);
        Map<String, Object> q = game.start(u, null, false, "science");
        assertEquals("science", q.get("topic"));
        assertTrue(before >= 0);
    }

    @Test
    void chosenTopicWithoutQuestionsIsRefusedAndTheItemIsKept() {
        long u = user();
        questions(1, 2);
        jdbc.update("DELETE FROM quiz_questions WHERE topic = 'music'");
        give(u, "topic", 1);
        assertThrows(IllegalStateException.class, () -> game.start(u, null, false, "music"));
        assertEquals(1, map(game.me(u).get("items")).get("topic"));
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
        jdbc.update("INSERT INTO quiz_profiles (user_id, rank_idx, stars, guard) VALUES (?, 0, 5, 1)", u);
        long id = ((Number) game.start(u, null, false, null).get("attemptId")).longValue();
        Map<String, Object> res = game.answer(u, id, rightPosition(id), false);
        assertEquals(true, res.get("rankedUp"));
        assertEquals("Bạc", map(res.get("profile")).get("rankName"));
        assertEquals(20L, coins.balance(u));
        assertEquals(1, map(res.get("reward")).get("shield"));
        assertNotNull(map(res.get("reward")).get("sticker"));
    }

    @Test
    void rankRewardIsPaidOnlyOncePerRank() {
        long u = user();
        questions(1, 20);
        jdbc.update("INSERT INTO quiz_profiles (user_id, rank_idx, stars, guard, best_rank_idx) VALUES (?, 0, 5, 1, 1)", u);
        long id = ((Number) game.start(u, null, false, null).get("attemptId")).longValue();
        Map<String, Object> res = game.answer(u, id, rightPosition(id), false);
        assertEquals(true, res.get("rankedUp"));
        assertEquals(0L, coins.balance(u));
        assertTrue(map(res.get("reward")).isEmpty());
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

    private long player(String name, int rank, int stars) {
        long u = user();
        jdbc.update("UPDATE users SET name = ? WHERE id = ?", name, u);
        jdbc.update("INSERT INTO quiz_profiles (user_id, rank_idx, stars, games, correct) VALUES (?, ?, ?, 5, 3)", u, rank, stars);
        return u;
    }

    @Test
    void answersFeedTheWeeklyAndMonthlyNetStars() {
        long u = user();
        questions(1, 5);
        long fast = ((Number) game.start(u, null, false, null).get("attemptId")).longValue();
        game.answer(u, fast, rightPosition(fast), false);
        // an answer that is right in under 1.5 s is flagged and does not count for the boards
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM quiz_rank_weekly WHERE user_id = ?", Integer.class, u));
        long id = ((Number) game.start(u, null, false, null).get("attemptId")).longValue();
        jdbc.update("UPDATE quiz_attempts SET issued_at = DATE_SUB(issued_at, INTERVAL 10 SECOND) WHERE id = ?", id);
        game.answer(u, id, rightPosition(id), false);
        Long net = jdbc.queryForObject("SELECT SUM(net_stars) FROM quiz_rank_weekly WHERE user_id = ?", Long.class, u);
        assertEquals(2L, net); // 1 star in the week row and 1 in the month row
        assertEquals(2, jdbc.queryForObject("SELECT COUNT(*) FROM quiz_rank_weekly WHERE user_id = ?", Integer.class, u));
    }

    @Test
    void leaderboardSortsByStarsHidesNamesAndRespectsHiding() {
        board.clearCache();
        long a = player("Nguyễn Văn An", 3, 4);
        long b = player("Trần Bình", 3, 6);
        long c = player("0911222333", 3, 1);
        Map<String, Object> out = board.leaderboard("rank", 3, c);
        List<Map<String, Object>> entries = (List<Map<String, Object>>) out.get("entries");
        java.util.List<String> names = entries.stream().map(e -> (String) e.get("name")).toList();
        assertTrue(names.indexOf("Trần Bình") < names.indexOf("Văn An"));
        assertTrue(names.contains("Người chơi"));
        assertFalse(names.stream().anyMatch(n -> n.contains("0911")));
        assertEquals(true, map(out.get("me")).get("me"));
        board.hide(a, true);
        board.clearCache();
        List<Map<String, Object>> after = (List<Map<String, Object>>) board.leaderboard("rank", 3, c).get("entries");
        assertFalse(after.stream().anyMatch(e -> "Văn An".equals(e.get("name"))));
        assertEquals(true, board.leaderboard("rank", 3, a).get("hidden"));
        board.block(b, true);
        board.clearCache();
        List<Map<String, Object>> blocked = (List<Map<String, Object>>) board.leaderboard("rank", 3, c).get("entries");
        assertFalse(blocked.stream().anyMatch(e -> "Trần Bình".equals(e.get("name"))));
    }

    @Test
    void settlementPaysTheTopThreeOnceAndOnlyForAFinishedPeriod() {
        long a = player("Người Một", 0, 0);
        long b = player("Người Hai", 0, 0);
        long c = player("Người Ba", 0, 0);
        long d = player("Người Bốn", 0, 0);
        String period = "W2020-10";
        jdbc.update("INSERT INTO quiz_rank_weekly (user_id, period, net_stars, answers) VALUES (?, ?, 9, 10), (?, ?, 7, 10), (?, ?, 5, 10), (?, ?, 1, 10)", a, period, b, period, c, period, d, period);
        Map<String, Object> out = settlements.settle(period, "manual");
        List<Map<String, Object>> winners = (List<Map<String, Object>>) out.get("winners");
        assertEquals(3, winners.size());
        assertEquals("Người Một", winners.get(0).get("name"));
        int itemsOfFirst = jdbc.queryForObject("SELECT COALESCE(SUM(qty), 0) FROM quiz_user_items WHERE user_id = ?", Integer.class, a);
        assertEquals(gameSettings.boardWeekItems().get(0).intValue(), itemsOfFirst);
        assertEquals(0, jdbc.queryForObject("SELECT COALESCE(SUM(qty), 0) FROM quiz_user_items WHERE user_id = ?", Integer.class, d));
        assertThrows(IllegalStateException.class, () -> settlements.settle(period, "manual"));
        String current = QuizBoardRules.periodKey("week", java.time.LocalDate.now());
        assertThrows(IllegalStateException.class, () -> settlements.settle(current, "manual"));
        assertThrows(IllegalArgumentException.class, () -> settlements.settle("nope", "manual"));
    }

    @Test
    void settingsFormValidatesAndSaves() {
        assertNotNull(gameSettings.save(Map.of("numbers", Map.of("seconds", 1))));
        assertNotNull(gameSettings.save(Map.of("rankStars", "1,2,3")));
        assertNotNull(gameSettings.save(Map.of("boardWeekItems", "x")));
        assertNull(gameSettings.save(Map.of("numbers", Map.of("seconds", 25), "rankStars", "5,6,7,8,10,12,16", "boardWeekItems", "4,3,2")));
        assertEquals(25, gameSettings.seconds());
        assertEquals(16, gameSettings.rankStars().get(6).intValue());
        assertEquals(List.of(4, 3, 2), gameSettings.boardWeekItems());
    }
}
