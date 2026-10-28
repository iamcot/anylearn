package com.anylearn.backend.controller.admin;

import com.anylearn.backend.dto.response.ApiResponse;
import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.quiz.QuizBankService;
import com.anylearn.backend.service.quiz.QuizRules;
import com.anylearn.backend.service.quiz.QuizSettings;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/** Back office of the rank quiz question bank (plan 14, phase 2). */
@RestController
@RequestMapping("/admin/quiz-bank")
@RequiredArgsConstructor
public class AdminQuizBankController {

    private final JdbcTemplate jdbc;
    private final QuizBankService bank;
    private final QuizSettings settings;

    private static boolean notAdmin(User user) {
        return user == null || !"admin".equals(user.getRole());
    }

    @GetMapping("/overview")
    public ApiResponse<?> overview(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        QuizBankService.Overview o = bank.overview(settings.targetPerCell());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("cells", o.cells());
        out.put("totals", o.totals());
        out.put("settings", settingsMap());
        out.put("runs", jdbc.queryForList("SELECT id, topic, difficulty, requested, returned, invalid, duplicates, saved, verify_failed AS verifyFailed, "
                + "input_tokens AS inputTokens, output_tokens AS outputTokens, error, created_at AS createdAt FROM quiz_gen_runs ORDER BY id DESC LIMIT 10"));
        return ApiResponse.ok(out);
    }

    private Map<String, Object> settingsMap() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("genEnabled", settings.genEnabled());
        s.put("targetPerCell", settings.targetPerCell());
        s.put("batchSize", settings.batchSize());
        s.put("nightlyBatches", settings.nightlyBatches());
        s.put("autoApprove", settings.autoApprove());
        return s;
    }

    @PutMapping("/settings")
    public ApiResponse<?> saveSettings(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        settings.save(Boolean.TRUE.equals(body.get("genEnabled")),
                body.get("targetPerCell") instanceof Number n ? n.intValue() : settings.targetPerCell(),
                body.get("batchSize") instanceof Number n ? n.intValue() : settings.batchSize(),
                body.get("nightlyBatches") instanceof Number n ? n.intValue() : settings.nightlyBatches(),
                Boolean.TRUE.equals(body.get("autoApprove")));
        return ApiResponse.ok(settingsMap());
    }

    @PostMapping("/generate")
    public ApiResponse<?> generate(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String topic = String.valueOf(body.get("topic"));
        int difficulty = body.get("difficulty") instanceof Number n ? n.intValue() : 0;
        int count = Math.min(Math.max(body.get("count") instanceof Number n ? n.intValue() : settings.batchSize(), 1), 40);
        QuizBankService.GenResult result = bank.generate(topic, difficulty, count);
        if (result.error() != null) return ApiResponse.fail(result.error());
        return ApiResponse.ok(result);
    }

    @PostMapping("/top-up")
    public ApiResponse<?> topUp(@AuthenticationPrincipal User user) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        if (!bank.isActive()) return ApiResponse.fail("AI đang tắt hoặc chưa có khóa");
        return ApiResponse.ok(Map.of("saved", bank.topUp(settings.nightlyBatches())));
    }

    @GetMapping("/questions")
    public ApiResponse<?> questions(@AuthenticationPrincipal User user,
                                    @RequestParam(required = false) String status,
                                    @RequestParam(required = false) String topic,
                                    @RequestParam(required = false) Integer difficulty,
                                    @RequestParam(required = false) String q,
                                    @RequestParam(defaultValue = "false") boolean reported,
                                    @RequestParam(defaultValue = "1") int page,
                                    @RequestParam(defaultValue = "20") int size) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        StringBuilder where = new StringBuilder(" WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (status != null && QuizRules.STATUSES.contains(status)) { where.append(" AND status = ?"); args.add(status); }
        if (topic != null && QuizRules.TOPICS.containsKey(topic)) { where.append(" AND topic = ?"); args.add(topic); }
        if (difficulty != null) { where.append(" AND difficulty = ?"); args.add(difficulty); }
        if (reported) where.append(" AND report_count > 0");
        if (q != null && !q.isBlank()) { where.append(" AND body LIKE ?"); args.add("%" + q.trim() + "%"); }
        int limit = Math.min(Math.max(size, 1), 100);
        int offset = (Math.max(page, 1) - 1) * limit;
        Long total = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_questions" + where, Long.class, args.toArray());
        List<Object> listArgs = new ArrayList<>(args);
        listArgs.add(limit);
        listArgs.add(offset);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT id, topic, difficulty, body, opt_a AS optA, opt_b AS optB, opt_c AS optC, opt_d AS optD, "
                + "correct, explanation, status, verified, review_note AS reviewNote, searchable, report_count AS reportCount, times_served AS timesServed, "
                + "times_correct AS timesCorrect, created_at AS createdAt FROM quiz_questions" + where + " ORDER BY id DESC LIMIT ? OFFSET ?", listArgs.toArray());
        return ApiResponse.ok(Map.of("items", rows, "total", total == null ? 0 : total));
    }

    @PutMapping("/questions/{id}")
    public ApiResponse<?> edit(@AuthenticationPrincipal User user, @PathVariable long id, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        List<String> options = new ArrayList<>();
        for (String key : List.of("optA", "optB", "optC", "optD")) options.add(String.valueOf(body.getOrDefault(key, "")).trim());
        QuizRules.Candidate c = new QuizRules.Candidate(String.valueOf(body.getOrDefault("body", "")).trim(), options,
                body.get("correct") instanceof Number n ? n.intValue() : -1,
                body.get("explanation") == null ? null : String.valueOf(body.get("explanation")).trim());
        String problem = QuizRules.problem(c);
        if (problem != null) return ApiResponse.fail(problem);
        String topic = String.valueOf(body.getOrDefault("topic", ""));
        int difficulty = body.get("difficulty") instanceof Number n ? n.intValue() : 0;
        if (!QuizRules.TOPICS.containsKey(topic) || !QuizRules.DIFFICULTIES.contains(difficulty)) return ApiResponse.fail("Chủ đề hoặc độ khó không hợp lệ");
        String hash = QuizRules.hash(c.body());
        Integer clash = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_questions WHERE hash = ? AND id <> ?", Integer.class, hash, id);
        if (clash != null && clash > 0) return ApiResponse.fail("Đã có câu hỏi này trong kho");
        int changed = jdbc.update("UPDATE quiz_questions SET topic = ?, difficulty = ?, body = ?, opt_a = ?, opt_b = ?, opt_c = ?, opt_d = ?, correct = ?, "
                        + "explanation = ?, hash = ?, searchable = ?, source = 'admin', verified = 0 WHERE id = ?",
                topic, difficulty, c.body(), options.get(0), options.get(1), options.get(2), options.get(3), c.correct(),
                c.explanation(), hash, Boolean.TRUE.equals(body.get("searchable")) ? 1 : 0, id);
        return changed == 0 ? ApiResponse.fail("Câu hỏi không tồn tại") : ApiResponse.ok();
    }

    /** Approve, hide or put back in the queue; an approval clears the report counter. */
    @PostMapping("/questions/status")
    public ApiResponse<?> setStatus(@AuthenticationPrincipal User user, @RequestBody Map<String, Object> body) {
        if (notAdmin(user)) return ApiResponse.fail("Forbidden");
        String status = String.valueOf(body.get("status"));
        if (!QuizRules.STATUSES.contains(status)) return ApiResponse.fail("Trạng thái không hợp lệ");
        List<Long> ids = new ArrayList<>();
        if (body.get("ids") instanceof List<?> list) for (Object o : list) if (o instanceof Number n) ids.add(n.longValue());
        if (ids.isEmpty() || ids.size() > 200) return ApiResponse.fail("Chọn từ 1 đến 200 câu");
        String marks = String.join(",", Collections.nCopies(ids.size(), "?"));
        List<Object> args = new ArrayList<>();
        args.add(status);
        args.add(status);
        args.addAll(ids);
        int changed = jdbc.update("UPDATE quiz_questions SET status = ?, review_note = NULL, report_count = IF(? = 'active', 0, report_count) WHERE id IN (" + marks + ")", args.toArray());
        if ("active".equals(status)) jdbc.update("DELETE FROM quiz_question_reports WHERE question_id IN (" + marks + ")", ids.toArray());
        return ApiResponse.ok(Map.of("changed", changed));
    }
}
