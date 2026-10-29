package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.fun.FunAccessSettings;
import com.anylearn.backend.service.fun.FunSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Vui học roll-out and health (plan 14, phase 8): who may use each game, the daily earning cap and the numbers to tune rates by. */
@RestController
@RequestMapping("/admin/fun")
@RequiredArgsConstructor
public class AdminFunHealthController {

    private final JdbcTemplate jdbc;
    private final FunAccessSettings access;
    private final FunSettings funSettings;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    private long count(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    private Map<String, Object> accessView() {
        Map<String, Object> out = new LinkedHashMap<>(access.asMap());
        out.put("dailyEarnCap", funSettings.dailyEarnCap());
        return out;
    }

    @GetMapping("/access")
    public ApiResponse<?> getAccess(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        return ApiResponse.ok(accessView());
    }

    @PutMapping("/access")
    public ApiResponse<?> saveAccess(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        access.save(body);
        if (body.get("dailyEarnCap") instanceof Number n) funSettings.saveDailyEarnCap(n.longValue());
        return ApiResponse.ok(accessView());
    }

    /** Last 7 days: coins in and out, players per game, quiz answer quality and item drop rate, open risk and reports. */
    @GetMapping("/health")
    public ApiResponse<?> health(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("coinsIssued", count("SELECT COALESCE(SUM(delta), 0) FROM fun_coin_ledger WHERE delta > 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"));
        out.put("coinsSpent", count("SELECT COALESCE(-SUM(delta), 0) FROM fun_coin_ledger WHERE delta < 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"));
        out.put("coinsBySource", jdbc.queryForList("SELECT source, SUM(delta) AS coins FROM fun_coin_ledger WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY source ORDER BY ABS(SUM(delta)) DESC"));
        out.put("playersByGame", jdbc.queryForList("SELECT game, COUNT(DISTINCT user_id) AS players, COUNT(*) AS events FROM game_events WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY game ORDER BY players DESC"));
        long answers = count("SELECT COUNT(*) FROM quiz_attempts WHERE outcome IN ('correct', 'wrong', 'timeout') AND issued_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        long correct = count("SELECT COUNT(*) FROM quiz_attempts WHERE outcome = 'correct' AND issued_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        long flagged = count("SELECT COUNT(*) FROM quiz_attempts WHERE flagged = 1 AND issued_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        long drops = count("SELECT COUNT(*) FROM quiz_item_log WHERE source = 'drop' AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
        Map<String, Object> quiz = new LinkedHashMap<>();
        quiz.put("answers", answers);
        quiz.put("correctRate", answers == 0 ? 0 : Math.round(100.0 * correct / answers));
        quiz.put("flagged", flagged);
        quiz.put("flaggedRate", answers == 0 ? 0 : Math.round(1000.0 * flagged / answers) / 10.0);
        quiz.put("itemDrops", drops);
        quiz.put("dropRatePerCorrect", correct == 0 ? 0 : Math.round(1000.0 * drops / correct) / 10.0);
        out.put("quiz", quiz);
        out.put("topFlagged", jdbc.queryForList("SELECT a.user_id AS userId, u.name AS name, u.phone AS phone, COUNT(*) AS flagged FROM quiz_attempts a LEFT JOIN users u ON u.id = a.user_id " +
                "WHERE a.flagged = 1 AND a.issued_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) GROUP BY a.user_id, u.name, u.phone ORDER BY flagged DESC LIMIT 5"));
        out.put("openRisk", count("SELECT COUNT(*) FROM risk_flags WHERE status = 'open'"));
        out.put("welcomeReview", count("SELECT COUNT(*) FROM welcome_packs WHERE status = 'review'"));
        out.put("openCommentReports", count("SELECT COUNT(DISTINCT comment_id) FROM explore_comment_reports WHERE status = 'open'"));
        out.put("cappedToday", funSettings.dailyEarnCap() > 0
                ? count("SELECT COUNT(*) FROM (SELECT user_id FROM fun_coin_ledger WHERE delta > 0 AND source <> 'admin' AND created_at >= CURDATE() GROUP BY user_id HAVING SUM(delta) >= ?) t", funSettings.dailyEarnCap())
                : 0);
        out.put("games", List.of("checkin", "quiz", "sticker", "explore", "arena"));
        return ApiResponse.ok(out);
    }
}
