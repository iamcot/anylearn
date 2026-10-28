package com.anylearn.backend.service.quiz;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;

/** The quiz topics (table `quiz_topics`), edited in the back office page "Kho câu hỏi". */
@Service
@RequiredArgsConstructor
public class QuizTopicService {

    public record Topic(String key, String label, String hint, int sortOrder, boolean active) {}

    private final JdbcTemplate jdbc;

    public List<Topic> list(boolean activeOnly) {
        return jdbc.query("SELECT topic_key, label, hint, sort_order, active FROM quiz_topics"
                        + (activeOnly ? " WHERE active = 1" : "") + " ORDER BY sort_order, label",
                (rs, i) -> new Topic(rs.getString("topic_key"), rs.getString("label"), rs.getString("hint"),
                        rs.getInt("sort_order"), rs.getInt("active") == 1));
    }

    public Optional<Topic> find(String key) {
        return list(false).stream().filter(t -> t.key().equals(key)).findFirst();
    }

    /** Returns the problem text, or null when the topic was created. */
    public String create(String label, String hint) {
        String problem = fieldsProblem(label, hint);
        if (problem != null) return problem;
        String key = QuizRules.topicKeyFrom(label);
        if (!QuizRules.validTopicKey(key)) return "Tên chủ đề cần có chữ hoặc số";
        if (find(key).isPresent()) return "Đã có chủ đề này";
        Integer max = jdbc.queryForObject("SELECT COALESCE(MAX(sort_order), 0) FROM quiz_topics", Integer.class);
        jdbc.update("INSERT INTO quiz_topics (topic_key, label, hint, sort_order) VALUES (?, ?, ?, ?)",
                key, label.trim(), hint.trim(), (max == null ? 0 : max) + 1);
        return null;
    }

    /** Returns the problem text, or null when saved. A hidden topic keeps its questions but is not asked for more. */
    public String update(String key, String label, String hint, int sortOrder, boolean active) {
        String problem = fieldsProblem(label, hint);
        if (problem != null) return problem;
        int changed = jdbc.update("UPDATE quiz_topics SET label = ?, hint = ?, sort_order = ?, active = ? WHERE topic_key = ?",
                label.trim(), hint.trim(), sortOrder, active ? 1 : 0, key);
        return changed == 0 ? "Chủ đề không tồn tại" : null;
    }

    private static String fieldsProblem(String label, String hint) {
        if (label == null || label.trim().length() < 2 || label.trim().length() > 60) return "Tên chủ đề từ 2 đến 60 ký tự";
        if (hint == null || hint.trim().length() < 10 || hint.trim().length() > 400) return "Mô tả cho AI từ 10 đến 400 ký tự (nói chủ đề gồm những gì)";
        return null;
    }
}
