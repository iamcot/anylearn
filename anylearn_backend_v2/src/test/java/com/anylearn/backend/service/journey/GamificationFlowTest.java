package com.anylearn.backend.service.journey;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.CartService;
import com.anylearn.backend.service.foundation.FoundationService;
import com.anylearn.backend.service.guestquiz.GuestQuizService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Plan 21 against the real schema (needs MySQL or MariaDB like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class GamificationFlowTest {

    @Autowired JourneyService journey;
    @Autowired FoundationService foundation;
    @Autowired GuestQuizService guestQuiz;
    @Autowired CartService cart;
    @Autowired PaymentApprovalService approvals;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @Autowired jakarta.persistence.EntityManager em;

    private long member(Long invitedBy) {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, dob, wallet_c, user_id, created_at) VALUES ('Me Bin', ?, ?, 'x', 'member', '1990-01-01', 0, ?, NOW())", phone, phone, invitedBy);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    private long course(long price) {
        String phone = "08" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Trung tam', ?, ?, 'x', 'school', NOW())", phone, phone);
        long partner = jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
        jdbc.update("INSERT INTO items (user_id, title, type, subtype, status, user_status, price) VALUES (?, 'Khoa thu', 'class', 'online', 1, 1, ?)", partner, price);
        return jdbc.queryForObject("SELECT MAX(id) FROM items", Long.class);
    }

    private long coins(long userId) {
        em.flush();
        Long b = jdbc.queryForObject("SELECT COALESCE(SUM(delta), 0) FROM fun_coin_ledger WHERE user_id = ?", Long.class, userId);
        return b == null ? 0 : b;
    }

    private User user(long id) { return users.findById(id).orElseThrow(); }

    private long buyAndPay(long me, long item) {
        jdbc.update("INSERT INTO item_user_actions (item_id, user_id, type, value, created_at, updated_at) VALUES (?, ?, 'cart', '1', NOW(), NOW())", item, me);
        Map<String, Object> res = cart.checkout("bank_transfer", null, null, 0, user(me));
        long orderId = Long.parseLong((String) res.get("orderId"));
        approvals.approveOrder(orderId, "bank_transfer");
        em.flush();
        return orderId;
    }

    @Test
    void aMissionAndItsChapterPayOnceAndChapterFourWaitsForTheFirstOrder() {
        long me = member(null);
        assertTrue(journey.claim(me).get("rewards") instanceof List<?> l && l.isEmpty());

        String childPhone = "07" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, is_child, user_id, dob, created_at) VALUES ('Bin', ?, ?, 'x', 'member', 1, ?, '2018-05-01', NOW())", childPhone, childPhone, me);
        List<?> first = (List<?>) journey.claim(me).get("rewards");
        assertEquals(1, first.size());
        assertEquals("add_child", ((Map<?, ?>) first.get(0)).get("key"));
        assertEquals(50L, coins(me));
        assertTrue(((List<?>) journey.claim(me).get("rewards")).isEmpty(), "paid once");

        Map<String, Object> view = journey.view(me);
        Map<?, ?> next = (Map<?, ?>) view.get("next");
        assertEquals("interests", next.get("key"));
        List<?> chapters = (List<?>) view.get("chapters");
        assertEquals(false, ((Map<?, ?>) chapters.get(3)).get("open"), "chapter 4 opens after the first order");

        Map<String, Object> visitor = journey.view(null);
        assertEquals(false, visitor.get("signedIn"));
        assertNull(visitor.get("next"));
    }

    @Test
    void theAppSignalsAreRecordedOncePerType() {
        long me = member(null);
        assertTrue(journey.recordEvent(me, "compare"));
        assertFalse(journey.recordEvent(me, "compare"));
        assertFalse(journey.recordEvent(me, "hack"));
        assertTrue(journey.done(me).contains("compare"));
    }

    @Test
    void foundationFinishesAHouseAndALowerValueFinishesItAtTheNextContribution() {
        Map<String, Object> before = jdbc.queryForMap("SELECT houses_built, current_amount FROM foundation_state WHERE id = 1");
        int built = ((Number) before.get("houses_built")).intValue();
        long value = foundation.settings().get("house_value");
        long current = ((Number) before.get("current_amount")).longValue();
        foundation.contribute(null, FoundationService.SOURCE_SEED, value - current - 1, null, null, "test");
        assertEquals(built, jdbc.queryForObject("SELECT houses_built FROM foundation_state WHERE id = 1", Integer.class));
        assertEquals(5, foundation.contribute(null, FoundationService.SOURCE_SEED, 5, null, "dup-key", "x"));
        assertEquals(0, foundation.contribute(null, FoundationService.SOURCE_SEED, 5, null, "dup-key", "x"), "dedup key counts once");
        assertEquals(built + 1, jdbc.queryForObject("SELECT houses_built FROM foundation_state WHERE id = 1", Integer.class));
        assertEquals(4L, jdbc.queryForObject("SELECT current_amount FROM foundation_state WHERE id = 1", Long.class));
    }

    @Test
    void ordersPaidBeforeTheFoundationAreImportedOnceInTheBuyersName() {
        long me = member(null);
        long portalBuyer = member(null);
        long v2Order = buyAndPay(me, course(500_000));
        long portalOrder = buyAndPay(portalBuyer, course(2_400_000));
        // Make them look like orders from before V78: no contribution yet, foundation rows written the old ways.
        jdbc.update("DELETE FROM foundation_contributions WHERE dedup_key IN (?, ?)", "order:" + v2Order, "order:" + portalOrder);
        jdbc.update("DELETE FROM transactions WHERE type = 'foundation' AND order_id IN (SELECT id FROM order_details WHERE order_id IN (?, ?))", v2Order, portalOrder);
        long v2Line = jdbc.queryForObject("SELECT MIN(id) FROM order_details WHERE order_id = ?", Long.class, v2Order);
        long portalLine = jdbc.queryForObject("SELECT MIN(id) FROM order_details WHERE order_id = ?", Long.class, portalOrder);
        jdbc.update("INSERT INTO transactions (user_id, type, amount, pay_method, order_id, content, status, created_at, updated_at) VALUES (?, 'foundation', 8, 'wallet_c', ?, 'Quỹ vận hành', 99, '2026-10-31 02:43:57', NOW())", me, v2Line);
        jdbc.update("INSERT INTO transactions (user_id, ref_user_id, type, amount, ref_amount, pay_method, order_id, content, status, created_at, updated_at) VALUES (0, ?, 'foundation', 24000, 2400000, 'wallet_m', ?, 'Nhận quỹ', 1, '2025-09-20 22:37:53', NOW())", portalBuyer, portalLine);

        Map<String, Object> onlyV2 = foundation.importOldOrders(false, false);
        assertEquals(0, onlyV2.get("portalOrders"));
        assertTrue(((Number) onlyV2.get("v2Orders")).intValue() >= 1);
        Map<String, Object> preview = foundation.importOldOrders(true, false);
        assertTrue(((Number) preview.get("portalOrders")).intValue() >= 1);
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM foundation_contributions WHERE dedup_key = ?", Integer.class, "order:" + v2Order), "preview writes nothing");

        long totalBefore = jdbc.queryForObject("SELECT total_amount FROM foundation_state WHERE id = 1", Long.class);
        Map<String, Object> done = foundation.importOldOrders(true, true);
        assertEquals(done.get("amount"), done.get("added"));
        Map<String, Object> v2Row = jdbc.queryForMap("SELECT user_id, amount, created_at FROM foundation_contributions WHERE dedup_key = ?", "order:" + v2Order);
        assertEquals(me, ((Number) v2Row.get("user_id")).longValue());
        long rate = Math.round(Double.parseDouble(jdbc.queryForList("SELECT value FROM configurations WHERE `key` = 'bonus_rate'", String.class).stream().findFirst().orElse("1000")));
        assertEquals(8 * rate, ((Number) v2Row.get("amount")).longValue(), "anyPoint × bonus_rate");
        assertTrue(String.valueOf(v2Row.get("created_at")).startsWith("2026-10-31"), "keeps the order's date");
        Map<String, Object> portalRow = jdbc.queryForMap("SELECT user_id, amount FROM foundation_contributions WHERE dedup_key = ?", "order:" + portalOrder);
        assertEquals(portalBuyer, ((Number) portalRow.get("user_id")).longValue());
        assertEquals(24000L, ((Number) portalRow.get("amount")).longValue(), "portal rows are already VND");
        assertEquals(totalBefore + ((Number) done.get("added")).longValue(), jdbc.queryForObject("SELECT total_amount FROM foundation_state WHERE id = 1", Long.class));

        assertEquals(0L, ((Number) foundation.importOldOrders(true, true).get("added")).longValue(), "an order is imported once");
    }

    @Test
    void firstPaidOrderRewardsTheBuyerAndTheInviterAndOpensChapterFour() {
        long inviter = member(null);
        long me = member(inviter);
        long orderId = buyAndPay(me, course(500_000));

        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM milestone_rewards WHERE user_id = ? AND kind = 'first_order'", Integer.class, me));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM milestone_rewards WHERE user_id = ? AND kind = 'referral_inviter'", Integer.class, inviter));
        assertTrue(coins(me) >= 600, "first order 300 + referral 300");
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM foundation_contributions WHERE user_id = ? AND source = 'milestone'", Integer.class, inviter));

        Map<String, Object> order = cart.getOrder(String.valueOf(orderId), user(me));
        assertNotNull(order.get("rewards"));

        Map<String, Object> view = journey.view(me);
        assertEquals(true, view.get("hasOrder"));
        assertEquals(true, ((Map<?, ?>) ((List<?>) view.get("chapters")).get(3)).get("open"));
        assertTrue(journey.done(inviter).contains("invite"));
        assertTrue(journey.done(inviter).contains("friend_buys"));

        // a second paid order is not a first order
        buyAndPay(me, course(200_000));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM milestone_rewards WHERE user_id = ? AND kind = 'first_order'", Integer.class, me));
    }

    @Test
    void guestQuizSignupCoinsArePaidOnce() {
        long me = member(null);
        assertEquals(100, guestQuiz.onSignup(me));
        assertEquals(0, guestQuiz.onSignup(me));
        assertEquals(100L, coins(me));
    }
}
