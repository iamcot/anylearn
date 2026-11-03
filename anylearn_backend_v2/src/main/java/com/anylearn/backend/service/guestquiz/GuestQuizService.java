package com.anylearn.backend.service.guestquiz;

import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.settings.NumberSettings;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Guest quiz (plan 21): a few easy parenting questions from the rank quiz bank, playable without an account. The page
 * shows the result and "Đăng ký để lưu điểm + nhận quà"; registering with game `guest_quiz` pays the sign-up coins once.
 * Only easy questions of the chosen topic are served or graded here, so the rest of the bank never leaks.
 */
@Service
@Slf4j
public class GuestQuizService {

    public static final String GAME = "guest_quiz";
    public static final String TOPIC_KEY = "guest_quiz/topic";

    private final JdbcTemplate jdbc;
    private final ConfigurationRepository configurationRepository;
    private final NumberSettings settings;

    @Autowired(required = false) private CoinService coins;
    @Autowired(required = false) private FunSettings funSettings;
    @Autowired(required = false) private GameEventService events;

    public GuestQuizService(JdbcTemplate jdbc, ConfigurationRepository configurationRepository) {
        this.jdbc = jdbc;
        this.configurationRepository = configurationRepository;
        this.settings = new NumberSettings(GAME, configurationRepository)
                .field("enabled", "Bật quiz thử cho khách (1 = bật, 0 = tắt)", "Quiz thử", 1, 0, 1)
                .field("questions", "Số câu hỏi", "Quiz thử", 5, 3, 10)
                .field("max_level", "Mức khó cao nhất (1 = Rất dễ ... 5 = Rất khó)", "Quiz thử", 2, 1, 5)
                .field("signup_coins", "Leo Xu tặng khi đăng ký sau quiz", "Quiz thử", 100, 0, 100_000);
    }

    public NumberSettings settings() { return settings; }

    public String topic() {
        return configurationRepository.findByKey(TOPIC_KEY).map(c -> c.getValue()).filter(v -> v != null && !v.isBlank()).orElse("parenting");
    }

    private String coinName() { return funSettings != null ? funSettings.coinName() : "Leo Xu"; }

    /** A random set of questions, without answers. Falls back to any topic when the chosen one has too few. */
    public Map<String, Object> questions() {
        Map<String, Object> out = new LinkedHashMap<>();
        boolean on = settings.on("enabled");
        out.put("enabled", on);
        out.put("coinName", coinName());
        out.put("signupCoins", settings.getInt("signup_coins"));
        List<Map<String, Object>> list = new ArrayList<>();
        if (on) {
            int n = settings.getInt("questions");
            int level = settings.getInt("max_level");
            list.addAll(pick("SELECT id, body, opt_a, opt_b, opt_c, opt_d FROM quiz_questions WHERE status = 'active' AND difficulty <= ? AND topic = ? ORDER BY RAND() LIMIT ?", level, topic(), n));
            if (list.size() < n) {
                Set<Object> have = new HashSet<>();
                list.forEach(q -> have.add(q.get("id")));
                for (Map<String, Object> q : pick("SELECT id, body, opt_a, opt_b, opt_c, opt_d FROM quiz_questions WHERE status = 'active' AND difficulty <= ? ORDER BY RAND() LIMIT ?", level, n * 2)) {
                    if (list.size() >= n) break;
                    if (have.add(q.get("id"))) list.add(q);
                }
            }
        }
        out.put("questions", list);
        return out;
    }

    private List<Map<String, Object>> pick(String sql, Object... args) {
        return jdbc.query(sql, (rs, i) -> {
            Map<String, Object> q = new LinkedHashMap<>();
            q.put("id", rs.getLong("id"));
            q.put("body", rs.getString("body"));
            q.put("options", List.of(rs.getString("opt_a"), rs.getString("opt_b"), rs.getString("opt_c"), rs.getString("opt_d")));
            return q;
        }, args);
    }

    /** Grades one answer: `{correct, correctOption, explanation}`. Unknown or not-easy questions are refused. */
    public Map<String, Object> answer(long questionId, int option) {
        if (!settings.on("enabled")) throw new IllegalArgumentException("Quiz thử đang tạm đóng");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT correct, explanation FROM quiz_questions WHERE id = ? AND status = 'active' AND difficulty <= ?",
                questionId, settings.getInt("max_level"));
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy câu hỏi");
        int correct = ((Number) rows.get(0).get("correct")).intValue();
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("correct", option == correct);
        out.put("correctOption", correct);
        out.put("explanation", rows.get(0).get("explanation"));
        return out;
    }

    /** Called by registration with game `guest_quiz`. Pays once per account; never throws. */
    public int onSignup(long userId) {
        try {
            int amount = settings.getInt("signup_coins");
            if (!settings.on("enabled") || amount <= 0 || coins == null) return 0;
            Long already = jdbc.queryForObject("SELECT COUNT(*) FROM game_events WHERE user_id = ? AND game = ? AND type = 'signup'", Long.class, userId, GAME);
            if (already != null && already > 0) return 0;
            if (events != null) events.record(userId, GAME, "signup", null, amount);
            coins.credit(userId, amount, CoinService.SOURCE_GUEST_QUIZ, "Quà đăng ký sau quiz thử");
            return amount;
        } catch (Exception e) {
            log.warn("[guest-quiz] sign-up coins for {} failed: {}", userId, e.getMessage());
            return 0;
        }
    }

    public Map<String, Object> report() {
        Map<String, Object> out = new LinkedHashMap<>(settings.asMap());
        out.put("topic", topic());
        out.put("signups", jdbc.queryForObject("SELECT COUNT(*) FROM game_events WHERE game = ? AND type = 'signup'", Long.class, GAME));
        return out;
    }
}
