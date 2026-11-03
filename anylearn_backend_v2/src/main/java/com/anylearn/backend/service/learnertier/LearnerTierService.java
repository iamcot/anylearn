package com.anylearn.backend.service.learnertier;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.service.settings.NumberSettings;
import com.anylearn.backend.service.today.EnrollmentContext;
import com.anylearn.backend.service.today.LearnerLoader;
import com.anylearn.backend.service.today.Session;
import com.anylearn.backend.service.today.SessionSchedule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Learner tier (plan 21): courses a learner finished, kept in `course_completions`. The system adds video courses at 100%
 * and classes that are over with enough attendance ({@link #sync}); the parent can press "Đã hoàn thành"; an admin can
 * revoke or add one. A revoked row is never re-added by the system or the parent.
 */
@Service
@Slf4j
public class LearnerTierService {

    public static final String SOURCE_VIDEO = "video";
    public static final String SOURCE_CLASS = "class";
    public static final String SOURCE_PARENT = "parent";
    public static final String SOURCE_ADMIN = "admin";

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final LearnerLoader learnerLoader;
    private final SessionSchedule sessionSchedule;
    private final NumberSettings settings;

    public LearnerTierService(JdbcTemplate jdbc, Clock clock, LearnerLoader learnerLoader, SessionSchedule sessionSchedule,
                              ConfigurationRepository configurationRepository) {
        this.jdbc = jdbc;
        this.clock = clock;
        this.learnerLoader = learnerLoader;
        this.sessionSchedule = sessionSchedule;
        this.settings = new NumberSettings("learner_tier", configurationRepository)
                .field("enabled", "Bật cấp học viên (1 = bật)", "Chung", 1, 0, 1)
                .field("attendance_percent", "Lớp học: tỉ lệ buổi đã điểm danh để tính hoàn thành (%)", "Chung", 80, 1, 100)
                .field("parent_mark", "Cho phụ huynh tự bấm \"Đã hoàn thành\" (1 = có)", "Chung", 1, 0, 1)
                .field("t1", "Chồi non: số khóa hoàn thành", "Mốc cấp", 1, 1, 1000)
                .field("t2", "Lá xanh: số khóa hoàn thành", "Mốc cấp", 3, 1, 1000)
                .field("t3", "Cây non: số khóa hoàn thành", "Mốc cấp", 6, 1, 1000)
                .field("t4", "Đại thụ: số khóa hoàn thành", "Mốc cấp", 10, 1, 1000);
    }

    public NumberSettings settings() { return settings; }

    public List<Integer> thresholds() {
        return List.of(0, settings.getInt("t1"), settings.getInt("t2"), settings.getInt("t3"), settings.getInt("t4"));
    }

    private Timestamp now() { return Timestamp.valueOf(LocalDateTime.now(clock)); }

    // ── finding finished courses ─────────────────────────────────────────

    /** Adds the courses the system can see as finished for one learner. Never throws. Returns how many were added. */
    public int sync(long learnerId) {
        if (!settings.on("enabled")) return 0;
        int added = 0;
        try {
            for (Map<String, Object> e : jdbc.queryForList(
                    "SELECT e.id, e.item_id FROM user_course_enrollments e JOIN items i ON i.id = e.item_id "
                            + "WHERE e.user_id = ? AND i.subtype = 'video' AND e.status IN ('active','pending')", learnerId)) {
                long itemId = ((Number) e.get("item_id")).longValue();
                Integer lessons = jdbc.queryForObject("SELECT COUNT(*) FROM item_video_lessons WHERE item_id = ? AND status = 1", Integer.class, itemId);
                Integer done = jdbc.queryForObject(
                        "SELECT COUNT(DISTINCT l.item_video_lesson_id) FROM item_video_lesson_user_links l JOIN item_video_lessons v ON v.id = l.item_video_lesson_id "
                                + "WHERE l.learner_id = ? AND v.item_id = ? AND v.status = 1 AND l.completed_at IS NOT NULL", Integer.class, learnerId, itemId);
                if (LearnerTierRules.videoFinished(lessons == null ? 0 : lessons, done == null ? 0 : done))
                    added += insert(learnerId, itemId, ((Number) e.get("id")).longValue(), SOURCE_VIDEO, null);
            }
            LocalDateTime now = LocalDateTime.now(clock);
            int percent = settings.getInt("attendance_percent");
            for (EnrollmentContext c : learnerLoader.load(learnerId).contexts()) {
                if (!c.hasSchedule() || c.isFee()) continue;
                List<Session> sessions = sessionSchedule.wholePeriod(c);
                int total = c.purchasedSessions() != null ? c.purchasedSessions() : sessions.size();
                List<Session> ended = sessions.stream().filter(s -> s.hasEndedBy(now)).toList();
                Set<LocalDate> dates = new HashSet<>();
                ended.forEach(s -> dates.add(s.date()));
                Set<LocalDate> attendedDates = new HashSet<>(jdbc.queryForList(
                        "SELECT DISTINCT session_date FROM session_attendances WHERE learner_id = ? AND item_schedule_id = ? AND status = 'attended'",
                        LocalDate.class, learnerId, c.schedule().getId()));
                attendedDates.retainAll(dates);
                if (LearnerTierRules.classFinished(total, ended.size(), attendedDates.size(), percent))
                    added += insert(learnerId, c.item().getId(), c.enrollment().getId(), SOURCE_CLASS, null);
            }
        } catch (Exception e) {
            log.warn("[learner-tier] sync of learner {} failed: {}", learnerId, e.getMessage());
        }
        return added;
    }

    /** Nightly: every learner with an active enrollment. */
    @Scheduled(cron = "0 40 2 * * *")
    public void nightly() {
        for (Long id : jdbc.queryForList("SELECT DISTINCT user_id FROM user_course_enrollments WHERE status IN ('active','pending')", Long.class))
            sync(id);
    }

    private int insert(long learnerId, long itemId, Long enrollmentId, String source, String note) {
        return jdbc.update("INSERT IGNORE INTO course_completions (learner_id, item_id, enrollment_id, source, status, note, completed_at, updated_at) VALUES (?, ?, ?, ?, 'done', ?, ?, ?)",
                learnerId, itemId, enrollmentId, source, note, now(), now());
    }

    /** "Đã hoàn thành" pressed by the parent (or the account itself) for one of its learners' enrollments. */
    public Map<String, Object> markByParent(User account, long enrollmentId) {
        if (!settings.on("enabled") || !settings.on("parent_mark")) throw new IllegalArgumentException("Chức năng đang tắt");
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT user_id, item_id FROM user_course_enrollments WHERE id = ?", enrollmentId);
        if (rows.isEmpty()) throw new IllegalArgumentException("Không tìm thấy khóa học");
        long learnerId = ((Number) rows.get(0).get("user_id")).longValue();
        long itemId = ((Number) rows.get(0).get("item_id")).longValue();
        learnerLoader.require(account, learnerId);
        List<String> status = jdbc.queryForList("SELECT status FROM course_completions WHERE learner_id = ? AND item_id = ?", String.class, learnerId, itemId);
        if (!status.isEmpty() && "revoked".equals(status.get(0)))
            throw new IllegalArgumentException("anyLEARN đã điều chỉnh khóa này, vui lòng liên hệ nếu cần");
        insert(learnerId, itemId, enrollmentId, SOURCE_PARENT, null);
        return summary(learnerId, null);
    }

    // ── reads ────────────────────────────────────────────────────────────

    public int finishedCount(long learnerId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM course_completions WHERE learner_id = ? AND status = 'done'", Integer.class, learnerId);
        return n == null ? 0 : n;
    }

    public Map<String, Object> summary(long learnerId, String name) {
        int finished = finishedCount(learnerId);
        List<Integer> t = thresholds();
        int idx = LearnerTierRules.tierIndex(finished, t);
        LearnerTierRules.Tier tier = LearnerTierRules.TIERS.get(idx);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("learnerId", learnerId);
        if (name != null) out.put("name", name);
        out.put("finished", finished);
        out.put("tier", tier.key());
        out.put("label", tier.label());
        out.put("icon", tier.icon());
        out.put("level", idx);
        out.put("toNext", LearnerTierRules.toNext(finished, t));
        out.put("nextLabel", idx + 1 < LearnerTierRules.TIERS.size() ? LearnerTierRules.TIERS.get(idx + 1).label() : null);
        out.put("courses", jdbc.queryForList(
                "SELECT c.id, c.item_id AS itemId, i.title, i.image, c.source, c.completed_at AS completedAt FROM course_completions c "
                        + "JOIN items i ON i.id = c.item_id WHERE c.learner_id = ? AND c.status = 'done' ORDER BY c.completed_at DESC", learnerId));
        out.put("canMark", settings.on("parent_mark") ? jdbc.queryForList(
                "SELECT e.id AS enrollmentId, e.item_id AS itemId, i.title FROM user_course_enrollments e JOIN items i ON i.id = e.item_id "
                        + "WHERE e.user_id = ? AND e.status IN ('active','pending') AND NOT EXISTS (SELECT 1 FROM course_completions c "
                        + "WHERE c.learner_id = e.user_id AND c.item_id = e.item_id) ORDER BY e.id DESC LIMIT 20", learnerId) : List.of());
        return out;
    }

    /** The account and its children, each with their tier (synced first). */
    public Map<String, Object> forAccount(User account) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.on("enabled"));
        List<Map<String, Object>> learners = new ArrayList<>();
        for (var l : learnerLoader.learnersOf(account)) {
            sync(l.id());
            learners.add(summary(l.id(), l.name()));
        }
        out.put("learners", learners);
        List<Map<String, Object>> tiers = new ArrayList<>();
        List<Integer> t = thresholds();
        for (int i = 0; i < LearnerTierRules.TIERS.size(); i++) {
            var tier = LearnerTierRules.TIERS.get(i);
            tiers.add(Map.of("key", tier.key(), "label", tier.label(), "icon", tier.icon(), "min", t.get(i)));
        }
        out.put("tiers", tiers);
        return out;
    }

    // ── admin ────────────────────────────────────────────────────────────

    public Map<String, Object> adminList(String q, String status, int page) {
        int size = 50;
        StringBuilder where = new StringBuilder("WHERE 1=1");
        List<Object> args = new ArrayList<>();
        if (status != null && !status.isBlank() && !"all".equals(status)) { where.append(" AND c.status = ?"); args.add(status); }
        if (q != null && !q.isBlank()) {
            where.append(" AND (u.name LIKE ? OR u.phone LIKE ? OR i.title LIKE ? OR p.phone LIKE ?)");
            String like = "%" + q.trim() + "%";
            args.add(like); args.add(like); args.add(like); args.add(like);
        }
        String from = " FROM course_completions c JOIN users u ON u.id = c.learner_id LEFT JOIN users p ON p.id = u.user_id JOIN items i ON i.id = c.item_id ";
        List<Object> pageArgs = new ArrayList<>(args);
        pageArgs.add(size);
        pageArgs.add(Math.max(0, page) * size);
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT c.id, c.learner_id AS learnerId, u.name AS learnerName, COALESCE(p.phone, u.phone) AS phone, c.item_id AS itemId, i.title, "
                        + "c.source, c.status, c.note, c.completed_at AS completedAt, c.updated_at AS updatedAt" + from + where + " ORDER BY c.id DESC LIMIT ? OFFSET ?",
                pageArgs.toArray());
        Long total = jdbc.queryForObject("SELECT COUNT(*)" + from + where, Long.class, args.toArray());
        return Map.of("items", rows, "total", total == null ? 0 : total, "page", page, "size", size);
    }

    public void adminSetStatus(long id, String status, String note) {
        if (!"done".equals(status) && !"revoked".equals(status)) throw new IllegalArgumentException("Trạng thái không hợp lệ");
        if ("revoked".equals(status) && (note == null || note.isBlank())) throw new IllegalArgumentException("Nhập lý do khi bỏ hoàn thành");
        int rows = jdbc.update("UPDATE course_completions SET status = ?, note = ?, updated_at = ? WHERE id = ?", status, note, now(), id);
        if (rows == 0) throw new IllegalArgumentException("Không tìm thấy");
    }

    public void adminAdd(long learnerId, long itemId, String note) {
        int rows = jdbc.update("INSERT INTO course_completions (learner_id, item_id, source, status, note, completed_at, updated_at) VALUES (?, ?, 'admin', 'done', ?, ?, ?) "
                + "ON DUPLICATE KEY UPDATE status = 'done', source = 'admin', note = VALUES(note), updated_at = VALUES(updated_at)", learnerId, itemId, note, now(), now());
        if (rows == 0) throw new IllegalArgumentException("Không lưu được");
    }
}
