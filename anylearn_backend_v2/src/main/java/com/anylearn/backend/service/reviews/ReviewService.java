package com.anylearn.backend.service.reviews;

import com.anylearn.backend.entity.Item;
import com.anylearn.backend.entity.ItemUserAction;
import com.anylearn.backend.repository.ItemRepository;
import com.anylearn.backend.repository.ItemUserActionRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.MeilisearchService;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.S3Service;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Reviews of courses (plan 09). The rating itself stays a row of `item_user_actions` (type 'rating') because search,
 * popularity and the partner's score already read it; `review_details`, `review_scores` and `review_media` hold the rest.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final JdbcTemplate jdbc;
    private final ItemUserActionRepository actions;
    private final ItemRepository itemRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final MeilisearchService meilisearchService;
    private final NotificationService notificationService;
    private final ReviewRewardService rewardService;

    /** What a parent sends. `media` null means "keep the photos already saved". */
    public record Submission(Integer rating, String comment, Map<String, Integer> scores, List<String> media) {}

    /** The problem to show (null when saved) and the anyPoint given by this save. */
    public record SaveResult(String problem, int pointsGiven) {}

    // ── Writing ──────────────────────────────────────────────────────────────

    /** Saves or updates the review of `userId` for a course. */
    @Transactional
    public SaveResult save(Long userId, Long itemId, Submission submission) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) return new SaveResult("Không tìm thấy khóa học", 0);
        Long orderId = deliveredOrderId(userId, itemId);
        if (orderId == null) return new SaveResult("Chỉ phụ huynh đã đăng ký khóa này mới đánh giá được", 0);
        int rating = ReviewRules.overallRating(submission.rating(), submission.scores());
        if (rating == 0) return new SaveResult("Vui lòng chọn số sao", 0);

        ItemUserAction action = actions.findRatingByItemAndUser(itemId, userId).orElseGet(ItemUserAction::new);
        action.setItemId(itemId);
        action.setUserId(userId);
        action.setType("rating");
        action.setValue(String.valueOf(rating));
        action.setExtraValue(ReviewRules.cleanText(submission.comment(), ReviewRules.MAX_COMMENT_LENGTH));
        action.setUpdatedAt(LocalDateTime.now());
        if (action.getCreatedAt() == null) action.setCreatedAt(LocalDateTime.now());
        Long reviewId = actions.save(action).getId();

        jdbc.update("INSERT INTO review_details (review_id, order_id, is_verified) VALUES (?, ?, 1) "
                + "ON DUPLICATE KEY UPDATE order_id = VALUES(order_id), is_verified = 1", reviewId, orderId);
        jdbc.update("DELETE FROM review_scores WHERE review_id = ?", reviewId);
        submission.scores().forEach((criterion, score) ->
                jdbc.update("INSERT INTO review_scores (review_id, criterion, score) VALUES (?, ?, ?)", reviewId, criterion, score));
        if (submission.media() != null) replaceMedia(reviewId, submission.media());

        meilisearchService.updateItemPopularityScoreAsync(item);
        int photoCount = jdbc.queryForObject("SELECT COUNT(*) FROM review_media WHERE review_id = ?", Integer.class, reviewId);
        int points = rewardService.grant(reviewId, userId, item.getTitle(), action.getExtraValue(), photoCount);
        return new SaveResult(null, points);
    }

    private void replaceMedia(Long reviewId, List<String> urls) {
        jdbc.update("DELETE FROM review_media WHERE review_id = ?", reviewId);
        for (int position = 0; position < urls.size(); position++) {
            jdbc.update("INSERT INTO review_media (review_id, url, sort_order) VALUES (?, ?, ?)", reviewId, urls.get(position), position);
        }
    }

    public boolean isOwnUrl(String url) {
        return s3Service.isOwnUrl(url);
    }

    /** The newest delivered order of this person for the course, or null when they never studied it. */
    public Long deliveredOrderId(Long userId, Long itemId) {
        List<Long> ids = jdbc.queryForList("SELECT MAX(od.order_id) FROM order_details od JOIN orders o ON o.id = od.order_id "
                + "WHERE od.user_id = ? AND od.item_id = ? AND o.status = 'delivered'", Long.class, userId, itemId);
        return ids.isEmpty() ? null : ids.get(0);
    }

    // ── Partner reply and moderation ─────────────────────────────────────────

    /** The partner (author of the course) or an admin answers a review. Returns the problem, or null when saved. */
    @Transactional
    public String reply(Long replierId, boolean isAdmin, Long itemId, Long reviewId, String text) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) return "Không tìm thấy khóa học";
        if (!isAdmin && !item.getUserId().equals(replierId)) return "Chỉ đối tác của khóa học này mới trả lời được";
        ItemUserAction review = reviewOf(itemId, reviewId);
        if (review == null) return "Không tìm thấy đánh giá";
        String reply = ReviewRules.cleanText(text, ReviewRules.MAX_REPLY_LENGTH);
        if (reply.isEmpty()) return "Nhập nội dung trả lời";

        jdbc.update("INSERT IGNORE INTO review_details (review_id) VALUES (?)", reviewId);
        jdbc.update("UPDATE review_details SET partner_reply = ?, partner_replied_at = NOW(), partner_replied_by = ? WHERE review_id = ?",
                reply, replierId, reviewId);
        if (!review.getUserId().equals(replierId)) {
            String partnerName = userRepository.findById(item.getUserId()).map(user -> user.getName()).orElse("Đối tác");
            notificationService.createNotification(review.getUserId(), "review_reply", partnerName + " đã trả lời đánh giá của bạn",
                    item.getTitle(), "/pdp", String.valueOf(itemId));
        }
        return null;
    }

    @Transactional
    public String deleteReply(Long replierId, boolean isAdmin, Long itemId, Long reviewId) {
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null) return "Không tìm thấy khóa học";
        if (!isAdmin && !item.getUserId().equals(replierId)) return "Chỉ đối tác của khóa học này mới sửa được";
        if (reviewOf(itemId, reviewId) == null) return "Không tìm thấy đánh giá";
        jdbc.update("UPDATE review_details SET partner_reply = NULL, partner_replied_at = NULL, partner_replied_by = NULL WHERE review_id = ?", reviewId);
        return null;
    }

    /** Shows or hides a review (admin). A hidden review leaves the list and the averages. */
    @Transactional
    public String setStatus(Long itemId, Long reviewId, String status) {
        if (!ReviewRules.isKnownStatus(status)) return "Trạng thái không hợp lệ";
        Item item = itemRepository.findById(itemId).orElse(null);
        if (item == null || reviewOf(itemId, reviewId) == null) return "Không tìm thấy đánh giá";
        jdbc.update("INSERT IGNORE INTO review_details (review_id) VALUES (?)", reviewId);
        jdbc.update("UPDATE review_details SET status = ? WHERE review_id = ?", status, reviewId);
        if (ReviewRules.HIDDEN.equals(status)) rewardService.revoke(reviewId);
        meilisearchService.updateItemPopularityScoreAsync(item);
        return null;
    }

    @Transactional
    public void delete(Long itemId, Long reviewId) {
        rewardService.revoke(reviewId);
        jdbc.update("DELETE FROM review_scores WHERE review_id = ?", reviewId);
        jdbc.update("DELETE FROM review_media WHERE review_id = ?", reviewId);
        jdbc.update("DELETE FROM review_details WHERE review_id = ?", reviewId);
        actions.deleteById(reviewId);
        itemRepository.findById(itemId).ifPresent(meilisearchService::updateItemPopularityScoreAsync);
    }

    private ItemUserAction reviewOf(Long itemId, Long reviewId) {
        return actions.findById(reviewId).filter(action -> "rating".equals(action.getType()) && itemId.equals(action.getItemId())).orElse(null);
    }

    // ── Reading ──────────────────────────────────────────────────────────────

    /** Reviews of a course, newest first. `stars` and `withPhotos` narrow the list; hidden ones only for the back office. */
    public List<Map<String, Object>> list(Long itemId, boolean includeHidden, Integer stars, boolean withPhotos) {
        StringBuilder sql = new StringBuilder(REVIEW_SELECT).append(" WHERE iua.item_id = ? AND iua.type = 'rating'");
        List<Object> args = new ArrayList<>(List.of(itemId));
        if (!includeHidden) sql.append(" AND COALESCE(d.status, 'published') = 'published'");
        if (stars != null) { sql.append(" AND CAST(iua.value AS UNSIGNED) = ?"); args.add(stars); }
        if (withPhotos) sql.append(" AND EXISTS (SELECT 1 FROM review_media m WHERE m.review_id = iua.id)");
        sql.append(" ORDER BY iua.id DESC");
        return withExtras(jdbc.queryForList(sql.toString(), args.toArray()));
    }

    private static final String REVIEW_SELECT = """
            SELECT iua.id, iua.item_id, iua.value, iua.extra_value, iua.created_at,
                   CASE WHEN u.name = 'Admin' THEN 'anyLEARN' ELSE u.name END AS user_name,
                   u.id AS user_id, u.image AS user_image,
                   COALESCE(d.is_verified, 0) AS is_verified, COALESCE(d.status, 'published') AS status,
                   d.partner_reply, d.partner_replied_at
            FROM item_user_actions iua
            JOIN users u ON u.id = iua.user_id
            LEFT JOIN review_details d ON d.review_id = iua.id
            """;

    private List<Map<String, Object>> withExtras(List<Map<String, Object>> rows) {
        if (rows.isEmpty()) return rows;
        List<Long> ids = rows.stream().map(row -> ((Number) row.get("id")).longValue()).toList();
        String in = ids.stream().map(id -> "?").collect(Collectors.joining(","));
        Map<Long, Map<String, Integer>> scores = new HashMap<>();
        jdbc.query("SELECT review_id, criterion, score FROM review_scores WHERE review_id IN (" + in + ")", rs -> {
            scores.computeIfAbsent(rs.getLong("review_id"), key -> new LinkedHashMap<>()).put(rs.getString("criterion"), rs.getInt("score"));
        }, ids.toArray());
        Map<Long, List<String>> media = new HashMap<>();
        jdbc.query("SELECT review_id, url FROM review_media WHERE review_id IN (" + in + ") ORDER BY sort_order, id", rs -> {
            media.computeIfAbsent(rs.getLong("review_id"), key -> new ArrayList<>()).add(rs.getString("url"));
        }, ids.toArray());
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            Map<String, Object> review = new LinkedHashMap<>(row);
            long id = ((Number) row.get("id")).longValue();
            review.put("is_verified", ((Number) row.get("is_verified")).intValue() == 1);
            review.put("scores", scores.getOrDefault(id, Map.of()));
            review.put("media", media.getOrDefault(id, List.of()));
            result.add(review);
        }
        return result;
    }

    /** Average, count, spread of stars, average per criterion and the latest photos of a course's published reviews. */
    public Map<String, Object> summary(Long itemId) {
        Map<String, Object> totals = jdbc.queryForMap("""
                SELECT COUNT(*) AS cnt, AVG(iua.value + 0) AS avg
                FROM item_user_actions iua LEFT JOIN review_details d ON d.review_id = iua.id
                WHERE iua.item_id = ? AND iua.type = 'rating' AND COALESCE(d.status, 'published') = 'published'
                """, itemId);
        return summaryOf(totals,
                "iua.item_id = ?", itemId);
    }

    /** The same numbers over every course of a partner. */
    public Map<String, Object> partnerSummary(Long partnerId) {
        Map<String, Object> totals = jdbc.queryForMap("""
                SELECT COUNT(*) AS cnt, AVG(iua.value + 0) AS avg
                FROM item_user_actions iua JOIN items i ON i.id = iua.item_id LEFT JOIN review_details d ON d.review_id = iua.id
                WHERE i.user_id = ? AND iua.type = 'rating' AND COALESCE(d.status, 'published') = 'published'
                """, partnerId);
        return summaryOf(totals, "iua.item_id IN (SELECT id FROM items WHERE user_id = ?)", partnerId);
    }

    private Map<String, Object> summaryOf(Map<String, Object> totals, String scope, Long id) {
        String published = " AND COALESCE(d.status, 'published') = 'published'";
        String from = " FROM item_user_actions iua LEFT JOIN review_details d ON d.review_id = iua.id WHERE " + scope
                + " AND iua.type = 'rating'" + published;
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("count", ((Number) totals.get("cnt")).longValue());
        summary.put("average", totals.get("avg") == null ? null : ((Number) totals.get("avg")).doubleValue());

        Map<Integer, Long> spread = new LinkedHashMap<>();
        for (int stars = 5; stars >= 1; stars--) spread.put(stars, 0L);
        jdbc.query("SELECT CAST(iua.value AS UNSIGNED) AS stars, COUNT(*) AS cnt" + from + " GROUP BY stars",
                rs -> { spread.put(rs.getInt("stars"), rs.getLong("cnt")); }, id);
        summary.put("distribution", spread);

        Map<String, Double> criteria = new LinkedHashMap<>();
        jdbc.query("SELECT s.criterion, AVG(s.score) AS avg FROM review_scores s JOIN item_user_actions iua ON iua.id = s.review_id "
                        + "LEFT JOIN review_details d ON d.review_id = iua.id WHERE " + scope + " AND iua.type = 'rating'" + published
                        + " GROUP BY s.criterion",
                rs -> { criteria.put(rs.getString("criterion"), rs.getDouble("avg")); }, id);
        Map<String, Double> ordered = new LinkedHashMap<>();
        ReviewRules.CRITERIA.forEach(criterion -> { if (criteria.containsKey(criterion)) ordered.put(criterion, criteria.get(criterion)); });
        summary.put("criteria", ordered);

        summary.put("photos", jdbc.queryForList("SELECT m.url FROM review_media m JOIN item_user_actions iua ON iua.id = m.review_id "
                + "LEFT JOIN review_details d ON d.review_id = iua.id WHERE " + scope + " AND iua.type = 'rating'" + published
                + " ORDER BY m.id DESC LIMIT 8", String.class, id));
        return summary;
    }

    /** The latest published reviews over all courses of a partner, with the course they are about. */
    public List<Map<String, Object>> partnerLatest(Long partnerId, int limit) {
        List<Map<String, Object>> rows = jdbc.queryForList(REVIEW_SELECT.replace("d.partner_reply, d.partner_replied_at",
                        "d.partner_reply, d.partner_replied_at, i.title AS item_title")
                        .replace("JOIN users u ON u.id = iua.user_id", "JOIN users u ON u.id = iua.user_id JOIN items i ON i.id = iua.item_id")
                + " WHERE i.user_id = ? AND iua.type = 'rating' AND COALESCE(d.status, 'published') = 'published' ORDER BY iua.id DESC LIMIT ?",
                partnerId, Math.min(limit, 30));
        return withExtras(rows);
    }
}
