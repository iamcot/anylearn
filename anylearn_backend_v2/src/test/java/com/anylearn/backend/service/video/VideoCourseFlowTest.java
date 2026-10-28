package com.anylearn.backend.service.video;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** A video course against the real schema (needs the database like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class VideoCourseFlowTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired VideoCourseAdminService admin;
    @Autowired VideoLearnService learn;
    @Autowired VideoStudyService study;

    private long insertUser(String role, Long parentId) {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, user_id, is_child) VALUES ('Test', ?, ?, 'x', ?, ?, ?)",
                phone, phone, role, parentId, parentId == null ? 0 : 1);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    private User user(long id) {
        return users.findById(id).orElseThrow();
    }

    private long course() {
        long partner = insertUser("school", null);
        jdbc.update("INSERT INTO items (user_id, title, type, subtype, status, user_status, price) VALUES (?, 'Khóa video thử', 'class', 'video', 1, 1, 100000)", partner);
        return jdbc.queryForObject("SELECT MAX(id) FROM items", Long.class);
    }

    private void enroll(long learnerId, long itemId) {
        jdbc.update("INSERT INTO user_course_enrollments (user_id, item_id, status, remind_count) VALUES (?, ?, 'active', 0)", learnerId, itemId);
    }

    /** Chapter with a free and a paid lesson plus a second chapter lesson, all ready with a known length. */
    private long[] build(long item) {
        long ch1 = admin.saveChapter(item, null, "Chương 1", "Mở đầu", null);
        long ch2 = admin.saveChapter(item, null, "Chương 2", null, null);
        long a = admin.saveLesson(item, null, new VideoCourseAdminService.LessonDraft(ch1, "Bài mở đầu", "Giới thiệu", "link", "https://youtu.be/abcdefghijk", true, null, null, null, 600));
        long b = admin.saveLesson(item, null, new VideoCourseAdminService.LessonDraft(ch1, "Bài trả phí", null, "text", "Nội dung bài đọc", false, null, null, null, 300));
        long c = admin.saveLesson(item, null, new VideoCourseAdminService.LessonDraft(ch2, "Bài chương 2", null, "text", "Nội dung 2", false, null, null, null, 300));
        return new long[]{a, b, c};
    }

    @Test
    void editingALessonWithoutALengthDoesNotFail() {
        long item = course();
        long ch = admin.saveChapter(item, null, "Chương 1", null, null);
        // a video lesson created before any upload has no length yet; saving it again used to throw a NullPointerException
        long v = admin.saveLesson(item, null, new VideoCourseAdminService.LessonDraft(ch, "Bài video", "Mô tả", "video", null, true, null, null, null, null));
        admin.saveLesson(item, v, new VideoCourseAdminService.LessonDraft(ch, "Bài video (sửa)", "Mô tả mới", "video", null, false, null, null, null, null));
        long l = admin.saveLesson(item, null, new VideoCourseAdminService.LessonDraft(ch, "Bài link", null, "link", "https://youtu.be/abcdefghijk", true, null, null, null, null));
        admin.saveLesson(item, l, new VideoCourseAdminService.LessonDraft(ch, "Bài link (sửa)", null, "link", "https://youtu.be/abcdefghijk", true, null, null, null, null));
        assertEquals("Bài link (sửa)", jdbc.queryForObject("SELECT title FROM item_video_lessons WHERE id = ?", String.class, l));
        assertNull(jdbc.queryForObject("SELECT duration_seconds FROM item_video_lessons WHERE id = ?", Integer.class, v));
    }

    @Test
    void migrationLeavesTheTablesUsable() {
        assertEquals(0, (long) jdbc.queryForObject("SELECT COUNT(*) FROM video_study_plans", Long.class));
        assertNotNull(jdbc.queryForList("SHOW COLUMNS FROM item_video_lesson_user_links LIKE 'learner_id'"));
    }

    @Test
    void adminBuildsAndOrdersTheTree() {
        long item = course();
        long[] l = build(item);
        Map<String, Object> tree = admin.tree(item);
        Map<?, ?> summary = (Map<?, ?>) tree.get("summary");
        assertEquals(2, summary.get("chapters"));
        assertEquals(3, summary.get("lessons"));
        assertEquals(1, summary.get("freeLessons"));
        assertEquals(3, summary.get("playable"));
        assertEquals(1200L, summary.get("durationSeconds"));

        // move the third lesson up into chapter 1 and swap the chapters
        List<Long> chapterIds = jdbc.queryForList("SELECT id FROM item_video_chapters WHERE item_id = ? ORDER BY chapter_no", Long.class, item);
        admin.reorder(item, List.of(
                Map.of("id", chapterIds.get(1), "lessonIds", List.of()),
                Map.of("id", chapterIds.get(0), "lessonIds", List.of(l[2], l[0], l[1]))));
        List<Long> order = jdbc.queryForList("SELECT id FROM item_video_lessons WHERE item_id = ? ORDER BY lesson_no", Long.class, item);
        assertEquals(List.of(l[2], l[0], l[1]), order);
        assertThrows(IllegalArgumentException.class, () -> admin.deleteChapter(item, chapterIds.get(0)));
        admin.deleteChapter(item, chapterIds.get(1));
    }

    @Test
    void visitorsSeeFreeLessonsOnlyAndBuyersSeeAll() {
        long item = course();
        long[] l = build(item);
        long parent = insertUser("member", null);

        Map<String, Object> visitor = learn.outline(item, null, null);
        assertFalse((Boolean) visitor.get("access"));
        assertNotNull(learn.play(l[0], null, null).get("url"));
        assertThrows(VideoLearnService.LockedException.class, () -> learn.play(l[1], null, null));
        assertThrows(VideoLearnService.LockedException.class, () -> learn.play(l[1], user(parent), null));

        enroll(parent, item);
        assertTrue((Boolean) learn.outline(item, user(parent), null).get("access"));
        assertEquals("Nội dung bài đọc", learn.play(l[1], user(parent), null).get("text"));
    }

    @Test
    void progressIsPerChildAndResumesWhereTheyStopped() {
        long item = course();
        long[] l = build(item);
        long parent = insertUser("member", null);
        long bin = insertUser("member", parent);
        long mi = insertUser("member", parent);
        enroll(bin, item);
        User account = user(parent);

        // Bin finishes lesson 1 (a link: marked by hand), Mi has nothing
        Map<String, Object> saved = learn.saveProgress(account, bin, l[0], 0, 0, true);
        assertEquals(Boolean.TRUE, saved.get("completed"));
        assertEquals(33, saved.get("percent"));

        Map<String, Object> binView = learn.outline(item, account, bin);
        assertEquals(33, binView.get("percent"));
        assertEquals(l[1], binView.get("resumeLessonId"));
        Map<String, Object> miView = learn.outline(item, account, mi);
        assertEquals(0, miView.get("percent"));

        // the account has access through Bin; each child keeps their own progress
        List<Map<String, Object>> mine = learn.myCourses(account, null);
        assertEquals(1, mine.size());
        assertEquals(bin, ((Number) mine.get(0).get("learnerId")).longValue());

        // a stranger cannot save progress for someone else's child
        long stranger = insertUser("member", null);
        assertThrows(VideoLearnService.LockedException.class, () -> learn.saveProgress(user(stranger), bin, l[1], 5, 5, false));
        assertThrows(IllegalArgumentException.class, () -> learn.saveProgress(user(stranger), bin, l[0], 5, 5, false));
    }

    @Test
    void seekingDoesNotCompleteALessonButWatchingDoes() {
        long item = course();
        long[] l = build(item);
        long parent = insertUser("member", null);
        enroll(parent, item);
        User account = user(parent);
        // lesson 3 is a 300 s reading with a length: jump to the end without watching
        learn.saveProgress(account, parent, l[2], 300, 1, false);
        Map<String, Object> jumped = learn.saveProgress(account, parent, l[2], 300, 0, false);
        assertEquals(Boolean.FALSE, jumped.get("completed"));
        // real watching, 60 s at a time (the server caps each call)
        Map<String, Object> last = jumped;
        for (int i = 0; i < 4; i++) last = learn.saveProgress(account, parent, l[2], 300, 60, false);
        assertEquals(Boolean.TRUE, last.get("completed"));
    }

    @Test
    void crossingTheSuggestMilestoneNotifiesOnce() {
        long item = course();
        long[] l = build(item);
        long parent = insertUser("member", null);
        enroll(parent, item);
        User account = user(parent);
        learn.saveProgress(account, parent, l[0], 0, 0, true);
        learn.saveProgress(account, parent, l[1], 0, 0, true);
        Map<String, Object> done = learn.saveProgress(account, parent, l[2], 0, 0, true);
        assertEquals(100, done.get("percent"));
        assertEquals(100, done.get("milestone"));
        Integer sent = jdbc.queryForObject("SELECT COUNT(*) FROM lifecycle_messages WHERE learner_id = ? AND stage IN ('video_done','video_suggest')", Integer.class, parent);
        assertEquals(1, sent);
        // saving the same lesson again changes nothing
        assertEquals(0, learn.saveProgress(account, parent, l[2], 0, 0, true).get("milestone"));
    }

    @Test
    void studyPlanRemindsOncePerDayAndNotAfterStudying() {
        long item = course();
        build(item);
        long parent = insertUser("member", null);
        enroll(parent, item);
        User account = user(parent);
        LocalDateTime wednesday8pm = LocalDateTime.of(2026, 10, 28, 20, 5);
        study.savePlan(account, parent, item, List.of(3), "20:00", 1, true);

        assertEquals(1, study.run(wednesday8pm));
        assertEquals(0, study.run(wednesday8pm.plusMinutes(10)), "claimed once per day");
        assertEquals(0, study.run(wednesday8pm.plusDays(1)), "Thursday is not a plan day");

        // another day: already studied today = no reminder
        LocalDateTime nextWednesday = wednesday8pm.plusWeeks(1);
        jdbc.update("INSERT INTO item_video_lesson_user_links (item_video_lesson_id, user_id, learner_id, item_id, complete, position_seconds, watched_seconds, created_at, updated_at) " +
                "SELECT id, ?, ?, ?, 0, 10, 10, ?, ? FROM item_video_lessons WHERE item_id = ? LIMIT 1", parent, parent, item, nextWednesday, nextWednesday, item);
        assertEquals(0, study.run(nextWednesday));
    }
}
