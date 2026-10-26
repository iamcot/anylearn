package com.anylearn.backend.service.reviews;

import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * anyPoint for a review (plan 09.6). One row of `review_rewards` per review keeps what was given, so editing a review
 * never pays twice: a later photo adds only the photo part. A hidden or deleted review gives the points back.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewRewardService {

    public static final String TYPE_REWARD = "review_reward";
    public static final String TYPE_REVOKE = "review_reward_revoke";

    private final JdbcTemplate jdbc;
    private final ReviewSettings settings;
    private final WalletService walletService;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /** Gives what the review has earned and was not given yet. Returns the points given now (0 when nothing). */
    @Transactional
    public int grant(Long reviewId, Long userId, String courseTitle, String comment, int photoCount) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT text_points, media_points, revoked_at FROM review_rewards WHERE review_id = ? FOR UPDATE", reviewId);
        Map<String, Object> given = rows.isEmpty() ? null : rows.get(0);
        if (given != null && given.get("revoked_at") != null) return 0;

        int textEarned = ReviewRewardRules.textPoints(comment, settings.pointsForText());
        int mediaEarned = ReviewRewardRules.mediaPoints(photoCount, settings.pointsForMedia());
        int textGiven = given == null ? 0 : ((Number) given.get("text_points")).intValue();
        int mediaGiven = given == null ? 0 : ((Number) given.get("media_points")).intValue();
        int textNow = ReviewRewardRules.toGrant(textEarned, textGiven);
        int mediaNow = ReviewRewardRules.toGrant(mediaEarned, mediaGiven);
        int total = textNow + mediaNow;
        if (total == 0) return 0;

        if (given == null) {
            jdbc.update("INSERT INTO review_rewards (review_id, user_id, text_points, media_points) VALUES (?, ?, ?, ?)",
                    reviewId, userId, textNow, mediaNow);
        } else {
            jdbc.update("UPDATE review_rewards SET text_points = text_points + ?, media_points = media_points + ? WHERE review_id = ?",
                    textNow, mediaNow, reviewId);
        }
        record(userId, TYPE_REWARD, total, "Thưởng đánh giá khóa " + courseTitle);
        walletService.creditWalletC(userId, total);
        notifySafely(userId, "Nhận " + total + " anyPoint", "Cảm ơn bạn đã đánh giá khóa " + courseTitle);
        return total;
    }

    /** Takes back what a review earned (it was hidden or deleted). The balance never goes below zero. */
    @Transactional
    public int revoke(Long reviewId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT user_id, text_points, media_points FROM review_rewards WHERE review_id = ? AND revoked_at IS NULL FOR UPDATE", reviewId);
        if (rows.isEmpty()) return 0;
        Map<String, Object> row = rows.get(0);
        Long userId = ((Number) row.get("user_id")).longValue();
        int given = ((Number) row.get("text_points")).intValue() + ((Number) row.get("media_points")).intValue();
        long balance = userRepository.findById(userId).map(user -> user.getWalletC() == null ? 0L : user.getWalletC()).orElse(0L);
        int taken = (int) Math.min(given, balance);
        jdbc.update("UPDATE review_rewards SET revoked_at = NOW(), revoked_points = ? WHERE review_id = ?", taken, reviewId);
        if (taken > 0) {
            walletService.debitWalletC(userId, taken);
            record(userId, TYPE_REVOKE, -taken, "Thu hồi anyPoint thưởng đánh giá (đánh giá bị ẩn)");
        }
        return taken;
    }

    private void record(Long userId, String type, long amount, String content) {
        Transaction tx = new Transaction();
        tx.setUserId(userId);
        tx.setType(type);
        tx.setAmount(amount);
        tx.setPayMethod("wallet_c");
        tx.setContent(content);
        tx.setStatus(1);
        tx.setCreatedAt(LocalDateTime.now());
        tx.setUpdatedAt(LocalDateTime.now());
        transactionRepository.save(tx);
    }

    private void notifySafely(Long userId, String title, String content) {
        try {
            notificationService.createNotification(userId, "system_notif", title, content, "/account/anypoint", null);
        } catch (Exception e) {
            log.warn("[reviewReward] notification to {} failed: {}", userId, e.getMessage());
        }
    }
}
