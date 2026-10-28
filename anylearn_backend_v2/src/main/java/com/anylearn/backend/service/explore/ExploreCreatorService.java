package com.anylearn.backend.service.explore;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Creators of Khám phá (plan 16): the list kept in the back office, what a creator does with their own posts from /fun,
 * the admin review, and the notifications both ways (creator → back office recipients, admin → creator).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExploreCreatorService {

    static final String TYPE_TO_ADMIN = "explore_submitted";
    static final String TYPE_TO_CREATOR = "explore_review";
    static final String ADMIN_ROUTE = "/admin/explore";
    static final String CREATOR_ROUTE = "/fun/explore/mine";

    private final JdbcTemplate jdbc;
    private final ExploreService explore;
    private final NotificationService notifications;
    private final UserRepository users;

    private long count(String sql, Object... args) {
        Long v = jdbc.queryForObject(sql, Long.class, args);
        return v == null ? 0 : v;
    }

    // ---- the list of creators (back office) ----

    /** creator / s_creator, or null when the person may not post. */
    public String levelOf(long userId) {
        return jdbc.query("SELECT level FROM explore_creators WHERE user_id = ?", (rs, i) -> rs.getString(1), userId).stream().findFirst().orElse(null);
    }

    public List<Map<String, Object>> creators() {
        return jdbc.queryForList("SELECT c.user_id AS userId, c.level, c.note, c.created_at AS createdAt, u.name, u.phone, u.email, u.image, " +
                "(SELECT COUNT(*) FROM explore_posts p WHERE p.author_id = c.user_id) AS posts, " +
                "(SELECT COUNT(*) FROM explore_posts p WHERE p.author_id = c.user_id AND p.status = 'published') AS published, " +
                "(SELECT COUNT(*) FROM explore_posts p WHERE p.author_id = c.user_id AND p.status = 'pending') AS pending " +
                "FROM explore_creators c JOIN users u ON u.id = c.user_id ORDER BY c.created_at DESC");
    }

    /** Members to add: name, phone or email contains the words; says who is already a creator. */
    public List<Map<String, Object>> searchUsers(String rawQ) {
        String q = rawQ == null ? "" : rawQ.trim();
        if (q.length() < 2) return List.of();
        String like = "%" + q.replace("%", "").replace("_", "") + "%";
        return jdbc.queryForList("SELECT u.id, u.name, u.phone, u.email, u.role, u.image, c.level FROM users u LEFT JOIN explore_creators c ON c.user_id = u.id " +
                "WHERE u.status = 1 AND (u.is_child IS NULL OR u.is_child = 0) AND (u.name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?) ORDER BY u.id DESC LIMIT 20", like, like, like);
    }

    @Transactional
    public void setCreator(long userId, String rawLevel, String note, long adminId) {
        String level = ExploreRules.cleanLevel(rawLevel);
        if (count("SELECT COUNT(*) FROM users WHERE id = ?", userId) == 0) throw new IllegalArgumentException("Không tìm thấy thành viên");
        String clean = note == null || note.isBlank() ? null : note.trim().length() > 255 ? note.trim().substring(0, 255) : note.trim();
        boolean added = count("SELECT COUNT(*) FROM explore_creators WHERE user_id = ?", userId) == 0;
        jdbc.update("INSERT INTO explore_creators (user_id, level, note, added_by) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE level = VALUES(level), note = VALUES(note)",
                userId, level, clean, adminId);
        if (added) notifyUser(userId, "Bạn có thể đăng bài Khám phá", "Vào Vui học > Khám phá > Bài đăng của tôi để đăng bài đầu tiên." +
                (ExploreRules.CREATOR.equals(level) ? " Bài sẽ hiện sau khi anyLEARN duyệt." : ""));
    }

    /** Removes the right to post; the posts stay as they are. */
    public void removeCreator(long userId) {
        jdbc.update("DELETE FROM explore_creators WHERE user_id = ?", userId);
    }

    // ---- a creator's own posts ----

    private String requireLevel(long userId) {
        String level = levelOf(userId);
        if (level == null) throw new IllegalStateException("Bạn chưa được mở quyền đăng bài Khám phá");
        return level;
    }

    private Map<String, Object> own(long userId, long postId) {
        Map<String, Object> row = explore.row(postId);
        if (row == null || !Objects.equals(asLong(row.get("authorId")), userId)) throw new IllegalArgumentException("Không tìm thấy bài viết");
        return row;
    }

    private static Long asLong(Object v) {
        return v instanceof Number n ? n.longValue() : null;
    }

    public Map<String, Object> me(long userId) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("level", levelOf(userId));
        return out;
    }

    /** The creator's posts, newest first, every status. */
    public Map<String, Object> myPosts(long userId, int page, int size) {
        requireLevel(userId);
        int safeSize = Math.max(1, Math.min(size, 30));
        int safePage = Math.max(1, page);
        List<Map<String, Object>> rows = explore.decorate(jdbc.queryForList("SELECT " + ExploreService.POST_COLUMNS + ExploreService.POST_FROM +
                "WHERE p.author_id = ? ORDER BY p.id DESC LIMIT ? OFFSET ?", userId, safeSize, (safePage - 1) * safeSize), false);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("items", rows);
        out.put("total", count("SELECT COUNT(*) FROM explore_posts WHERE author_id = ?", userId));
        out.put("page", safePage);
        return out;
    }

    public Map<String, Object> myPost(long userId, long postId) {
        requireLevel(userId);
        Map<String, Object> row = own(userId, postId);
        row.remove("authorFullName");
        return row;
    }

    /**
     * Creates (id null) or updates a creator's post. `uploading` = a clip is being sent to Bunny: the post waits as a draft
     * and takes its status (published for s_creator, pending for creator, see ExploreRules.statusAfterCreatorSave) when the
     * clip is attached. The back office is told when the post goes live or waits for review.
     */
    @Transactional
    public long save(long userId, Long id, String kind, String title, String body, String mediaUrl, String posterUrl, Long itemId, List<Long> tagIds, boolean uploading) {
        String level = requireLevel(userId);
        Map<String, Object> current = id == null ? null : own(userId, id);
        String target = ExploreRules.statusAfterCreatorSave(level, current == null ? null : (String) current.get("status"), current == null ? null : (String) current.get("hiddenBy"));
        boolean approved = ExploreRules.S_CREATOR.equals(level);
        String hiddenBy = "hidden".equals(target) ? "creator" : null;
        String status = uploading ? "draft" : target;
        boolean pinned = current != null && Boolean.TRUE.equals(current.get("pinned"));
        long postId = explore.write(id, userId, kind, title, body, mediaUrl, posterUrl, itemId, status, pinned, approved, hiddenBy, uploading ? target : null, tagIds == null ? List.of() : tagIds);
        if (!uploading) tellAdmins(userId, postId, target, current == null);
        return postId;
    }

    /** The clip of a creator's post finished uploading: the post takes its waiting status and the back office is told. */
    @Transactional
    public void attachMedia(long userId, long postId, String mediaUrl, String posterUrl) {
        requireLevel(userId);
        Map<String, Object> row = own(userId, postId);
        String waiting = (String) row.get("afterUpload");
        explore.attachMedia(postId, mediaUrl, posterUrl);
        if (waiting != null) tellAdmins(userId, postId, waiting, row.get("publishedAt") == null);
    }

    @Transactional
    public String hide(long userId, long postId) {
        requireLevel(userId);
        Map<String, Object> row = own(userId, postId);
        if (!ExploreRules.creatorCanHide((String) row.get("status"))) throw new IllegalStateException("Bài này đang không hiện");
        explore.setStatus(postId, "hidden", null, "creator", null);
        return "hidden";
    }

    @Transactional
    public String show(long userId, long postId) {
        String level = requireLevel(userId);
        Map<String, Object> row = own(userId, postId);
        String status = (String) row.get("status");
        if (!"hidden".equals(status) && !"rejected".equals(status)) throw new IllegalStateException("Bài này không ở trạng thái ẩn");
        String next = ExploreRules.statusAfterCreatorShow(level, Boolean.TRUE.equals(row.get("approved")), status, (String) row.get("hiddenBy"));
        explore.setStatus(postId, next, "published".equals(next) ? Boolean.TRUE : null, null, null);
        if ("pending".equals(next)) tellAdmins(userId, postId, next, false);
        return next;
    }

    @Transactional
    public void delete(long userId, long postId) {
        requireLevel(userId);
        Map<String, Object> row = own(userId, postId);
        if (!ExploreRules.creatorCanDelete((String) row.get("status"))) throw new IllegalStateException("Hãy ẩn bài trước khi xóa");
        explore.deletePost(postId);
    }

    /** Active tags of the shared dictionary whose name contains the words (accents and case ignored by the collation). */
    public List<Map<String, Object>> tags(String rawQ) {
        String q = rawQ == null ? "" : rawQ.trim();
        String like = "%" + q.replace("%", "").replace("_", "") + "%";
        return jdbc.queryForList("SELECT t.id, t.name FROM tags t WHERE t.status = 1 AND t.name LIKE ? " +
                "ORDER BY (SELECT COUNT(*) FROM explore_post_tags pt WHERE pt.tag_id = t.id) + (SELECT COUNT(*) FROM item_tags it WHERE it.tag_id = t.id) DESC, t.name LIMIT 20", like);
    }

    // ---- admin review and changes to a creator's post ----

    /** approve / reject (reason needed) / hide / show a post; the creator of the post is told. */
    @Transactional
    public void review(long postId, String action, String rawNote) {
        Map<String, Object> row = explore.row(postId);
        if (row == null) throw new IllegalArgumentException("Không tìm thấy bài viết");
        String note = rawNote == null || rawNote.isBlank() ? null : rawNote.trim().length() > 255 ? rawNote.trim().substring(0, 255) : rawNote.trim();
        String title = (String) row.get("title");
        switch (action == null ? "" : action) {
            case "approve", "show" -> {
                if (row.get("mediaUrl") == null && !"article".equals(row.get("kind"))) throw new IllegalArgumentException("Bài chưa có hình hoặc clip");
                explore.setStatus(postId, "published", true, null, null);
                notifyAuthor(row, "approve".equals(action) ? "Bài của bạn đã được duyệt" : "Bài của bạn đã hiện lại", "“" + title + "” đang hiện ở Khám phá.");
            }
            case "reject" -> {
                if (note == null) throw new IllegalArgumentException("Hãy ghi lý do từ chối để creator sửa lại");
                explore.setStatus(postId, "rejected", false, null, note);
                notifyAuthor(row, "Bài của bạn chưa được duyệt", "“" + title + "”: " + note + ". Bạn sửa bài rồi gửi lại nhé.");
            }
            case "hide" -> {
                explore.setStatus(postId, "hidden", null, "admin", note);
                notifyAuthor(row, "Bài của bạn đã bị ẩn", "“" + title + "”" + (note == null ? " đã được anyLEARN ẩn." : ": " + note + "."));
            }
            default -> throw new IllegalArgumentException("Thao tác không hợp lệ");
        }
    }

    /** After an admin saved a creator's post in the back office form: tells the creator what changed. */
    public void afterAdminSave(Map<String, Object> before) {
        if (before == null || before.get("authorId") == null) return;
        Map<String, Object> after = explore.row(((Number) before.get("id")).longValue());
        if (after == null) return;
        String was = (String) before.get("status"), now = (String) after.get("status");
        String title = (String) after.get("title");
        if (!Objects.equals(was, now) && "published".equals(now)) notifyAuthor(after, "Bài của bạn đã được duyệt", "“" + title + "” đang hiện ở Khám phá.");
        else if (!Objects.equals(was, now) && "hidden".equals(now)) notifyAuthor(after, "Bài của bạn đã bị ẩn", "“" + title + "” đã được anyLEARN ẩn.");
        else notifyAuthor(after, "anyLEARN đã chỉnh sửa bài của bạn", "“" + title + "” vừa được chỉnh sửa trong trang quản trị.");
    }

    /** Before an admin deletes a post: tells its creator. */
    public void beforeAdminDelete(long postId) {
        Map<String, Object> row = explore.row(postId);
        if (row != null) notifyAuthor(row, "Bài của bạn đã bị xóa", "“" + row.get("title") + "” đã được anyLEARN xóa khỏi Khám phá.");
    }

    // ---- notifications ----

    private void notifyAuthor(Map<String, Object> row, String title, String content) {
        Long authorId = asLong(row.get("authorId"));
        if (authorId != null) notifyUser(authorId, title, content);
    }

    private void notifyUser(long userId, String title, String content) {
        try {
            notifications.createNotification(userId, TYPE_TO_CREATOR, title, content, CREATOR_ROUTE);
        } catch (Exception e) {
            log.warn("[explore] creator {} not notified: {}", userId, e.getMessage());
        }
    }

    /** A creator's post went live (s_creator) or waits for review: every back office recipient is told. */
    private void tellAdmins(long userId, long postId, String status, boolean isNew) {
        if (!"published".equals(status) && !"pending".equals(status)) return;
        String name = users.findById(userId).map(User::getName).orElse("Creator");
        Map<String, Object> row = explore.row(postId);
        String title = row == null ? "" : (String) row.get("title");
        String head = "pending".equals(status) ? (isNew ? "Bài Khám phá mới chờ duyệt" : "Bài Khám phá gửi duyệt lại") : "Bài Khám phá mới của s-creator";
        String content = name + ": “" + title + "”" + ("pending".equals(status) ? "" : " (đã tự đăng)");
        for (User admin : users.findAdminNotificationRecipients()) {
            try {
                notifications.createNotification(admin.getId(), TYPE_TO_ADMIN, head, content, ADMIN_ROUTE);
            } catch (Exception e) {
                log.warn("[explore] admin {} not notified: {}", admin.getId(), e.getMessage());
            }
        }
    }
}
