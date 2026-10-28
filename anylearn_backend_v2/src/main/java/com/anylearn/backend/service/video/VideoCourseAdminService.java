package com.anylearn.backend.service.video;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Back office of a video course (plan 17): chapters (`item_video_chapters`) and their lessons (`item_video_lessons`),
 * the order of both, the "xem thử miễn phí" switch and the lesson videos on Bunny Stream ({@link CourseVideoClient}).
 */
@Service
@RequiredArgsConstructor
public class VideoCourseAdminService {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final JdbcTemplate jdbc;
    private final CourseVideoClient bunny;

    static final String LESSON_COLUMNS = "l.id, l.item_id AS itemId, l.item_video_chapter_id AS chapterId, l.lesson_no AS lessonNo, l.title, l.description, " +
            "l.type, l.type_value AS typeValue, l.video_id AS videoId, l.video_status AS videoStatus, l.duration_seconds AS durationSeconds, " +
            "l.poster_url AS posterUrl, l.attachments, l.is_free AS isFree, l.status";

    // ── Reading ───────────────────────────────────────────────────────────────

    /** Chapters in order, each with its lessons in order (hidden ones included), plus a summary. */
    public Map<String, Object> tree(long itemId) {
        refreshPending(itemId);
        List<Map<String, Object>> chapters = new ArrayList<>(jdbc.queryForList(
                "SELECT id, chapter_no AS chapterNo, title, description, status FROM item_video_chapters WHERE item_id = ? ORDER BY chapter_no, id", itemId));
        List<Map<String, Object>> lessons = lessonsOf(itemId);
        int total = 0, free = 0, playable = 0, broken = 0;
        long seconds = 0;
        for (Map<String, Object> ch : chapters) {
            List<Map<String, Object>> own = new ArrayList<>();
            for (Map<String, Object> l : lessons) {
                if (((Number) l.get("chapterId")).longValue() == ((Number) ch.get("id")).longValue()) own.add(l);
            }
            ch.put("lessons", own);
        }
        for (Map<String, Object> l : lessons) {
            total++;
            if (truthy(l.get("isFree"))) free++;
            if (truthy(l.get("playable"))) playable++;
            if ("failed".equals(l.get("videoStatus"))) broken++;
            if (l.get("durationSeconds") instanceof Number n) seconds += n.longValue();
        }
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("chapters", chapters.size());
        summary.put("lessons", total);
        summary.put("freeLessons", free);
        summary.put("playable", playable);
        summary.put("failed", broken);
        summary.put("durationSeconds", seconds);
        summary.put("durationText", VideoCourseRules.durationText(seconds));
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("uploadEnabled", bunny.isEnabled());
        out.put("signed", bunny.isSigned());
        out.put("chapters", chapters);
        out.put("summary", summary);
        return out;
    }

    private List<Map<String, Object>> lessonsOf(long itemId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + LESSON_COLUMNS + " FROM item_video_lessons l WHERE l.item_id = ? ORDER BY l.lesson_no, l.id", itemId);
        for (Map<String, Object> row : rows) {
            row.put("attachments", parseAttachments((String) row.get("attachments")));
            row.put("playable", playable(row));
            row.put("thumbUrl", row.get("posterUrl") != null ? row.get("posterUrl")
                    : row.get("videoId") != null && "ready".equals(row.get("videoStatus")) ? bunny.posterUrl((String) row.get("videoId"), 2) : null);
        }
        return rows;
    }

    /** A lesson can be opened by a learner: a ready Bunny video, a link, or a text. */
    static boolean playable(Map<String, Object> l) {
        String type = (String) l.get("type");
        if ("video".equals(type)) return l.get("videoId") != null && "ready".equals(l.get("videoStatus"));
        if ("link".equals(type) || "text".equals(type)) return l.get("typeValue") != null && !String.valueOf(l.get("typeValue")).isBlank();
        return false;
    }

    static boolean truthy(Object v) {
        return v instanceof Boolean b ? b : v instanceof Number n && n.intValue() != 0;
    }

    static List<Map<String, Object>> parseAttachments(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return JSON.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    /** Asks Bunny about lessons still uploading or processing (at most 10 per call, so the page stays fast). */
    private void refreshPending(long itemId) {
        if (!bunny.isEnabled()) return;
        jdbc.queryForList("SELECT id FROM item_video_lessons WHERE item_id = ? AND video_id IS NOT NULL AND (video_status IS NULL OR video_status IN ('processing','uploading')) LIMIT 10", Long.class, itemId)
                .forEach(this::refresh);
    }

    /** Reads the state and length of the lesson's video from Bunny. */
    public Map<String, Object> refresh(long lessonId) {
        String videoId = jdbc.queryForList("SELECT video_id FROM item_video_lessons WHERE id = ?", String.class, lessonId).stream().findFirst().orElse(null);
        if (videoId == null) throw new IllegalArgumentException("Bài này chưa có video");
        Map<String, Object> info = bunny.info(videoId);
        if (info == null) return Map.of();
        String status = (String) info.get("status");
        Object duration = info.get("durationSeconds");
        jdbc.update("UPDATE item_video_lessons SET video_status = ?, duration_seconds = COALESCE(?, duration_seconds), updated_at = NOW() WHERE id = ?", status, duration, lessonId);
        return info;
    }

    // ── Chapters ──────────────────────────────────────────────────────────────

    public long saveChapter(long itemId, Long chapterId, String title, String description, Boolean visible) {
        String t = clean(title, 191);
        if (t == null) throw new IllegalArgumentException("Nhập tên chương");
        String d = description == null || description.isBlank() ? null : description.trim();
        if (chapterId == null) {
            Integer next = jdbc.queryForObject("SELECT COALESCE(MAX(chapter_no), 0) + 1 FROM item_video_chapters WHERE item_id = ?", Integer.class, itemId);
            return insert("INSERT INTO item_video_chapters (item_id, chapter_no, title, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
                    itemId, next, t, d, Boolean.FALSE.equals(visible) ? 0 : 1);
        }
        requireChapter(itemId, chapterId);
        jdbc.update("UPDATE item_video_chapters SET title = ?, description = ?, status = COALESCE(?, status), updated_at = NOW() WHERE id = ?",
                t, d, visible == null ? null : (visible ? 1 : 0), chapterId);
        return chapterId;
    }

    public void deleteChapter(long itemId, long chapterId) {
        requireChapter(itemId, chapterId);
        Integer lessons = jdbc.queryForObject("SELECT COUNT(*) FROM item_video_lessons WHERE item_video_chapter_id = ?", Integer.class, chapterId);
        if (lessons != null && lessons > 0) throw new IllegalArgumentException("Chương còn " + lessons + " bài, hãy xóa hoặc chuyển bài sang chương khác trước");
        jdbc.update("DELETE FROM item_video_chapters WHERE id = ?", chapterId);
    }

    private void requireChapter(long itemId, long chapterId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM item_video_chapters WHERE id = ? AND item_id = ?", Integer.class, chapterId, itemId);
        if (n == null || n == 0) throw new IllegalArgumentException("Không tìm thấy chương");
    }

    // ── Lessons ───────────────────────────────────────────────────────────────

    public record LessonDraft(Long chapterId, String title, String description, String type, String typeValue, Boolean free,
                              Boolean visible, String posterUrl, List<Map<String, Object>> attachments, Integer durationSeconds) {}

    public long saveLesson(long itemId, Long lessonId, LessonDraft d) {
        String title = clean(d.title(), 191);
        if (title == null) throw new IllegalArgumentException("Nhập tên bài học");
        String type = d.type() == null || d.type().isBlank() ? "video" : d.type().trim();
        if (!VideoCourseRules.TYPES.contains(type)) throw new IllegalArgumentException("Loại bài không hợp lệ");
        if (d.chapterId() == null) throw new IllegalArgumentException("Chọn chương");
        requireChapter(itemId, d.chapterId());
        String value = d.typeValue() == null || d.typeValue().isBlank() ? null : d.typeValue().trim();
        if ("video".equals(type)) value = null;
        String attachments = attachmentsJson(d.attachments());
        String poster = d.posterUrl() == null || d.posterUrl().isBlank() ? null : d.posterUrl().trim();
        Integer duration = d.durationSeconds() != null && d.durationSeconds() > 0 ? d.durationSeconds() : null;
        String description = d.description() == null || d.description().isBlank() ? null : d.description().trim();
        if (lessonId == null) {
            Integer next = jdbc.queryForObject("SELECT COALESCE(MAX(lesson_no), 0) + 1 FROM item_video_lessons WHERE item_id = ?", Integer.class, itemId);
            return insert("INSERT INTO item_video_lessons (item_id, item_video_chapter_id, lesson_no, title, description, status, is_free, type, type_value, " +
                            "poster_url, attachments, duration_seconds, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())",
                    itemId, d.chapterId(), next, title, description, Boolean.FALSE.equals(d.visible()) ? 0 : 1, Boolean.TRUE.equals(d.free()) ? 1 : 0,
                    type, value, poster, attachments, duration);
        }
        Map<String, Object> before = requireLesson(itemId, lessonId);
        // a video lesson keeps the length Bunny reported; the admin types it only for links and texts
        Integer keepDuration = duration;
        if ("video".equals(type) && before.get("durationSeconds") instanceof Number n) keepDuration = n.intValue();
        jdbc.update("UPDATE item_video_lessons SET item_video_chapter_id = ?, title = ?, description = ?, status = COALESCE(?, status), is_free = COALESCE(?, is_free), " +
                        "type = ?, type_value = ?, poster_url = ?, attachments = ?, duration_seconds = ?, updated_at = NOW() WHERE id = ?",
                d.chapterId(), title, description, d.visible() == null ? null : (d.visible() ? 1 : 0), d.free() == null ? null : (d.free() ? 1 : 0),
                type, value, poster, attachments, keepDuration, lessonId);
        if (!"video".equals(type) && before.get("videoId") != null) {
            bunny.delete((String) before.get("videoId"));
            jdbc.update("UPDATE item_video_lessons SET video_id = NULL, video_status = NULL WHERE id = ?", lessonId);
        }
        return lessonId;
    }

    /** Switches "xem thử miễn phí" (or visibility) of one lesson without the whole form. */
    public void setFlags(long itemId, long lessonId, Boolean free, Boolean visible) {
        requireLesson(itemId, lessonId);
        jdbc.update("UPDATE item_video_lessons SET is_free = COALESCE(?, is_free), status = COALESCE(?, status), updated_at = NOW() WHERE id = ?",
                free == null ? null : (free ? 1 : 0), visible == null ? null : (visible ? 1 : 0), lessonId);
    }

    @Transactional
    public void deleteLesson(long itemId, long lessonId) {
        Map<String, Object> l = requireLesson(itemId, lessonId);
        jdbc.update("DELETE FROM item_video_lesson_user_links WHERE item_video_lesson_id = ?", lessonId);
        jdbc.update("DELETE FROM item_video_lessons WHERE id = ?", lessonId);
        bunny.delete((String) l.get("videoId"));
    }

    public void requireLessonOf(long itemId, long lessonId) {
        requireLesson(itemId, lessonId);
    }

    Map<String, Object> requireLesson(long itemId, long lessonId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + LESSON_COLUMNS + " FROM item_video_lessons l WHERE l.id = ? AND l.item_id = ?", lessonId, itemId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy bài học");
        return rows.get(0);
    }

    /**
     * Saves the whole order: chapters as listed, and each chapter's lessons as listed (a lesson listed under another
     * chapter moves there). Lesson numbers run through the course (1, 2, 3 …) so "Bài 5" means the same everywhere.
     */
    @Transactional
    public void reorder(long itemId, List<Map<String, Object>> chapters) {
        int chapterNo = 1, lessonNo = 1;
        for (Map<String, Object> ch : chapters) {
            if (!(ch.get("id") instanceof Number cid)) continue;
            requireChapter(itemId, cid.longValue());
            jdbc.update("UPDATE item_video_chapters SET chapter_no = ? WHERE id = ?", chapterNo++, cid.longValue());
            if (ch.get("lessonIds") instanceof List<?> ids) {
                for (Object id : ids) {
                    if (!(id instanceof Number lid)) continue;
                    jdbc.update("UPDATE item_video_lessons SET item_video_chapter_id = ?, lesson_no = ? WHERE id = ? AND item_id = ?",
                            cid.longValue(), lessonNo++, lid.longValue(), itemId);
                }
            }
        }
    }

    // ── Video upload ──────────────────────────────────────────────────────────

    /**
     * Creates a Bunny video for the lesson and returns the TUS upload info. The lesson points at the new video at once
     * (status uploading); a video it had before is deleted from Bunny.
     */
    public Map<String, Object> startUpload(long itemId, long lessonId) {
        Map<String, Object> l = requireLesson(itemId, lessonId);
        String itemTitle = jdbc.queryForList("SELECT title FROM items WHERE id = ?", String.class, itemId).stream().findFirst().orElse("");
        Map<String, Object> info = bunny.createUpload(itemTitle + " - " + l.get("title"));
        jdbc.update("UPDATE item_video_lessons SET type = 'video', type_value = NULL, video_id = ?, video_status = 'uploading', duration_seconds = NULL, updated_at = NOW() WHERE id = ?",
                info.get("videoId"), lessonId);
        if (l.get("videoId") != null) bunny.delete((String) l.get("videoId"));
        return info;
    }

    /** The browser finished sending the file: Bunny now transcodes it. */
    public void uploaded(long itemId, long lessonId) {
        requireLesson(itemId, lessonId);
        jdbc.update("UPDATE item_video_lessons SET video_status = 'processing', updated_at = NOW() WHERE id = ? AND video_status = 'uploading'", lessonId);
        refresh(lessonId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private long insert(String sql, Object... args) {
        GeneratedKeyHolder keys = new GeneratedKeyHolder();
        jdbc.update(con -> {
            var ps = con.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) ps.setObject(i + 1, args[i]);
            return ps;
        }, keys);
        return keys.getKey().longValue();
    }

    private static String clean(String s, int max) {
        if (s == null || s.isBlank()) return null;
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private static String attachmentsJson(List<Map<String, Object>> list) {
        if (list == null) return null;
        List<Map<String, Object>> clean = new ArrayList<>();
        for (Map<String, Object> a : list) {
            String url = a.get("url") instanceof String u ? u.trim() : "";
            if (url.isEmpty()) continue;
            String name = a.get("name") instanceof String n && !n.isBlank() ? n.trim() : url;
            clean.add(Map.of("name", name, "url", url));
        }
        if (clean.isEmpty()) return null;
        try {
            return JSON.writeValueAsString(clean);
        } catch (Exception e) {
            return null;
        }
    }
}
