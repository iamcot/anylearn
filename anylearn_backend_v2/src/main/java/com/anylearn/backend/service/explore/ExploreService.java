package com.anylearn.backend.service.explore;

import com.anylearn.backend.service.chat.ChatRules;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.quiz.QuizBoardRules;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Khám phá (plan 14, phase 7; plan 16): the feed of published posts (unseen first, then by interest), search, likes,
 * comments with reports, and the admin side (posts, comment moderation, a comment ban, numbers). Counters on the post row
 * are kept in step by the methods here. Creators' own actions and the review notifications are in ExploreCreatorService.
 */
@Service
@RequiredArgsConstructor
public class ExploreService {

    private final JdbcTemplate jdbc;
    private final ExploreSettings settings;
    private final GameEventService events;
    private final ExploreSearchIndex index;
    private final ExploreMediaCleaner cleaner;

    static final String POST_COLUMNS = "p.id, p.kind, p.title, p.body, p.media_url AS mediaUrl, p.poster_url AS posterUrl, p.item_id AS itemId, p.status, p.pinned, " +
            "p.published_at AS publishedAt, p.views, p.likes, p.shares, p.comments_count AS comments, p.created_at AS createdAt, i.title AS itemTitle, i.seo_url AS itemSeoUrl, " +
            "i.image AS itemImage, i.price AS itemPrice, p.author_id AS authorId, au.name AS authorFullName, p.approved, p.hidden_by AS hiddenBy, p.review_note AS reviewNote, p.after_upload AS afterUpload";
    static final String POST_FROM = " FROM explore_posts p LEFT JOIN items i ON i.id = p.item_id LEFT JOIN users au ON au.id = p.author_id ";

    /**
     * Tag weights of a person (4 parameters: user, since, user, user): tags of posts they liked, and of courses they liked,
     * put in the cart or bought.
     */
    private static final String AFFINITY = "SELECT tag_id, COUNT(*) AS w FROM (" +
            "SELECT pt.tag_id FROM explore_likes l JOIN explore_post_tags pt ON pt.post_id = l.post_id WHERE l.user_id = ? AND l.created_at < ? " +
            "UNION ALL SELECT it.tag_id FROM item_user_actions a JOIN item_tags it ON it.item_id = a.item_id WHERE a.user_id = ? AND ((a.type = 'fav' AND a.value = '1') OR a.type = 'cart') " +
            "UNION ALL SELECT it.tag_id FROM order_details od JOIN item_tags it ON it.item_id = od.item_id WHERE od.user_id = ? AND od.status NOT LIKE 'cancel%'" +
            ") x GROUP BY tag_id";

    private long count(String sql, Object... args) {
        Long v = jdbc.queryForObject(sql, Long.class, args);
        return v == null ? 0 : v;
    }

    /** Refreshes the search index once the current transaction has committed (or now when there is none). */
    void indexLater(long postId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { index.indexPost(postId); }
            });
        } else {
            index.indexPost(postId);
        }
    }

    /** Deletes the files of `urls` once the transaction has committed, when no post uses them any more. */
    void cleanLater(List<String> urls) {
        List<String> list = urls.stream().filter(u -> u != null && !u.isBlank()).distinct().toList();
        if (list.isEmpty()) return;
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { cleaner.deleteUnused(list); }
            });
        } else {
            cleaner.deleteUnused(list);
        }
    }

    private List<String> mediaOf(long id) {
        return jdbc.query("SELECT media_url, poster_url FROM explore_posts WHERE id = ?", (rs, i) -> java.util.Arrays.asList(rs.getString(1), rs.getString(2)), id)
                .stream().findFirst().orElse(null);
    }

    /** Adds `tags` [{id, name}] and `tagIds` to each row, and the author's short name; drops the full name unless asked. */
    List<Map<String, Object>> decorate(List<Map<String, Object>> rows, boolean keepFullName) {
        if (rows.isEmpty()) return rows;
        String ids = rows.stream().map(r -> String.valueOf(((Number) r.get("id")).longValue())).collect(Collectors.joining(","));
        Map<Long, List<Map<String, Object>>> tags = new HashMap<>();
        for (Map<String, Object> t : jdbc.queryForList("SELECT pt.post_id AS postId, t.id, t.name FROM explore_post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id IN (" + ids + ") ORDER BY t.sort_order, t.name")) {
            Map<String, Object> tag = new LinkedHashMap<>();
            tag.put("id", ((Number) t.get("id")).longValue());
            tag.put("name", t.get("name"));
            tags.computeIfAbsent(((Number) t.get("postId")).longValue(), k -> new ArrayList<>()).add(tag);
        }
        for (Map<String, Object> r : rows) {
            List<Map<String, Object>> list = tags.getOrDefault(((Number) r.get("id")).longValue(), List.of());
            r.put("tags", list);
            r.put("tagIds", list.stream().map(t -> t.get("id")).toList());
            String full = (String) r.get("authorFullName");
            r.put("authorName", full == null ? null : ExploreRules.authorName(full));
            if (!keepFullName) r.remove("authorFullName");
            if (r.get("approved") instanceof Number n) r.put("approved", n.intValue() == 1);
            if (r.get("pinned") instanceof Number n) r.put("pinned", n.intValue() == 1);
            if (r.get("likedByMe") instanceof Number n) r.put("likedByMe", n.intValue() > 0);
        }
        return rows;
    }

    // ---- visitors ----

    private Map<String, Object> page(List<Map<String, Object>> items, long total, int page) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("enabled", settings.enabled());
        out.put("commentsEnabled", settings.commentsEnabled());
        out.put("items", settings.enabled() ? items : List.of());
        out.put("total", settings.enabled() ? total : 0);
        out.put("page", page);
        return out;
    }

    private static String likedByMe() {
        return ", (SELECT COUNT(*) FROM explore_likes l WHERE l.post_id = p.id AND l.user_id = ?) AS likedByMe";
    }

    /** Published posts in the order of plan 16.6 (no `since` = now). */
    public Map<String, Object> feed(long userId, int page, int size) {
        return feed(userId, page, size, null, List.of());
    }

    /**
     * Published posts for one person: pinned posts they have not seen, then every post they have not seen ranked by
     * ExploreRules.rankScore (tags matching their interests, freshness, engagement), then posts they saw, the longest ago
     * first. `since` = when the person opened the list: views and likes after it do not move posts between pages.
     * `exclude` = posts already on screen (the post a viewer was opened on).
     */
    public Map<String, Object> feed(long userId, int page, int size, LocalDateTime since, List<Long> exclude) {
        int safeSize = Math.max(1, Math.min(size, 30));
        int safePage = Math.max(1, page);
        LocalDateTime at = since == null || since.isAfter(LocalDateTime.now()) ? LocalDateTime.now() : since;
        String notIn = exclude == null || exclude.isEmpty() ? "" : " AND p.id NOT IN (" + exclude.stream().limit(50).map(String::valueOf).collect(Collectors.joining(",")) + ")";
        String unseen = "s.post_id IS NULL";
        String score = "LEAST(COALESCE(m.matches, 0), 5) * 3 + 2 / (1 + GREATEST(TIMESTAMPDIFF(HOUR, p.published_at, ?), 0) / 168) " +
                "+ 5 * (p.likes + 2 * p.comments_count + 3 * p.shares) / (p.views + 20)";
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + POST_COLUMNS + likedByMe() + POST_FROM +
                        "LEFT JOIN explore_seen s ON s.post_id = p.id AND s.user_id = ? AND s.first_at < ? " +
                        "LEFT JOIN (SELECT pt.post_id, SUM(a.w) AS matches FROM explore_post_tags pt JOIN (" + AFFINITY + ") a ON a.tag_id = pt.tag_id GROUP BY pt.post_id) m ON m.post_id = p.id " +
                        "WHERE p.status = 'published'" + notIn +
                        " ORDER BY (" + unseen + " AND p.pinned = 1) DESC, (" + unseen + ") DESC, CASE WHEN " + unseen + " THEN " + score + " ELSE 0 END DESC, s.last_at ASC, p.id DESC LIMIT ? OFFSET ?",
                userId, userId, at, userId, at, userId, userId, at, safeSize, (safePage - 1) * safeSize);
        return page(decorate(rows, false), count("SELECT COUNT(*) FROM explore_posts p WHERE p.status = 'published'" + notIn), safePage);
    }

    /** One published post (the post a shared link or a grid tile opens on), or null. */
    public Map<String, Object> post(long userId, long postId) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + POST_COLUMNS + likedByMe() + POST_FROM + "WHERE p.id = ? AND p.status = 'published'", userId, postId);
        return rows.isEmpty() || !settings.enabled() ? null : decorate(rows, false).get(0);
    }

    /**
     * A published post for a visitor without an account (a shared link, plan 19.A3): the post, its slug and the newest
     * visible comments, read only and with the short name only. Null when the post is not published or Khám phá is off.
     */
    public Map<String, Object> publicPost(long postId, int commentCount) {
        if (!settings.enabled()) return null;
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + POST_COLUMNS + ", 0 AS likedByMe" + POST_FROM + "WHERE p.id = ? AND p.status = 'published'", postId);
        if (rows.isEmpty()) return null;
        Map<String, Object> post = decorate(rows, false).get(0);
        for (String key : List.of("approved", "hiddenBy", "reviewNote", "afterUpload", "status")) post.remove(key);
        post.put("slug", com.anylearn.backend.service.seo.SeoRules.slug((String) post.get("title")));
        List<Map<String, Object>> comments = settings.commentsEnabled() ? comments(postId, 0, 0, commentCount) : List.of();
        comments.forEach(c -> c.remove("mine"));
        post.put("previewComments", comments);
        post.put("commentsEnabled", settings.commentsEnabled());
        return post;
    }

    /** A visitor without an account opened a post: only the counter (nothing to remember them by). */
    public void countPublicView(long postId) {
        jdbc.update("UPDATE explore_posts SET views = views + 1 WHERE id = ? AND status = 'published'", postId);
    }

    /** Published posts matching words in the title, the description or a tag name: Meilisearch, or SQL when it is down. */
    public Map<String, Object> search(long userId, String rawQ, int page, int size) {
        String q = rawQ == null ? "" : rawQ.trim();
        if (q.isEmpty()) return feed(userId, page, size);
        int safeSize = Math.max(1, Math.min(size, 30));
        int safePage = Math.max(1, page);
        int offset = (safePage - 1) * safeSize;
        ExploreSearchIndex.Hits hits = index.search(q, offset, safeSize);
        if (hits != null) {
            if (hits.ids().isEmpty()) return page(List.of(), hits.total(), safePage);
            String ids = hits.ids().stream().map(String::valueOf).collect(Collectors.joining(","));
            List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + POST_COLUMNS + likedByMe() + POST_FROM + "WHERE p.status = 'published' AND p.id IN (" + ids + ") ORDER BY FIELD(p.id, " + ids + ")", userId);
            return page(decorate(rows, false), hits.total(), safePage);
        }
        String like = "%" + q.replace("\\", "").replace("%", "").replace("_", "") + "%";
        String where = "WHERE p.status = 'published' AND (p.title LIKE ? OR p.body LIKE ? OR EXISTS (SELECT 1 FROM explore_post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id AND t.name LIKE ?))";
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + POST_COLUMNS + likedByMe() + POST_FROM + where + " ORDER BY p.published_at DESC, p.id DESC LIMIT ? OFFSET ?",
                userId, like, like, like, safeSize, offset);
        return page(decorate(rows, false), count("SELECT COUNT(*) FROM explore_posts p " + where, like, like, like), safePage);
    }

    private boolean published(long postId) {
        return count("SELECT COUNT(*) FROM explore_posts WHERE id = ? AND status = 'published'", postId) > 0;
    }

    /**
     * Counts one opening of a post by a person and remembers that they saw it (the feed puts it after unseen posts); the
     * game event feeds the weekly mission "xem bài ở Khám phá".
     */
    public void countView(long userId, long postId) {
        if (jdbc.update("UPDATE explore_posts SET views = views + 1 WHERE id = ? AND status = 'published'", postId) > 0) {
            jdbc.update("INSERT INTO explore_seen (user_id, post_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE last_at = NOW(), times = times + 1", userId, postId);
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
        return decorate(jdbc.queryForList("SELECT " + POST_COLUMNS + ", au.phone AS authorPhone" + POST_FROM + "ORDER BY (p.status = 'pending') DESC, p.id DESC LIMIT 300"), true);
    }

    /** The raw row of a post (status, author, approval...), or null. */
    public Map<String, Object> row(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT " + POST_COLUMNS + POST_FROM + "WHERE p.id = ?", id);
        return rows.isEmpty() ? null : decorate(rows, true).get(0);
    }

    /** Creates (id null) or updates a post as an admin, tags unchanged. */
    public long savePost(Long id, String kind, String title, String body, String mediaUrl, String posterUrl, Long itemId, String status, boolean pinned) {
        return savePost(id, kind, title, body, mediaUrl, posterUrl, itemId, status, pinned, null);
    }

    /**
     * Creates (id null) or updates a post as an admin. Publishing sets the publication date once and approves the content;
     * hiding marks it hidden by an admin. `tagIds` null = tags unchanged. Returns the id.
     */
    @Transactional
    public long savePost(Long id, String kind, String title, String body, String mediaUrl, String posterUrl, Long itemId, String status, boolean pinned, List<Long> tagIds) {
        String cleanStatus = ExploreRules.cleanStatus(status);
        Boolean approved = "published".equals(cleanStatus) ? Boolean.TRUE : "rejected".equals(cleanStatus) || "pending".equals(cleanStatus) ? Boolean.FALSE : null;
        String hiddenBy = "hidden".equals(cleanStatus) ? "admin" : null;
        return write(id, null, kind, title, body, mediaUrl, posterUrl, itemId, cleanStatus, pinned, approved, hiddenBy, null, tagIds);
    }

    /**
     * The one place that inserts or updates a post. `authorId` is used on insert only; `approved` null = unchanged (true on
     * insert); `afterUpload` = the status to take once the clip has uploaded (null = none). Checks tags and the course.
     */
    @Transactional
    long write(Long id, Long authorId, String kind, String title, String body, String mediaUrl, String posterUrl, Long itemId, String status, boolean pinned,
               Boolean approved, String hiddenBy, String afterUpload, List<Long> tagIds) {
        String cleanKind = ExploreRules.cleanKind(kind);
        String cleanTitle = ExploreRules.cleanTitle(title);
        String cleanStatus = ExploreRules.cleanStatus(status);
        String media = ExploreRules.cleanMedia(cleanKind, mediaUrl, cleanStatus);
        String poster = posterUrl == null || posterUrl.isBlank() ? null : posterUrl.trim();
        String text = body == null || body.isBlank() ? null : body.trim();
        if (text != null && text.length() > 8000) throw new IllegalArgumentException("Nội dung tối đa 8000 ký tự");
        if (itemId != null && count("SELECT COUNT(*) FROM items WHERE id = ?", itemId) == 0) throw new IllegalArgumentException("Không tìm thấy khóa học gắn kèm");
        List<Long> tags = tagIds == null ? null : ExploreRules.cleanTagIds(tagIds);
        if (tags != null && !tags.isEmpty()) {
            String ids = tags.stream().map(String::valueOf).collect(Collectors.joining(","));
            if (count("SELECT COUNT(*) FROM tags WHERE id IN (" + ids + ")") != tags.size()) throw new IllegalArgumentException("Có tag không còn trong danh sách");
        }
        String publishedAt = "IF(? = 'published' AND published_at IS NULL, NOW(), published_at)";
        long postId;
        if (id == null) {
            jdbc.update("INSERT INTO explore_posts (author_id, kind, title, body, media_url, poster_url, item_id, status, pinned, approved, hidden_by, after_upload, published_at) " +
                            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, " + ("published".equals(cleanStatus) ? "NOW()" : "NULL") + ")",
                    authorId, cleanKind, cleanTitle, text, media, poster, itemId, cleanStatus, pinned ? 1 : 0, approved == null || approved ? 1 : 0, hiddenBy, afterUpload);
            postId = count("SELECT LAST_INSERT_ID()");
        } else {
            List<String> old = mediaOf(id);
            if (old == null) throw new IllegalArgumentException("Không tìm thấy bài viết");
            cleanLater(old.stream().filter(u -> u != null && !u.equals(media) && !u.equals(poster)).toList());
            jdbc.update("UPDATE explore_posts SET kind = ?, title = ?, body = ?, media_url = ?, poster_url = ?, item_id = ?, status = ?, pinned = ?, approved = COALESCE(?, approved), " +
                            "hidden_by = ?, after_upload = ?, review_note = IF(? IN ('published', 'pending'), NULL, review_note), published_at = " + publishedAt + " WHERE id = ?",
                    cleanKind, cleanTitle, text, media, poster, itemId, cleanStatus, pinned ? 1 : 0, approved == null ? null : approved ? 1 : 0,
                    hiddenBy, afterUpload, cleanStatus, cleanStatus, id);
            postId = id;
        }
        if (tags != null) {
            jdbc.update("DELETE FROM explore_post_tags WHERE post_id = ?", postId);
            for (Long tagId : tags) jdbc.update("INSERT IGNORE INTO explore_post_tags (post_id, tag_id) VALUES (?, ?)", postId, tagId);
        }
        indexLater(postId);
        return postId;
    }

    /** Changes only the status fields of a post (review actions, hide / show). */
    @Transactional
    void setStatus(long id, String status, Boolean approved, String hiddenBy, String reviewNote) {
        String clean = ExploreRules.cleanStatus(status);
        jdbc.update("UPDATE explore_posts SET status = ?, approved = COALESCE(?, approved), hidden_by = ?, review_note = ?, after_upload = NULL, " +
                "published_at = IF(? = 'published' AND published_at IS NULL, NOW(), published_at) WHERE id = ?", clean, approved == null ? null : approved ? 1 : 0, hiddenBy, reviewNote, clean, id);
        indexLater(id);
    }

    /**
     * Sets the clip and the poster of a post when an upload to Bunny finishes. Touches nothing else, so edits made while the
     * video was uploading are kept; a poster chosen by hand is not replaced (the thumbnail of the replaced clip is). A post
     * waiting for its clip (`after_upload`) now takes that status. The replaced clip is deleted.
     */
    @Transactional
    public void attachMedia(long id, String mediaUrl, String posterUrl) {
        String media = ExploreRules.cleanMedia("video", mediaUrl, "published");
        String poster = posterUrl == null || posterUrl.isBlank() ? null : posterUrl.trim();
        List<String> old = mediaOf(id);
        if (old == null) throw new IllegalArgumentException("Không tìm thấy bài viết");
        String oldMedia = old.get(0), oldPoster = old.get(1);
        boolean posterOfOldClip = oldMedia != null && oldPoster != null && oldMedia.endsWith("/playlist.m3u8")
                && oldPoster.startsWith(oldMedia.substring(0, oldMedia.length() - "playlist.m3u8".length()));
        String keptPoster = oldPoster == null || oldPoster.isBlank() || posterOfOldClip ? poster : oldPoster;
        jdbc.update("UPDATE explore_posts SET media_url = ?, poster_url = ?, status = COALESCE(after_upload, status), " +
                "published_at = IF(after_upload = 'published' AND published_at IS NULL, NOW(), published_at), after_upload = NULL WHERE id = ?", media, keptPoster, id);
        cleanLater(java.util.stream.Stream.of(oldMedia, oldPoster).filter(u -> u != null && !u.equals(media) && !u.equals(keptPoster)).toList());
        indexLater(id);
    }

    /** Deletes a post with its comments, likes, views, tags and its files (Bunny clip, S3 photos). */
    @Transactional
    public void deletePost(long id) {
        List<String> media = mediaOf(id);
        jdbc.update("DELETE FROM explore_comment_reports WHERE comment_id IN (SELECT id FROM explore_comments WHERE post_id = ?)", id);
        jdbc.update("DELETE FROM explore_comments WHERE post_id = ?", id);
        jdbc.update("DELETE FROM explore_likes WHERE post_id = ?", id);
        jdbc.update("DELETE FROM explore_seen WHERE post_id = ?", id);
        jdbc.update("DELETE FROM explore_post_tags WHERE post_id = ?", id);
        jdbc.update("DELETE FROM explore_posts WHERE id = ?", id);
        indexLater(id);
        if (media != null) cleanLater(media);
    }

    public long pendingPosts() {
        return count("SELECT COUNT(*) FROM explore_posts WHERE status = 'pending'");
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
        out.put("pending", pendingPosts());
        return out;
    }
}
