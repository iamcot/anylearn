package com.anylearn.backend.service.milestone;

import com.anylearn.backend.entity.Transaction;
import com.anylearn.backend.repository.ConfigurationRepository;
import com.anylearn.backend.repository.TransactionRepository;
import com.anylearn.backend.service.NotificationService;
import com.anylearn.backend.service.WalletService;
import com.anylearn.backend.service.foundation.FoundationService;
import com.anylearn.backend.service.fun.CoinService;
import com.anylearn.backend.service.fun.FunSettings;
import com.anylearn.backend.service.fun.GameEventService;
import com.anylearn.backend.service.settings.NumberSettings;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

/**
 * First-order reward and referral paid on purchase (plan 21). When an account's first order is paid it gets
 * anyPoint (within a budget of rewarded accounts) and Leo Xu; when that account was invited, the buyer and the
 * inviter each get anyPoint, Leo Xu and a Foundation brick in their name. Each reward is a row of
 * `milestone_rewards` (unique per account, kind and reference) so nothing is paid twice.
 */
@Service
@Slf4j
public class MilestoneService {

    public static final String FIRST_ORDER = "first_order";
    public static final String REFERRAL_BUYER = "referral_buyer";
    public static final String REFERRAL_INVITER = "referral_inviter";
    public static final String TX_FIRST_ORDER = "first_order_bonus";
    public static final String TX_REFERRAL = "referral_purchase_bonus";

    private final JdbcTemplate jdbc;
    private final Clock clock;
    private final NumberSettings settings;

    @Autowired(required = false) private WalletService wallet;
    @Autowired(required = false) private TransactionRepository transactions;
    @Autowired(required = false) private CoinService coins;
    @Autowired(required = false) private FunSettings funSettings;
    @Autowired(required = false) private FoundationService foundation;
    @Autowired(required = false) private NotificationService notifications;
    @Autowired(required = false) private GameEventService events;

    public MilestoneService(JdbcTemplate jdbc, Clock clock, ConfigurationRepository configurationRepository) {
        this.jdbc = jdbc;
        this.clock = clock;
        this.settings = new NumberSettings("milestone", configurationRepository)
                .field("first_order_points", "anyPoint thưởng đơn đầu tiên", "Đơn đầu tiên", 0, 0, 100_000)
                .field("first_order_coins", "Leo Xu thưởng đơn đầu tiên", "Đơn đầu tiên", 300, 0, 100_000)
                .field("first_order_budget", "Số người đầu tiên được thưởng anyPoint (0 = không giới hạn)", "Đơn đầu tiên", 50, 0, 1_000_000)
                .field("referral_points", "anyPoint cho mỗi người khi bạn được mời mua đơn đầu", "Giới thiệu", 0, 0, 100_000)
                .field("referral_coins", "Leo Xu cho mỗi người khi bạn được mời mua đơn đầu", "Giới thiệu", 300, 0, 100_000)
                .field("referral_foundation", "Góp quỹ Foundation đứng tên mỗi người (đ)", "Giới thiệu", 10_000, 0, 10_000_000);
    }

    public NumberSettings settings() { return settings; }

    private Timestamp now() { return Timestamp.valueOf(LocalDateTime.now(clock)); }

    /** Called after an order is paid. Never throws. */
    public void onOrderPaid(long orderId, long buyerId, boolean firstOrder) {
        if (!firstOrder) return;
        try {
            firstOrderReward(orderId, buyerId);
            referralReward(orderId, buyerId);
        } catch (Exception e) {
            log.warn("[milestone] order {} rewards failed: {}", orderId, e.getMessage());
        }
    }

    private void firstOrderReward(long orderId, long buyerId) {
        int points = settings.getInt("first_order_points");
        long budget = settings.get("first_order_budget");
        if (points > 0 && budget > 0) {
            Long given = jdbc.queryForObject("SELECT COUNT(*) FROM milestone_rewards WHERE kind = ? AND points > 0", Long.class, FIRST_ORDER);
            if (given != null && given >= budget) points = 0;
        }
        int coinAmount = settings.getInt("first_order_coins");
        if (!claim(buyerId, FIRST_ORDER, orderId, points, coinAmount)) return;
        pay(buyerId, points, coinAmount, TX_FIRST_ORDER, orderId, "Thưởng đơn hàng đầu tiên #" + orderId);
        tell(buyerId, "Chúc mừng đơn hàng đầu tiên!", rewardText(points, coinAmount) + " Cảm ơn bạn đã tin chọn anyLEARN.", "/order/" + orderId);
    }

    private void referralReward(long orderId, long buyerId) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT b.user_id AS inviter, COALESCE(b.is_child, 0) AS child, i.is_child AS inviter_child, i.status AS inviter_status "
                        + "FROM users b JOIN users i ON i.id = b.user_id WHERE b.id = ?", buyerId);
        if (rows.isEmpty()) return;
        Map<String, Object> r = rows.get(0);
        if (((Number) r.get("child")).intValue() == 1) return;
        if (r.get("inviter_child") != null && ((Number) r.get("inviter_child")).intValue() == 1) return;
        long inviterId = ((Number) r.get("inviter")).longValue();
        if (inviterId == buyerId) return;
        int points = settings.getInt("referral_points");
        int coinAmount = settings.getInt("referral_coins");
        long brick = settings.get("referral_foundation");
        if (claim(buyerId, REFERRAL_BUYER, orderId, points, coinAmount)) {
            pay(buyerId, points, coinAmount, TX_REFERRAL, orderId, "Thưởng mua đơn đầu qua lời mời");
            if (foundation != null && brick > 0) foundation.milestone(buyerId, brick, "ref-buyer:" + buyerId, "Bạn được mời mua đơn đầu");
        }
        if (claim(inviterId, REFERRAL_INVITER, buyerId, points, coinAmount)) {
            pay(inviterId, points, coinAmount, TX_REFERRAL, orderId, "Thưởng giới thiệu: bạn của bạn mua đơn đầu");
            if (foundation != null && brick > 0) foundation.milestone(inviterId, brick, "ref-inviter:" + buyerId, "Bạn được mời mua đơn đầu");
            tell(inviterId, "Bạn của bạn vừa mua khóa học đầu tiên", rewardText(points, coinAmount) + " Cảm ơn bạn đã giới thiệu anyLEARN.", "/account/rewards");
        }
    }

    private boolean claim(long userId, String kind, long refId, int points, int coinAmount) {
        return jdbc.update("INSERT IGNORE INTO milestone_rewards (user_id, kind, ref_id, points, coins, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                userId, kind, refId, points, coinAmount, now()) == 1;
    }

    private void pay(long userId, int points, int coinAmount, String txType, long orderId, String content) {
        if (points > 0 && wallet != null && transactions != null) {
            Transaction tx = new Transaction();
            tx.setUserId(userId);
            tx.setType(txType);
            tx.setAmount((long) points);
            tx.setPayMethod("wallet_c");
            tx.setOrderId(orderId);
            tx.setContent(content);
            tx.setStatus(1);
            tx.setCreatedAt(LocalDateTime.now(clock));
            tx.setUpdatedAt(LocalDateTime.now(clock));
            transactions.save(tx);
            wallet.creditWalletC(userId, points);
        }
        if (coinAmount > 0 && coins != null) coins.credit(userId, coinAmount, CoinService.SOURCE_MILESTONE, content);
        if (events != null) events.record(userId, "milestone", txType, content, coinAmount);
    }

    private String rewardText(int points, int coinAmount) {
        String coinName = funSettings != null ? funSettings.coinName() : "Leo Xu";
        List<String> parts = new ArrayList<>();
        if (points > 0) parts.add(points + " anyPoint");
        if (coinAmount > 0) parts.add(coinAmount + " " + coinName);
        return parts.isEmpty() ? "" : "Bạn nhận " + String.join(" và ", parts) + ".";
    }

    private void tell(long userId, String title, String body, String route) {
        try {
            if (notifications != null) notifications.createNotification(userId, "milestone_reward", title, body.trim(), route);
        } catch (Exception e) {
            log.warn("[milestone] notification to {} failed: {}", userId, e.getMessage());
        }
    }

    /** Rewards an order gave (for the order page and Leo's coin animation). */
    public List<Map<String, Object>> ofOrder(long orderId, long userId) {
        return jdbc.queryForList("SELECT kind, points, coins FROM milestone_rewards WHERE user_id = ? AND ref_id = ? AND kind IN (?, ?)",
                userId, orderId, FIRST_ORDER, REFERRAL_BUYER);
    }

    public Map<String, Object> report() {
        return Map.of("byKind", jdbc.queryForList("SELECT kind, COUNT(*) AS times, COALESCE(SUM(points), 0) AS points, COALESCE(SUM(coins), 0) AS coins FROM milestone_rewards GROUP BY kind"),
                "settings", settings.asMap());
    }
}
