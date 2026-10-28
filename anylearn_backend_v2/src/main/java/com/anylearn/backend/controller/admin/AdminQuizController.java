package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.quiz.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/** Back office of the rank quiz game (plan 14, phase 5): numbers, overview, flagged answers, boards and settlements. */
@RestController
@RequestMapping("/admin/quiz")
@RequiredArgsConstructor
public class AdminQuizController {

    private final JdbcTemplate jdbc;
    private final QuizGameSettings settings;
    private final QuizBoardService board;
    private final QuizSettlementService settlements;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    private long count(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    private Map<String, Object> settingsView() {
        Map<String, Object> out = settings.asMap();
        out.put("fields", settings.fields());
        out.put("items", QuizItems.ALL.stream().map(k -> Map.of("key", k, "label", QuizItems.LABELS.get(k))).toList());
        out.put("ranks", QuizRules.RANKS.stream().map(r -> r.label()).toList());
        return out;
    }

    @GetMapping("/settings")
    public ApiResponse<?> settings(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(settingsView());
    }

    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String problem = settings.save(body);
        return problem == null ? ApiResponse.ok(settingsView()) : ApiResponse.fail(problem);
    }

    /** Players, rank spread, accuracy by topic and the flagged count. */
    @GetMapping("/overview")
    public ApiResponse<?> overview(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("players", count("SELECT COUNT(*) FROM quiz_profiles WHERE games > 0"));
        out.put("playersToday", count("SELECT COUNT(DISTINCT user_id) FROM quiz_attempts WHERE issued_at >= CURDATE()"));
        out.put("answersToday", count("SELECT COUNT(*) FROM quiz_attempts WHERE issued_at >= CURDATE() AND outcome <> 'open'"));
        out.put("answers7", count("SELECT COUNT(*) FROM quiz_attempts WHERE issued_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND outcome <> 'open'"));
        out.put("flagged", count("SELECT COUNT(*) FROM quiz_attempts WHERE flagged = 1"));
        out.put("blocked", count("SELECT COUNT(*) FROM quiz_profiles WHERE board_blocked = 1"));
        Map<Integer, Long> byRank = new HashMap<>();
        jdbc.query("SELECT rank_idx, COUNT(*) AS n FROM quiz_profiles WHERE games > 0 GROUP BY rank_idx", rs -> { byRank.put(rs.getInt("rank_idx"), rs.getLong("n")); });
        List<Map<String, Object>> spread = new ArrayList<>();
        for (int i = 0; i < QuizRules.RANKS.size(); i++) {
            spread.add(Map.of("key", QuizRules.RANKS.get(i).key(), "label", QuizRules.RANKS.get(i).label(), "players", byRank.getOrDefault(i, 0L)));
        }
        out.put("rankSpread", spread);
        out.put("byTopic", jdbc.queryForList("SELECT q.topic AS topic, COALESCE(t.label, q.topic) AS label, COUNT(*) AS answers, " +
                "SUM(CASE WHEN a.outcome = 'correct' THEN 1 ELSE 0 END) AS correct FROM quiz_attempts a JOIN quiz_questions q ON q.id = a.question_id " +
                "LEFT JOIN quiz_topics t ON t.topic_key = q.topic WHERE a.outcome <> 'open' AND a.issued_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) " +
                "GROUP BY q.topic, t.label ORDER BY answers DESC"));
        return ApiResponse.ok(out);
    }

    /** Answers marked by the abnormal-signal rules (too fast and right, or the page was hidden), newest first. */
    @GetMapping("/flagged")
    public ApiResponse<?> flagged(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(jdbc.queryForList("SELECT a.id, a.user_id AS userId, u.name AS userName, u.phone AS userPhone, a.outcome, " +
                "q.body AS question, q.difficulty, a.rank_idx AS rankIdx, a.issued_at AS issuedAt, " +
                "TIMESTAMPDIFF(MICROSECOND, a.issued_at, a.answered_at) / 1000 AS answerMs, " +
                "(SELECT COUNT(*) FROM quiz_attempts f WHERE f.user_id = a.user_id AND f.flagged = 1) AS userFlagged, " +
                "COALESCE(p.board_blocked, 0) AS blocked FROM quiz_attempts a JOIN quiz_questions q ON q.id = a.question_id " +
                "LEFT JOIN users u ON u.id = a.user_id LEFT JOIN quiz_profiles p ON p.user_id = a.user_id " +
                "WHERE a.flagged = 1 ORDER BY a.id DESC LIMIT 100"));
    }

    /** The team looked at it and it is fine: the answer stops counting as flagged. */
    @PutMapping("/attempts/{id}/clear")
    public ApiResponse<?> clear(@AuthenticationPrincipal User user, @PathVariable long id) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        jdbc.update("UPDATE quiz_attempts SET flagged = 0 WHERE id = ?", id);
        return ApiResponse.ok(Map.of("id", id));
    }

    /** Body {blocked: bool}: keeps a person off the leaderboards and the prizes. */
    @PutMapping("/users/{userId}/board-block")
    public ApiResponse<?> block(@AuthenticationPrincipal User user, @PathVariable long userId, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        board.block(userId, Boolean.TRUE.equals(body.get("blocked")));
        return ApiResponse.ok(Map.of("userId", userId, "blocked", Boolean.TRUE.equals(body.get("blocked"))));
    }

    /** `type` = rank (with `rank` index), week, month or all, as a player sees it but with the real names. */
    @GetMapping("/board")
    public ApiResponse<?> board(@AuthenticationPrincipal User user, @RequestParam(defaultValue = "week") String type, @RequestParam(required = false) Integer rank) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!List.of("rank", "week", "month", "all").contains(type)) return ApiResponse.fail("Loại bảng xếp hạng không hợp lệ");
        return ApiResponse.ok(board.leaderboard(type, rank, 0));
    }

    @GetMapping("/settlements")
    public ApiResponse<?> settlements(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(settlements.overview());
    }

    /** Body {period: "W2026-44" | "M2026-10"}: pays the top 3 of a finished period now. */
    @PostMapping("/settlements")
    public ApiResponse<?> settle(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        try {
            return ApiResponse.ok(settlements.settle(String.valueOf(body.get("period")), "manual"));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ApiResponse.fail(e.getMessage());
        }
    }
}
