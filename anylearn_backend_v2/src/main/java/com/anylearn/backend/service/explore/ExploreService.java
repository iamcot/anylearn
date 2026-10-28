package com.anylearn.backend.service.explore;

import com.anylearn.backend.service.chat.ChatRules;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.quiz.QuizBoardRules;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Khám phá (plan 14, phase 7): the feed of published posts, likes, comments with reports, and the admin side (posts,
 * comment moderation, a comment ban, numbers). Counters on the post row are kept in step by the methods here.
 */
@Service
@RequiredArgsConstructor
public class ExploreService {

    private final JdbcTemplate jdbc;
    private final ExploreSettings settings;
    private final GameEventService events;

    private static final String POST_COLUMNS = "p.id, p.kind, p.title, p.body, p.media_url AS mediaUrl, p.poster_url AS posterUrl, p.item_id AS itemId, p.status, p.pinned, " +
            "p.published_at AS publishedAt, p.views, p.likes, p.shares, p.comments_count AS comments, p.created_at AS createdAt, i.title AS itemTitle, i.seo_url AS itemSeoUrl";
    private static final String POST_FROM = " FROM explore_posts p LEFT JOIN items i ON i.id = p.item_id ";

    private long count(String sql, Object... args) {
        Long v = jdbc.queryForObject(sql, Long.class, args);
        return v == null ? 0 : v;
    }

    // ---- visitors ----

    /** Published posts, pinned first then newest, with whether the caller liked each. */
    public Map<String, Object> feed(long userId, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 30));
        int safePage = Math.max(1, page);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + POST_COLUMNS + ", (SELECT COUNT(*) FROM explore_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS likedByMe" + POST_FROM +
                "WHERE p.status = 'published' ORDER BY p.pinned DESC, p.published_at DESC, p.id DESC LIMIT ? OFFSET ?", userId, safeSize, (safePage - 1) * safeSize);
        for (Map<String, Object> r : rows) r.put("likedByMe", ((Number) r.get("likedByMe")).intValue() > 0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("commentsEnabled", settings.commentsEnabled());
        out.put("items", settings.enabled() ? rows : List.of());
        out.put("total", count("SELECT COUNT(*) FROM explore_posts WHERE status = 'published'"));
        out.put("page", safePage);
        return out;
    }

    private boolean published(long postId) {
        return count("SELECT COUNT(*) FROM explore_posts WHERE id = ? AND status = 'published'", postId) > 0;
    }

    /** Counts one opening of a post by a person; the game event feeds the weekly mission "xem bài ở Khám phá". */
    public void countView(long userId, long postId) {
        if (jdbc.update("UPDATE explore_posts SET views = views + 1 WHERE id = ? AND status = 'published'", postId) > 0) {
            events.record(userId, GameEventService.GAME_EXPLORE, "view", "Bài #" + postId, 0);
        }
    }

    public void countShare(long postId) {
        jdbc.update("UPDATE explore_posts SET shares = shares + 1 WHERE id = ? AND status = 'published'", postId);
    }

    /** Toggles the like of the caller; returns the new state and count. */
    @Transactional
    public Map<String, Object> toggleLike(long userId, long postId) {
        if (!published(postId)) throw new IllegalStateException("Bài viết không còn");
        int removed = jdbc.update("DELETE FROM explore_likes WHERE post_id = ? AND user_id = ?", postId, userId);
        boolean liked;
        if (removed > 0) {
            liked = false;
            jdbc.update("UPDATE explore_posts SET likes = GREATEST(likes - 1, 0) WHERE id = ?", postId);
        } else {
            liked = jdbc.update("INSERT IGNORE INTO explore_likes (post_id, user_id) VALUES (?, ?)", postId, userId) > 0;
            if (liked) {
                jdbc.update("UPDATE explore_posts SET likes = likes + 1 WHERE id = ?", postId);
                events.record(userId, GameEventService.GAME_EXPLORE, "like", "Bài #" + postId, 0);
            }
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("liked", liked);
        out.put("likes", count("SELECT likes FROM explore_posts WHERE id = ?", postId));
        return out;
    }

    public List<Map<String, Object>> comments(long postId, long viewerId, long before, int size) {
        int safeSize = Math.max(1, Math.min(size, 50));
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT c.id, c.user_id AS userId, c.body, c.created_at AS createdAt, u.name AS name FROM explore_comments c " +
                "LEFT JOIN users u ON u.id = c.user_id WHERE c.post_id = ? AND c.status = 'visible' AND (? = 0 OR c.id < ?) ORDER BY c.id DESC LIMIT ?", postId, before, before, safeSize);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", r.get("id"));
            m.put("name", QuizBoardRules.displayName((String) r.get("name")));
            m.put("body", r.get("body"));
            m.put("createdAt", r.get("createdAt"));
            m.put("mine", ((Number) r.get("userId")).longValue() == viewerId);
            out.add(m);
        }
        return out;
    }

    @Transactional
    public Map<String, Object> addComment(long userId, long postId, String rawBody) {
        if (!settings.commentsEnabled()) throw new IllegalStateException("Bình luận đang tạm tắt");
        if (!published(postId)) throw new IllegalStateException("Bài viết không còn");
        String body = ExploreRules.cleanComment(rawBody);
        boolean banned = count("SELECT COUNT(*) FROM explore_comment_bans WHERE user_id = ?", userId) > 0;
        long lastMinute = count("SELECT COUNT(*) FROM explore_comments WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)", userId);
        String problem = ExploreRules.commentProblem(banned, ChatRules.findBannedWord(body, settings.bannedWords()), lastMinute, settings.commentsPerMinute());
        if (problem != null) throw new IllegalStateException(problem);
        jdbc.update("INSERT INTO explore_comments (post_id, user_id, body) VALUES (?, ?, ?)", postId, userId, body);
        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        jdbc.update("UPDATE explore_posts SET comments_count = comments_count + 1 WHERE id = ?", postId);
        events.record(userId, GameEventService.GAME_EXPLORE, "comment", "Bài #" + postId, 0);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("id", id);
        out.put("comments", count("SELECT comments_count FROM explore_posts WHERE id = ?", postId));
        return out;
    }

    /** A person may remove their own comment. */
    @Transactional
    public boolean deleteOwnComment(long userId, long commentId) {
        Long postId = jdbc.query("SELECT post_id FROM explore_comments WHERE id = ? AND user_id = ? AND status = 'visible'", (rs, i) -> rs.getLong(1), commentId, userId).stream().findFirst().orElse(null);
        if (postId == null) return false;
        jdbc.update("UPDATE explore_comments SET status = 'removed' WHERE id = ?", commentId);
        jdbc.update("UPDATE explore_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = ?", postId);
        return true;
    }

    public void reportComment(long userId, long commentId, String rawReason) {
        String reason = ChatRules.cleanReason(rawReason);
        if (count("SELECT COUNT(*) FROM explore_comments WHERE id = ? AND status = 'visible'", commentId) == 0) throw new IllegalStateException("Bình luận không còn");
        jdbc.update("INSERT IGNORE INTO explore_comment_reports (comment_id, user_id, reason) VALUES (?, ?, ?)", commentId, userId, reason);
    }

    // ---- back office ----

    public List<Map<String, Object>> adminPosts() {
        return jdbc.queryForList("SELECT " + POST_COLUMNS + POST_FROM + "ORDER BY p.id DESC LIMIT 300");
    }

    /** Creates (id null) or updates a post. Publishing sets the publication date once. Returns the id. */
    @Transactional
    public long savePost(Long id, String kind, String title, String body, String mediaUrl, String posterUrl, Long itemId, String status, boolean pinned) {
        String cleanKind = ExploreRules.cleanKind(kind);
        String cleanTitle = ExploreRules.cleanTitle(title);
        String cleanStatus = ExploreRules.cleanStatus(status);
        String media = ExploreRules.cleanMedia(cleanKind, mediaUrl, cleanStatus);
        String poster = posterUrl == null || posterUrl.isBlank() ? null : posterUrl.trim();
        String text = body == null || body.isBlank() ? null : body.trim();
        if (text != null && text.length() > 8000) throw new IllegalArgumentException("Nội dung tối đa 8000 ký tự");
        if (itemId != null && count("SELECT COUNT(*) FROM items WHERE id = ?", itemId) == 0) throw new IllegalArgumentException("Không tìm thấy khóa học gắn kèm");
        if (id == null) {
            jdbc.update("INSERT INTO explore_posts (kind, title, body, media_url, poster_url, item_id, status, pinned, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, " +
                    ("published".equals(cleanStatus) ? "NOW()" : "NULL") + ")", cleanKind, cleanTitle, text, media, poster, itemId, cleanStatus, pinned ? 1 : 0);
            return count("SELECT LAST_INSERT_ID()");
        }
        if (count("SELECT COUNT(*) FROM explore_posts WHERE id = ?", id) == 0) throw new IllegalArgumentException("Không tìm thấy bài viết");
        jdbc.update("UPDATE explore_posts SET kind = ?, title = ?, body = ?, media_url = ?, poster_url = ?, item_id = ?, status = ?, pinned = ?, " +
                "published_at = IF(? = 'published' AND published_at IS NULL, NOW(), published_at) WHERE id = ?", cleanKind, cleanTitle, text, media, poster, itemId, cleanStatus, pinned ? 1 : 0, cleanStatus, id);
        return id;
    }

    /**
     * Sets the clip and the poster of a post when an upload to Bunny finishes. Touches nothing else, so edits the admin made
     * while the video was uploading are kept; an existing poster is not replaced.
     */
    @Transactional
    public void attachMedia(long id, String mediaUrl, String posterUrl) {
        String media = ExploreRules.cleanMedia("video", mediaUrl, "published");
        String poster = posterUrl == null || posterUrl.isBlank() ? null : posterUrl.trim();
        int rows = jdbc.update("UPDATE explore_posts SET media_url = ?, poster_url = COALESCE(NULLIF(poster_url, ''), ?) WHERE id = ?", media, poster, id);
        if (rows == 0) throw new IllegalArgumentException("Không tìm thấy bài viết");
    }

    @Transactional
    public void deletePost(long id) {
        jdbc.update("DELETE FROM explore_comment_reports WHERE comment_id IN (SELECT id FROM explore_comments WHERE post_id = ?)", id);
        jdbc.update("DELETE FROM explore_comments WHERE post_id = ?", id);
        jdbc.update("DELETE FROM explore_likes WHERE post_id = ?", id);
        jdbc.update("DELETE FROM explore_posts WHERE id = ?", id);
    }

    /** Comments for moderation: filter all / reported (open reports) / hidden. */
    public List<Map<String, Object>> adminComments(String filter, int page) {
        int offset = (Math.max(page, 1) - 1) * 30;
        String where = switch (filter == null ? "all" : filter) {
            case "reported" -> "WHERE c.status = 'visible' AND EXISTS (SELECT 1 FROM explore_comment_reports r WHERE r.comment_id = c.id AND r.status = 'open')";
            case "hidden" -> "WHERE c.status = 'hidden'";
            default -> "WHERE c.status IN ('visible', 'hidden')";
        };
        return jdbc.queryForList("SELECT c.id, c.post_id AS postId, p.title AS postTitle, c.user_id AS userId, u.name AS userName, u.phone AS userPhone, c.body, c.status, c.created_at AS createdAt, " +
                "(SELECT COUNT(*) FROM explore_comment_reports r WHERE r.comment_id = c.id AND r.status = 'open') AS reports, " +
                "(SELECT GROUP_CONCAT(r.reason SEPARATOR ' | ') FROM explore_comment_reports r WHERE r.comment_id = c.id AND r.status = 'open') AS reasons, " +
                "(SELECT COUNT(*) FROM explore_comment_bans b WHERE b.user_id = c.user_id) AS banned " +
                "FROM explore_comments c LEFT JOIN explore_posts p ON p.id = c.post_id LEFT JOIN users u ON u.id = c.user_id " + where + " ORDER BY c.id DESC LIMIT 30 OFFSET " + offset);
    }

    /** Hide or show a comment; hiding closes its open reports as handled. */
    @Transactional
    public void setCommentStatus(long commentId, boolean visible) {
        List<Long> post = jdbc.query("SELECT post_id FROM explore_comments WHERE id = ? AND status IN ('visible', 'hidden')", (rs, i) -> rs.getLong(1), commentId);
        if (post.isEmpty()) throw new IllegalArgumentException("Không tìm thấy bình luận");
        jdbc.update("UPDATE explore_comments SET status = ? WHERE id = ?", visible ? "visible" : "hidden", commentId);
        jdbc.update("UPDATE explore_posts SET comments_count = (SELECT COUNT(*) FROM explore_comments WHERE post_id = ? AND status = 'visible') WHERE id = ?", post.get(0), post.get(0));
        if (!visible) jdbc.update("UPDATE explore_comment_reports SET status = 'closed' WHERE comment_id = ?", commentId);
    }

    /** Keeps a reported comment and closes its reports. */
    public void keepComment(long commentId) {
        jdbc.update("UPDATE explore_comment_reports SET status = 'closed' WHERE comment_id = ?", commentId);
    }

    public void setBan(long userId, boolean banned, String reason) {
        if (banned) jdbc.update("INSERT INTO explore_comment_bans (user_id, reason) VALUES (?, ?) ON DUPLICATE KEY UPDATE reason = VALUES(reason)", userId, reason);
        else jdbc.update("DELETE FROM explore_comment_bans WHERE user_id = ?", userId);
    }

    public long openReports() {
        return count("SELECT COUNT(DISTINCT r.comment_id) FROM explore_comment_reports r JOIN explore_comments c ON c.id = r.comment_id AND c.status = 'visible' WHERE r.status = 'open'");
    }

    public Map<String, Object> stats() {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("published", count("SELECT COUNT(*) FROM explore_posts WHERE status = 'published'"));
        out.put("views", count("SELECT COALESCE(SUM(views), 0) FROM explore_posts"));
        out.put("likes", count("SELECT COALESCE(SUM(likes), 0) FROM explore_posts"));
        out.put("shares", count("SELECT COALESCE(SUM(shares), 0) FROM explore_posts"));
        out.put("comments", count("SELECT COUNT(*) FROM explore_comments WHERE status = 'visible'"));
        out.put("openReports", openReports());
        return out;
    }
}
