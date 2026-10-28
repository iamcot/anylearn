package com.anylearn.backend.service.video;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.service.today.LearnerLoader;
import com.anylearn.backend.service.today.Learner;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The learner side of a video course (plan 17): the outline on the course page, playing a lesson (signed Bunny link),
 * saving where the learner stopped, and the list of the account's video courses. Progress is kept per learner (the
 * account itself or one of its children); access belongs to the account (any of its learners bought the course).
 */
@Service
@RequiredArgsConstructor
public class VideoLearnService {

    private final JdbcTemplate jdbc;
    private final CourseVideoClient bunny;
    private final VideoSettings settings;
    private final LearnerLoader learnerLoader;
    private final VideoMilestoneService milestones;

    /** Enrollment statuses that open the paid lessons (lifetime access: the end date is not read). */
    static final String HAS_COURSE = "status IN ('active','pending')";

    record Lesson(long id, long chapterId, String title, String description, String type, String typeValue, String videoId,
                  String videoStatus, Integer duration, String poster, String attachments, boolean free, boolean playable) {}

    /** Visible lessons of visible chapters, in course order (chapter order, then lesson order). */
    List<Lesson> lessons(long itemId) {
        return jdbc.query("SELECT " + VideoCourseAdminService.LESSON_COLUMNS + " FROM item_video_lessons l JOIN item_video_chapters c ON c.id = l.item_video_chapter_id " +
                        "WHERE l.item_id = ? AND l.status = 1 AND c.status = 1 ORDER BY c.chapter_no, c.id, l.lesson_no, l.id",
                (rs, i) -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("type", rs.getString("type"));
                    m.put("videoId", rs.getString("videoId"));
                    m.put("videoStatus", rs.getString("videoStatus"));
                    m.put("typeValue", rs.getString("typeValue"));
                    int d = rs.getInt("durationSeconds");
                    return new Lesson(rs.getLong("id"), rs.getLong("chapterId"), rs.getString("title"), rs.getString("description"), rs.getString("type"),
                            rs.getString("typeValue"), rs.getString("videoId"), rs.getString("videoStatus"), rs.wasNull() ? null : d,
                            rs.getString("posterUrl"), rs.getString("attachments"), rs.getInt("isFree") == 1, VideoCourseAdminService.playable(m));
                }, itemId);
    }

    /** Lessons counted for progress: visible and playable. */
    static List<Long> countedIds(List<Lesson> lessons) {
        return lessons.stream().filter(Lesson::playable).map(Lesson::id).toList();
    }

    // ── Access ────────────────────────────────────────────────────────────────

    /** The account (or a child of it) has the course; admins and the course's partner always have it. */
    public boolean hasAccess(User account, long itemId) {
        if (account == null) return false;
        if ("admin".equals(account.getRole())) return true;
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM items WHERE id = ? AND user_id = ?", Integer.class, itemId, account.getId());
        if (n != null && n > 0) return true;
        return !learnersWithCourse(account, itemId).isEmpty();
    }

    /** Learners of the account (itself and children) who have the course. */
    List<Learner> learnersWithCourse(User account, long itemId) {
        List<Learner> all = learnerLoader.learnersOf(account);
        String ids = all.stream().map(l -> String.valueOf(l.id())).collect(Collectors.joining(","));
        Set<Long> have = Set.copyOf(jdbc.queryForList("SELECT DISTINCT user_id FROM user_course_enrollments WHERE item_id = ? AND " + HAS_COURSE +
                " AND user_id IN (" + ids + ")", Long.class, itemId));
        return all.stream().filter(l -> have.contains(l.id())).toList();
    }

    /**
     * The learner whose progress is read and saved: the one asked for (must belong to the account), else the first
     * learner who has the course, else the account itself.
     */
    Learner pickLearner(User account, Long learnerId, long itemId) {
        if (learnerId != null) return learnerLoader.require(account, learnerId);
        List<Learner> have = learnersWithCourse(account, itemId);
        return have.isEmpty() ? learnerLoader.learnersOf(account).get(0) : have.get(0);
    }

    // ── Outline ───────────────────────────────────────────────────────────────

    /** Chapters and lessons for the course page; with an account also access, learners and progress. No video links. */
    public Map<String, Object> outline(long itemId, User account, Long learnerId) {
        List<Map<String, Object>> chapterRows = jdbc.queryForList(
                "SELECT id, title, description FROM item_video_chapters WHERE item_id = ? AND status = 1 ORDER BY chapter_no, id", itemId);
        List<Lesson> lessons = lessons(itemId);
        boolean access = hasAccess(account, itemId);
        Learner learner = account == null ? null : pickLearner(account, learnerId, itemId);
        Map<Long, Map<String, Object>> progress = learner == null ? Map.of() : progressOf(learner.id(), itemId);

        long seconds = 0;
        int free = 0;
        List<Map<String, Object>> chapters = new ArrayList<>();
        for (Map<String, Object> ch : chapterRows) {
            long cid = ((Number) ch.get("id")).longValue();
            List<Map<String, Object>> own = new ArrayList<>();
            for (Lesson l : lessons) {
                if (l.chapterId() != cid) continue;
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", l.id());
                m.put("title", l.title());
                m.put("type", l.type());
                m.put("durationSeconds", l.duration());
                m.put("free", l.free());
                m.put("playable", l.playable());
                m.put("locked", !VideoCourseRules.canWatch(l.free(), access));
                Map<String, Object> p = progress.get(l.id());
                m.put("completed", p != null && p.get("completedAt") != null);
                m.put("positionSeconds", p == null ? 0 : p.get("positionSeconds"));
                own.add(m);
                if (l.duration() != null) seconds += l.duration();
                if (l.free() && l.playable()) free++;
            }
            if (own.isEmpty()) continue;
            Map<String, Object> c = new LinkedHashMap<>(ch);
            c.put("lessons", own);
            chapters.add(c);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("itemId", itemId);
        out.put("chapters", chapters);
        out.put("totalChapters", chapters.size());
        out.put("totalLessons", lessons.size());
        out.put("freeLessons", free);
        out.put("durationSeconds", seconds);
        out.put("durationText", VideoCourseRules.durationText(seconds));
        out.put("access", access);
        if (learner != null) {
            out.put("learnerId", learner.id());
            out.put("learnerName", learner.name());
            out.put("learners", learnersWithCourse(account, itemId).stream().map(l -> Map.of("id", l.id(), "name", l.name(), "self", l.self())).toList());
            out.putAll(courseProgress(lessons, progress));
        }
        return out;
    }

    /** {doneLessons, totalLessons, percent, resumeLessonId, resumeTitle, lastStudiedAt} of one learner. */
    Map<String, Object> courseProgress(List<Lesson> lessons, Map<Long, Map<String, Object>> progress) {
        List<Long> counted = countedIds(lessons);
        Map<Long, VideoCourseRules.LessonState> states = new HashMap<>();
        LocalDateTime last = null;
        int done = 0;
        for (Long id : counted) {
            Map<String, Object> p = progress.get(id);
            if (p == null) continue;
            boolean completed = p.get("completedAt") != null;
            if (completed) done++;
            LocalDateTime at = toTime(p.get("updatedAt"));
            states.put(id, new VideoCourseRules.LessonState(completed, at));
            if (at != null && (last == null || at.isAfter(last))) last = at;
        }
        Long resume = VideoCourseRules.resumeLesson(counted, states);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("doneLessons", done);
        out.put("countedLessons", counted.size());
        out.put("percent", VideoCourseRules.percent(done, counted.size()));
        out.put("resumeLessonId", resume);
        out.put("resumeTitle", resume == null ? null : lessons.stream().filter(l -> l.id() == resume).map(Lesson::title).findFirst().orElse(null));
        out.put("resumeNo", resume == null ? null : counted.indexOf(resume) + 1);
        out.put("started", !progress.isEmpty());
        out.put("lastStudiedAt", last == null ? null : last.toString());
        return out;
    }

    Map<Long, Map<String, Object>> progressOf(long learnerId, long itemId) {
        Map<Long, Map<String, Object>> out = new HashMap<>();
        jdbc.queryForList("SELECT item_video_lesson_id AS lessonId, position_seconds AS positionSeconds, watched_seconds AS watchedSeconds, " +
                        "completed_at AS completedAt, updated_at AS updatedAt FROM item_video_lesson_user_links WHERE learner_id = ? AND item_id = ?", learnerId, itemId)
                .forEach(row -> out.put(((Number) row.get("lessonId")).longValue(), row));
        return out;
    }

    private static LocalDateTime toTime(Object v) {
        if (v instanceof Timestamp ts) return ts.toLocalDateTime();
        if (v instanceof LocalDateTime t) return t;
        return null;
    }

    // ── Playing ───────────────────────────────────────────────────────────────

    /**
     * Everything the player needs for one lesson: a signed link (video), the link or text, where to start, the lessons
     * before and after. A paid lesson without access throws {@link LockedException}.
     */
    public Map<String, Object> play(long lessonId, User account, Long learnerId) {
        Long itemId = itemOf(lessonId);
        List<Lesson> lessons = lessons(itemId);
        Lesson l = lessons.stream().filter(x -> x.id() == lessonId).findFirst().orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
        boolean access = hasAccess(account, itemId);
        if (!VideoCourseRules.canWatch(l.free(), access)) throw new LockedException("Bài này dành cho người đã đăng ký khóa học");
        if (!l.playable()) throw new IllegalArgumentException("Video bài này đang được xử lý, bạn quay lại sau ít phút nhé");

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", l.id());
        out.put("itemId", itemId);
        out.put("title", l.title());
        out.put("description", l.description());
        out.put("type", l.type());
        out.put("free", l.free());
        out.put("durationSeconds", l.duration());
        out.put("attachments", VideoCourseAdminService.parseAttachments(l.attachments()));
        int hours = settings.playLinkHours();
        if ("video".equals(l.type())) {
            out.put("url", bunny.playUrl(l.videoId(), hours));
            out.put("posterUrl", l.poster() != null ? l.poster() : bunny.posterUrl(l.videoId(), hours));
        } else {
            out.put("url", "link".equals(l.type()) ? l.typeValue() : null);
            out.put("text", "text".equals(l.type()) ? l.typeValue() : null);
            out.put("posterUrl", l.poster());
        }
        List<Long> order = lessons.stream().map(Lesson::id).toList();
        int i = order.indexOf(lessonId);
        out.put("no", i + 1);
        out.put("prevLessonId", i > 0 ? order.get(i - 1) : null);
        Long next = VideoCourseRules.nextLesson(order, lessonId);
        out.put("nextLessonId", next);
        out.put("nextTitle", next == null ? null : lessons.get(i + 1).title());
        out.put("nextLocked", next != null && !VideoCourseRules.canWatch(lessons.get(i + 1).free(), access));
        out.put("access", access);
        if (account != null) {
            Learner learner = pickLearner(account, learnerId, itemId);
            Map<String, Object> p = progressOf(learner.id(), itemId).get(lessonId);
            int pos = p == null ? 0 : ((Number) p.get("positionSeconds")).intValue();
            out.put("learnerId", learner.id());
            out.put("positionSeconds", VideoCourseRules.resumePosition(l.duration(), pos));
            out.put("completed", p != null && p.get("completedAt") != null);
        } else {
            out.put("positionSeconds", 0);
            out.put("completed", false);
        }
        return out;
    }

    Long itemOf(long lessonId) {
        return jdbc.queryForList("SELECT item_id FROM item_video_lessons WHERE id = ? AND status = 1", Long.class, lessonId).stream().findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
    }

    // ── Progress ──────────────────────────────────────────────────────────────

    /**
     * Saves where the learner is in a lesson. `watchedDelta` = real seconds played since the last call (capped), so
     * seeking forward never marks a lesson done. `done = true` marks a link or text lesson (or any lesson) by hand.
     */
    public Map<String, Object> saveProgress(User account, Long learnerId, long lessonId, int positionSeconds, int watchedDelta, boolean done) {
        Long itemId = itemOf(lessonId);
        List<Lesson> lessons = lessons(itemId);
        Lesson l = lessons.stream().filter(x -> x.id() == lessonId).findFirst().orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài học"));
        if (!VideoCourseRules.canWatch(l.free(), hasAccess(account, itemId))) throw new LockedException("Bài này dành cho người đã đăng ký khóa học");
        Learner learner = pickLearner(account, learnerId, itemId);
        int before = percentOf(learner.id(), itemId, lessons);

        int pos = Math.max(0, l.duration() == null ? positionSeconds : Math.min(positionSeconds, l.duration()));
        int delta = VideoCourseRules.clampDelta(watchedDelta);
        jdbc.update("""
                INSERT INTO item_video_lesson_user_links (item_video_lesson_id, user_id, learner_id, item_id, checkpoint, complete, position_seconds, watched_seconds, created_at, updated_at)
                VALUES (?, ?, ?, ?, NULL, 0, ?, ?, NOW(), NOW())
                ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), position_seconds = VALUES(position_seconds),
                  watched_seconds = watched_seconds + VALUES(watched_seconds), updated_at = NOW()""",
                lessonId, account.getId(), learner.id(), itemId, pos, delta);
        Map<String, Object> row = jdbc.queryForMap("SELECT position_seconds AS p, watched_seconds AS w, completed_at AS c FROM item_video_lesson_user_links " +
                "WHERE learner_id = ? AND item_video_lesson_id = ?", learner.id(), lessonId);
        boolean completed = row.get("c") != null;
        if (!completed && (done || VideoCourseRules.isComplete(l.duration(), ((Number) row.get("p")).intValue(), ((Number) row.get("w")).intValue(),
                settings.completePercent(), settings.minWatchPercent()))) {
            jdbc.update("UPDATE item_video_lesson_user_links SET completed_at = NOW(), complete = 1 WHERE learner_id = ? AND item_video_lesson_id = ? AND completed_at IS NULL",
                    learner.id(), lessonId);
            completed = true;
        }
        int after = percentOf(learner.id(), itemId, lessons);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("completed", completed);
        out.put("percent", after);
        int milestone = VideoCourseRules.crossedMilestone(before, after, settings.suggestPercent());
        out.put("milestone", milestone);
        if (milestone > 0) milestones.reached(account, learner, itemId, milestone);
        return out;
    }

    private int percentOf(long learnerId, long itemId, List<Lesson> lessons) {
        List<Long> counted = countedIds(lessons);
        if (counted.isEmpty()) return 0;
        Set<Long> done = Set.copyOf(jdbc.queryForList("SELECT item_video_lesson_id FROM item_video_lesson_user_links WHERE learner_id = ? AND item_id = ? AND completed_at IS NOT NULL",
                Long.class, learnerId, itemId));
        return VideoCourseRules.percent((int) counted.stream().filter(done::contains).count(), counted.size());
    }

    // ── My courses ────────────────────────────────────────────────────────────

    /**
     * The account's video courses, one card per learner and course: progress, the lesson to resume, and the study plan.
     * Started courses come first (latest studied on top), then the ones not started.
     */
    public List<Map<String, Object>> myCourses(User account, Long onlyLearnerId) {
        List<Learner> learners = learnerLoader.learnersOf(account);
        Map<Long, Learner> byId = learners.stream().collect(Collectors.toMap(Learner::id, x -> x));
        String ids = learners.stream().map(x -> String.valueOf(x.id())).collect(Collectors.joining(","));
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT DISTINCT e.user_id AS learnerId, i.id AS itemId, i.title, i.image, i.seo_url AS seoUrl " +
                "FROM user_course_enrollments e JOIN items i ON i.id = e.item_id WHERE e." + HAS_COURSE + " AND i.subtype = 'video' AND e.user_id IN (" + ids + ")");
        Map<String, Map<String, Object>> plans = new HashMap<>();
        jdbc.queryForList("SELECT id, learner_id AS learnerId, item_id AS itemId, weekdays, study_time AS studyTime, lessons_per_session AS lessonsPerSession, enabled " +
                "FROM video_study_plans WHERE learner_id IN (" + ids + ")").forEach(p -> plans.put(p.get("learnerId") + ":" + p.get("itemId"), VideoStudyService.planView(p)));
        Map<Long, List<Lesson>> lessonCache = new HashMap<>();
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            long learnerId = ((Number) r.get("learnerId")).longValue();
            if (onlyLearnerId != null && onlyLearnerId != learnerId) continue;
            long itemId = ((Number) r.get("itemId")).longValue();
            List<Lesson> lessons = lessonCache.computeIfAbsent(itemId, this::lessons);
            Map<String, Object> card = new LinkedHashMap<>(r);
            Learner learner = byId.get(learnerId);
            card.put("learnerName", learner.name());
            card.put("self", learner.self());
            card.put("totalLessons", lessons.size());
            card.putAll(courseProgress(lessons, progressOf(learnerId, itemId)));
            card.put("plan", plans.get(learnerId + ":" + itemId));
            out.add(card);
        }
        out.sort((a, b) -> {
            String la = (String) a.get("lastStudiedAt"), lb = (String) b.get("lastStudiedAt");
            if (la == null && lb == null) return 0;
            if (la == null) return 1;
            if (lb == null) return -1;
            return lb.compareTo(la);
        });
        return out;
    }

    /** A paid lesson asked by someone without the course. */
    public static class LockedException extends RuntimeException {
        public LockedException(String message) {
            super(message);
        }
    }
}
