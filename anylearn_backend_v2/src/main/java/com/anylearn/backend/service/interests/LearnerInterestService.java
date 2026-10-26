package com.anylearn.backend.service.interests;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** The optional interest survey of a child (plan 01.5): `learner_interests (learner_id, tag, source)`. */
@Service
@RequiredArgsConstructor
public class LearnerInterestService {

    private final JdbcTemplate jdbc;
    private final UserRepository users;

    /** The answers of a child of this parent: likes, wants, budget (null when not answered). Null when the child is not theirs. */
    public Map<String, Object> get(User parent, Long childId) {
        if (!isChildOf(parent, childId)) return null;
        List<String> likes = new ArrayList<>();
        List<String> wants = new ArrayList<>();
        String[] budget = {null};
        jdbc.query("SELECT source, tag FROM learner_interests WHERE learner_id = ? ORDER BY id", rs -> {
            switch (rs.getString("source")) {
                case LearnerInterestRules.LIKES -> likes.add(rs.getString("tag"));
                case LearnerInterestRules.WANTS -> wants.add(rs.getString("tag"));
                case LearnerInterestRules.BUDGET -> budget[0] = rs.getString("tag");
                default -> { }
            }
        }, childId);
        Map<String, Object> answers = new LinkedHashMap<>();
        answers.put("likes", likes);
        answers.put("wants", wants);
        answers.put("budget", budget[0]);
        return answers;
    }

    /** Replaces all answers of the child with the cleaned ones (empty lists clear them). Returns false when the child is not theirs. */
    @Transactional
    public boolean save(User parent, Long childId, Map<String, Object> body) {
        if (!isChildOf(parent, childId)) return false;
        jdbc.update("DELETE FROM learner_interests WHERE learner_id = ?", childId);
        insert(childId, LearnerInterestRules.LIKES, LearnerInterestRules.cleanInterests(body.get("likes") instanceof List<?> list ? list : null));
        insert(childId, LearnerInterestRules.WANTS, LearnerInterestRules.cleanInterests(body.get("wants") instanceof List<?> list ? list : null));
        String budget = LearnerInterestRules.cleanBudget(body.get("budget"));
        if (budget != null) insert(childId, LearnerInterestRules.BUDGET, List.of(budget));
        return true;
    }

    /** Called when the child account is deleted. */
    public void clear(Long childId) {
        jdbc.update("DELETE FROM learner_interests WHERE learner_id = ?", childId);
    }

    private void insert(Long childId, String source, List<String> tags) {
        for (String tag : tags) {
            jdbc.update("INSERT INTO learner_interests (learner_id, tag, source) VALUES (?, ?, ?)", childId, tag, source);
        }
    }

    private boolean isChildOf(User parent, Long childId) {
        return parent != null && users.findById(childId)
                .filter(child -> child.getIsChild() != null && child.getIsChild() == 1 && parent.getId().equals(child.getUserId()))
                .isPresent();
    }
}
