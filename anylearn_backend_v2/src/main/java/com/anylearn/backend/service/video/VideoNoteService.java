package com.anylearn.backend.service.video;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.today.LearnerLoader;
import com.anylearn.backend.service.today.Learner;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/** Notes a learner writes while watching a lesson, each at a second of the video (plan 17). */
@Service
@RequiredArgsConstructor
public class VideoNoteService {

    private final JdbcTemplate jdbc;
    private final VideoLearnService learn;
    private final LearnerLoader learnerLoader;

    private Learner learnerOf(User account, Long learnerId, long itemId) {
        if (account == null) throw new VideoLearnService.LockedException("Hãy đăng nhập để dùng ghi chú");
        return learn.pickLearner(account, learnerId, itemId);
    }

    private VideoLearnService.Lesson lessonOf(User account, long lessonId) {
        long itemId = learn.itemOf(lessonId);
        VideoLearnService.Lesson lesson = learn.lessons(itemId).stream().filter(l -> l.id() == lessonId).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
        if (!VideoCourseRules.canWatch(lesson.free(), learn.hasAccess(account, itemId))) {
            throw new VideoLearnService.LockedException("Bài này dành cho người đã đăng ký khóa học");
        }
        return lesson;
    }

    /** The learner's notes on a lesson, in video order. */
    public List<Map<String, Object>> list(User account, Long learnerId, long lessonId) {
        lessonOf(account, lessonId);
        Learner learner = learnerOf(account, learnerId, learn.itemOf(lessonId));
        return jdbc.queryForList("SELECT id, position_seconds AS positionSeconds, body, created_at AS createdAt FROM video_lesson_notes " +
                "WHERE learner_id = ? AND lesson_id = ? ORDER BY position_seconds, id", learner.id(), lessonId);
    }

    public Map<String, Object> add(User account, Long learnerId, long lessonId, int positionSeconds, String body) {
        VideoLearnService.Lesson lesson = lessonOf(account, lessonId);
        long itemId = learn.itemOf(lessonId);
        Learner learner = learnerOf(account, learnerId, itemId);
        Integer existing = jdbc.queryForObject("SELECT COUNT(*) FROM video_lesson_notes WHERE learner_id = ? AND lesson_id = ?", Integer.class, learner.id(), lessonId);
        String problem = VideoCourseRules.noteProblem(body, positionSeconds, lesson.duration(), existing == null ? 0 : existing);
        if (problem != null) throw new IllegalArgumentException(problem);
        jdbc.update("INSERT INTO video_lesson_notes (learner_id, user_id, lesson_id, item_id, position_seconds, body) VALUES (?, ?, ?, ?, ?, ?)",
                learner.id(), account.getId(), lessonId, itemId, positionSeconds, body.trim());
        return Map.of("notes", list(account, learnerId, lessonId));
    }

    public void delete(User account, Long learnerId, long noteId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT learner_id AS learnerId, lesson_id AS lessonId FROM video_lesson_notes WHERE id = ?", noteId);
        if (rows.isEmpty()) return;
        long owner = ((Number) rows.get(0).get("learnerId")).longValue();
        if (learnerId != null && learnerId != owner) throw new IllegalArgumentException("Không tìm thấy ghi chú");
        learnerLoader.require(account, owner);
        jdbc.update("DELETE FROM video_lesson_notes WHERE id = ?", noteId);
    }
}
