package com.anylearn.backend.service.studio;

import com.anylearn.backend.config.PaymentConfig;
import com.anylearn.backend.service.seo.SeoRules;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The queue of social posts (plan 19.A6): what to post on which channel, with which caption and tracked link, and when.
 * The first version is a list the team posts by hand ("Đã đăng" keeps the link of the published post); t2m may add
 * proposals for its own posts through /api/studio/social-queue.
 */
@Service
@RequiredArgsConstructor
public class SocialQueueService {

    private final JdbcTemplate jdbc;
    private final PaymentConfig paymentConfig;

    private static final String COLUMNS = "q.id, q.post_id AS postId, p.title AS postTitle, p.status AS postStatus, q.channel, q.caption, q.link, q.scheduled_at AS scheduledAt, " +
            "q.status, q.posted_url AS postedUrl, q.posted_at AS postedAt, q.created_at AS createdAt, u.name AS createdByName";
    private static final String FROM = " FROM social_queue q LEFT JOIN explore_posts p ON p.id = q.post_id LEFT JOIN users u ON u.id = q.created_by ";

    /** status = waiting / posted / skipped / all. Waiting first by time (no time = at the end). */
    public List<Map<String, Object>> list(String status) {
        String clean = status == null || status.isBlank() ? "waiting" : status.trim();
        if ("all".equals(clean)) return jdbc.queryForList("SELECT " + COLUMNS + FROM + "ORDER BY q.id DESC LIMIT 300");
        if (!StudioRules.STATUSES.contains(clean)) throw new IllegalArgumentException("Trạng thái không hợp lệ");
        String order = "waiting".equals(clean) ? " ORDER BY q.scheduled_at IS NULL, q.scheduled_at, q.id" : " ORDER BY COALESCE(q.posted_at, q.updated_at) DESC";
        return jdbc.queryForList("SELECT " + COLUMNS + FROM + "WHERE q.status = ?" + order + " LIMIT 300", clean);
    }

    /** The tracked link of a post on a channel (null without a post). */
    public String linkFor(Long postId, String channel, String campaign) {
        if (postId == null) return null;
        String title = jdbc.query("SELECT title FROM explore_posts WHERE id = ?", (rs, i) -> rs.getString(1), postId).stream().findFirst().orElse(null);
        if (title == null) throw new IllegalArgumentException("Không tìm thấy bài Khám phá");
        return StudioRules.postLink(paymentConfig.getFrontendUrl(), postId, SeoRules.slug(title), channel, campaign);
    }

    /**
     * Adds a line. Without a link, a line about a post gets the post's tracked link. `onlyAuthor` (t2m) = the post must
     * belong to that account.
     */
    public long add(Long postId, String channel, String caption, String link, LocalDateTime scheduledAt, String campaign, Long createdBy, Long onlyAuthor) {
        String cleanChannel = StudioRules.cleanChannel(channel);
        if (onlyAuthor != null) {
            if (postId == null) throw new IllegalArgumentException("Cần mã bài Khám phá");
            Long owner = jdbc.query("SELECT author_id FROM explore_posts WHERE id = ?", (rs, i) -> (Long) rs.getObject(1, Long.class), postId).stream().findFirst().orElse(null);
            if (owner == null || !owner.equals(onlyAuthor)) throw new IllegalArgumentException("Bài này không thuộc tài khoản của bạn");
        }
        String url = link == null || link.isBlank() ? linkFor(postId, cleanChannel, campaign) : StudioRules.cleanUrl(link);
        jdbc.update("INSERT INTO social_queue (post_id, channel, caption, link, scheduled_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
                postId, cleanChannel, StudioRules.cleanCaption(caption), url, scheduledAt, createdBy);
        Long id = jdbc.queryForObject("SELECT LAST_INSERT_ID()", Long.class);
        return id == null ? 0 : id;
    }

    public void update(long id, String channel, String caption, String link, LocalDateTime scheduledAt) {
        int n = jdbc.update("UPDATE social_queue SET channel = ?, caption = ?, link = ?, scheduled_at = ? WHERE id = ?",
                StudioRules.cleanChannel(channel), StudioRules.cleanCaption(caption), StudioRules.cleanUrl(link), scheduledAt, id);
        if (n == 0) throw new IllegalArgumentException("Không tìm thấy dòng này");
    }

    /** Marks a line posted (with the link of the published post, optional) or skipped, or back to waiting. */
    public void setStatus(long id, String status, String postedUrl) {
        if (!StudioRules.STATUSES.contains(status)) throw new IllegalArgumentException("Trạng thái không hợp lệ");
        int n = jdbc.update("UPDATE social_queue SET status = ?, posted_url = ?, posted_at = IF(? = 'posted', NOW(), NULL) WHERE id = ?",
                status, "posted".equals(status) ? StudioRules.cleanUrl(postedUrl) : null, status, id);
        if (n == 0) throw new IllegalArgumentException("Không tìm thấy dòng này");
    }

    public void delete(long id) {
        jdbc.update("DELETE FROM social_queue WHERE id = ?", id);
    }

    /**
     * Numbers of the posts of one account for t2m's daily `stats` (plan 19.B8): Khám phá counters, accounts whose first
     * visit was this post (`user_acquisition.explore_post_id`) and how many of them bought, and the social lines.
     */
    public Map<String, Object> stats(long authorId, int days) {
        int safeDays = Math.max(1, Math.min(days, 365));
        List<Map<String, Object>> posts = jdbc.queryForList("SELECT p.id, p.title, p.kind, p.status, p.source, p.published_at AS publishedAt, p.views, p.likes, p.shares, p.comments_count AS comments, " +
                "(SELECT COUNT(*) FROM user_acquisition a WHERE a.explore_post_id = p.id) AS signups, " +
                "(SELECT COUNT(DISTINCT a.user_id) FROM user_acquisition a JOIN orders o ON o.user_id = a.user_id AND o.status = 'delivered' WHERE a.explore_post_id = p.id) AS buyers, " +
                "(SELECT COUNT(*) FROM social_queue q WHERE q.post_id = p.id AND q.status = 'posted') AS socialPosted " +
                "FROM explore_posts p WHERE p.author_id = ? AND p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY p.id DESC", authorId, safeDays);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("days", safeDays);
        out.put("posts", posts);
        return out;
    }
}
