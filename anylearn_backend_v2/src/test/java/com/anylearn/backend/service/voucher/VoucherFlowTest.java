package com.anylearn.backend.service.voucher;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.CartService;
import com.anylearn.backend.service.payment.PaymentApprovalService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Plan 20 against the real schema (needs MySQL or MariaDB like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class VoucherFlowTest {

    @Autowired VoucherService vouchers;
    @Autowired VoucherAdminService admin;
    @Autowired CartService cart;
    @Autowired PaymentApprovalService approvals;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @Autowired jakarta.persistence.EntityManager em;
    @Autowired com.anylearn.backend.service.partners.FollowService follows;
    @Autowired com.anylearn.backend.service.shop.ShopService shop;
    @Autowired com.anylearn.backend.service.fun.CoinService coins;
    @Autowired com.anylearn.backend.service.journey.JourneyService journey;

    private long walletC(long id) {
        em.flush();
        return jdbc.queryForObject("SELECT wallet_c FROM users WHERE id = ?", Long.class, id);
    }

    private long member() {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, dob, wallet_c, created_at) VALUES ('Me Bin', ?, ?, 'x', 'member', '1990-01-01', 100, NOW())", phone, phone);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    private long course(long price) {
        String phone = "08" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Trung tam', ?, ?, 'x', 'school', NOW())", phone, phone);
        long partner = jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
        jdbc.update("INSERT INTO items (user_id, title, type, subtype, status, user_status, price) VALUES (?, 'Khoa thu', 'class', 'online', 1, 1, ?)", partner, price);
        return jdbc.queryForObject("SELECT MAX(id) FROM items", Long.class);
    }

    private void addToCart(long userId, long itemId) {
        jdbc.update("INSERT INTO item_user_actions (item_id, user_id, type, value, created_at, updated_at) VALUES (?, ?, 'cart', '1', NOW(), NOW())", itemId, userId);
    }

    private long group(Map<String, Object> body) {
        return admin.saveGroup(null, body);
    }

    private User user(long id) { return users.findById(id).orElseThrow(); }

    @Test
    void checkoutTakesTheWalletVoucherAndTheAnyPointOffTheAmountAndCancelGivesThemBack() {
        long me = member();
        long a = course(300_000), b = course(500_000);
        addToCart(me, a);
        addToCart(me, b);
        long g = group(Map.of("title", "Giảm 50k khóa B", "value", 50_000, "generateType", "auto", "prefix", "TST", "itemIds", List.of(b)));
        Long wallet = vouchers.issue(me, g, VoucherService.SOURCE_ADMIN, null);
        assertNotNull(wallet);

        List<Map<String, Object>> forCart = vouchers.wallet(me, cart.voucherLines(user(me)));
        assertEquals(50_000L, ((Number) forCart.get(0).get("discount")).longValue());
        assertNull(forCart.get(0).get("problem"));

        Map<String, Object> res = cart.checkout("bank_transfer", null, wallet, 30, user(me));
        long orderId = Long.parseLong((String) res.get("orderId"));
        // 800,000 - 50,000 voucher - 30 anyPoint × 1,000
        assertEquals(720_000L, jdbc.queryForObject("SELECT amount FROM orders WHERE id = ?", Long.class, orderId));
        assertEquals(70L, walletC(me));
        assertEquals("used", jdbc.queryForObject("SELECT status FROM user_vouchers WHERE id = ?", String.class, wallet));
        assertEquals(50_000L, vouchers.discountOfOrder(orderId));
        Map<String, Object> view = cart.getOrder(String.valueOf(orderId), user(me));
        assertEquals(50_000L, ((Number) view.get("voucherDiscount")).longValue());
        assertEquals(30L, ((Number) view.get("pointsUsed")).longValue());

        approvals.cancelOrder(orderId, "buyer");
        assertEquals("active", jdbc.queryForObject("SELECT status FROM user_vouchers WHERE id = ?", String.class, wallet));
        assertEquals(0L, vouchers.discountOfOrder(orderId));
        assertEquals(100L, walletC(me));
    }

    @Test
    void aPercentVoucherTakesItsShareOfTheCoveredLinesUpToItsCap() {
        long me = member();
        long a = course(300_000), b = course(2_000_000);
        addToCart(me, a);
        addToCart(me, b);
        long capped = group(Map.of("title", "Giảm 10%", "type", "percent", "value", 10, "maxDiscount", 150_000,
                "generateType", "auto", "prefix", "PCT"));
        long onlyA = group(Map.of("type", "percent", "value", 20, "generateType", "auto", "prefix", "PCA", "itemIds", List.of(a)));
        Long w1 = vouchers.issue(me, capped, VoucherService.SOURCE_ADMIN, null);
        Long w2 = vouchers.issue(me, onlyA, VoucherService.SOURCE_ADMIN, null);
        Map<Long, Map<String, Object>> byId = new java.util.HashMap<>();
        for (Map<String, Object> v : vouchers.wallet(me, cart.voucherLines(user(me)))) byId.put(((Number) v.get("id")).longValue(), v);
        assertEquals(150_000L, ((Number) byId.get(w1).get("discount")).longValue(), "10% of 2.3M is 230K, capped at 150K");
        assertEquals("percent", byId.get(w1).get("kind"));
        assertEquals(150_000L, ((Number) byId.get(w1).get("maxDiscount")).longValue());
        assertEquals("Giảm 10%", byId.get(w1).get("title"));
        assertEquals(60_000L, ((Number) byId.get(w2).get("discount")).longValue(), "20% of course A only");

        Map<String, Object> res = cart.checkout("bank_transfer", null, w1, 0, user(me));
        long orderId = Long.parseLong((String) res.get("orderId"));
        assertEquals(2_150_000L, jdbc.queryForObject("SELECT amount FROM orders WHERE id = ?", Long.class, orderId));
        assertEquals(150_000L, vouchers.discountOfOrder(orderId));

        assertThrows(IllegalArgumentException.class, () -> group(Map.of("type", "percent", "value", 120, "generateType", "manual")));
    }

    @Test
    void aLeoXuVoucherIsBoughtOnceThenAgainOnlyAfterTheRebuyDaysFromItsUse() {
        long me = member();
        long a = course(300_000);
        addToCart(me, a);
        assertThrows(IllegalArgumentException.class, () -> group(Map.of("title", "Tĩnh", "value", 20_000, "generateType", "manual",
                "coinExchange", true, "coinPrice", 100)), "a fixed code cannot be sold for coins");
        assertThrows(IllegalArgumentException.class, () -> group(Map.of("title", "Không giá", "value", 20_000, "generateType", "auto",
                "prefix", "LEO", "coinExchange", true)));
        long g = group(Map.of("title", "Giảm 20k", "value", 20_000, "generateType", "auto", "prefix", "LEO",
                "coinExchange", true, "coinPrice", 100, "coinRebuyDays", 30));
        String key = "voucher:" + g;
        coins.credit(me, 250, com.anylearn.backend.service.fun.CoinService.SOURCE_ADMIN, "test");

        @SuppressWarnings("unchecked")
        Map<String, Object> listed = vouchers.collectible(me, "home", null, null).stream()
                .filter(v -> ((Number) v.get("groupId")).longValue() == g).findFirst().orElseThrow();
        assertEquals(100, ((Number) ((Map<String, Object>) listed.get("coin")).get("price")).intValue(), "shown in the usual voucher spots");
        assertThrows(IllegalArgumentException.class, () -> vouchers.collect(me, g), "not free to save");

        Map<String, Object> offer = shopVoucher(me, g);
        assertEquals(true, offer.get("canBuy"));
        assertEquals(100, ((Number) offer.get("price")).intValue());

        Map<String, Object> res = shop.buy(me, key, null);
        assertEquals(150L, ((Number) res.get("coins")).longValue());
        long walletId = ((Number) res.get("walletId")).longValue();
        assertEquals("shop", jdbc.queryForObject("SELECT source FROM user_vouchers WHERE id = ?", String.class, walletId));
        assertEquals(true, vouchers.wallet(me, null).get(0).get("leo"));
        assertTrue(journey.done(me).contains("leo_voucher"));
        // holding an unused copy: cannot buy a second one
        IllegalStateException again = assertThrows(IllegalStateException.class, () -> shop.buy(me, key, null));
        assertTrue(again.getMessage().contains("dùng xong"));
        assertEquals(150L, coins.balance(me));

        // used at checkout: the next copy opens 30 days after the use
        long orderId = Long.parseLong((String) cart.checkout("bank_transfer", null, walletId, 0, user(me)).get("orderId"));
        assertEquals(280_000L, jdbc.queryForObject("SELECT amount FROM orders WHERE id = ?", Long.class, orderId));
        assertEquals(false, shopVoucher(me, g).get("canBuy"));
        assertNotNull(shopVoucher(me, g).get("nextAt"));
        assertTrue(assertThrows(IllegalStateException.class, () -> shop.buy(me, key, null)).getMessage().startsWith("Đổi lại được từ"));

        jdbc.update("UPDATE user_vouchers SET used_at = DATE_SUB(used_at, INTERVAL 31 DAY) WHERE id = ?", walletId);
        assertEquals(true, shopVoucher(me, g).get("canBuy"));
        shop.buy(me, key, null);
        assertEquals(50L, coins.balance(me));
        // not enough coins for a third one (after using the second)
        jdbc.update("UPDATE user_vouchers SET status = 'used', used_at = DATE_SUB(NOW(), INTERVAL 40 DAY) WHERE user_id = ? AND voucher_group_id = ?", me, g);
        assertTrue(assertThrows(IllegalStateException.class, () -> shop.buy(me, key, null)).getMessage().contains("chưa đủ"));
        assertEquals(50L, coins.balance(me));
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> shopVoucher(long me, long groupId) {
        List<Map<String, Object>> items = (List<Map<String, Object>>) shop.voucherOffers(me).get("items");
        return (Map<String, Object>) items.stream().filter(e -> ("voucher:" + groupId).equals(e.get("key"))).findFirst().orElseThrow().get("voucher");
    }

    @Test
    void anyPointNeverPaysMoreThanTheAmountAndOnlyWhatIsNeededIsTaken() {
        long me = member();
        addToCart(me, course(20_000));
        Map<String, Object> res = cart.checkout("bank_transfer", null, null, 100, user(me));
        long orderId = Long.parseLong((String) res.get("orderId"));
        assertEquals(0L, jdbc.queryForObject("SELECT amount FROM orders WHERE id = ?", Long.class, orderId));
        assertEquals(80L, walletC(me));
    }

    @Test
    void aVoucherForOtherCoursesOrAnUsedCodeStopsTheCheckout() {
        long me = member();
        long a = course(300_000);
        addToCart(me, a);
        long g = group(Map.of("value", 50_000, "generateType", "manual", "itemIds", List.of(a + 999)));
        vouchers.addFixedCode(g, "TEST-ONLY-B", 10, null);
        var ex = assertThrows(IllegalArgumentException.class, () -> cart.checkout("bank_transfer", "TEST-ONLY-B", null, null, user(me)));
        assertTrue(ex.getMessage().contains("một số khóa học"));
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM orders WHERE user_id = ?", Long.class, me));

        long g2 = group(Map.of("value", 20_000, "generateType", "manual"));
        vouchers.addFixedCode(g2, "TEST-ONCE", 10, null);
        cart.checkout("bank_transfer", "TEST-ONCE", null, null, user(me));
        addToCart(me, a);
        var again = assertThrows(IllegalArgumentException.class, () -> cart.checkout("bank_transfer", "TEST-ONCE", null, null, user(me)));
        assertEquals("Bạn đã dùng mã này rồi", again.getMessage());
    }

    @Test
    void eventsFillTheWalletOncePerPersonAndCollectingIsOncePerGroup() {
        long me = member();
        long g = group(Map.of("title", "Chào bạn mới", "value", 30_000, "generateType", "auto", "prefix", "HI", "walletDays", 30));
        admin.saveEvent(null, Map.of("type", "register", "title", "Tặng khi đăng ký", "groupIds", List.of(g)));
        assertEquals(1, vouchers.fire("register", me, 0));
        assertEquals(0, vouchers.fire("register", me, 0));
        List<Map<String, Object>> w = vouchers.wallet(me, null);
        assertEquals(1, w.size());
        assertEquals("active", w.get(0).get("state"));
        assertNotNull(w.get(0).get("expiresAt"));
        assertTrue(((String) w.get(0).get("code")).startsWith("HI"));

        long item = course(100_000);
        long g2 = group(Map.of("value", 10_000, "generateType", "auto", "prefix", "BUY"));
        admin.saveEvent(null, Map.of("type", "buy_item", "title", "Mua khóa", "trigger", item, "groupIds", List.of(g2)));
        assertEquals(0, vouchers.fire("buy_item", me, item + 1));
        assertEquals(1, vouchers.fire("buy_item", me, item));

        long g3 = group(Map.of("value", 10_000, "generateType", "auto", "prefix", "GET", "qtt", 1, "collectible", true));
        assertTrue(vouchers.collectible(me, "home", null, null).stream().anyMatch(c -> ((Number) c.get("groupId")).longValue() == g3));
        vouchers.collect(me, g3);
        assertThrows(IllegalArgumentException.class, () -> vouchers.collect(me, g3));
        long other = member();
        var gone = assertThrows(IllegalArgumentException.class, () -> vouchers.collect(other, g3));
        assertTrue(gone.getMessage().contains("hết lượt"));
        assertEquals(3, vouchers.activeCount(me));
    }

    @Test
    void aTypedCodeCanBeSavedToTheWallet() {
        long me = member();
        long g = group(Map.of("value", 15_000, "generateType", "manual"));
        vouchers.addFixedCode(g, "TEST-FANPAGE", 100, null);
        vouchers.addCode(me, "TEST-FANPAGE");
        assertThrows(IllegalArgumentException.class, () -> vouchers.addCode(me, "TEST-FANPAGE"));
        assertThrows(IllegalArgumentException.class, () -> vouchers.addCode(me, "NO-SUCH-CODE"));
        assertEquals(1, vouchers.wallet(me, null).size());
    }

    @Test
    void aPartnerEventGivesTheirVoucherOnFollowAndItShowsOnTheirPageAndCoursesOnly() {
        long me = member();
        long item = course(400_000);
        long partner = jdbc.queryForObject("SELECT user_id FROM items WHERE id = ?", Long.class, item);
        long other = course(400_000);
        long g = group(Map.of("title", "Quà của trung tâm", "value", 40_000, "generateType", "auto", "prefix", "PT",
                "partnerId", partner, "collectible", true, "showOn", List.of("partner", "pdp")));
        admin.saveEvent(null, Map.of("type", "follow_partner", "title", "Theo dõi trung tâm", "partnerId", partner, "groupIds", List.of(g)));
        follows.follow(me, partner);
        assertEquals(1, vouchers.wallet(me, null).size());
        follows.follow(me, partner); // already following: nothing more
        assertEquals(1, vouchers.wallet(me, null).size());

        assertTrue(vouchers.collectible(null, "partner", partner, null).stream().anyMatch(c -> ((Number) c.get("groupId")).longValue() == g));
        assertTrue(vouchers.collectible(null, "pdp", null, item).stream().anyMatch(c -> ((Number) c.get("groupId")).longValue() == g));
        assertTrue(vouchers.collectible(null, "pdp", null, other).stream().noneMatch(c -> ((Number) c.get("groupId")).longValue() == g));
        assertTrue(vouchers.collectible(null, "home", null, null).stream().noneMatch(c -> ((Number) c.get("groupId")).longValue() == g));

        long wallet = ((Number) vouchers.wallet(me, null).get(0).get("id")).longValue();
        addToCart(me, other);
        var ex = assertThrows(IllegalArgumentException.class, () -> cart.checkout("bank_transfer", null, wallet, null, user(me)));
        assertTrue(ex.getMessage().contains("một đối tác"));
        addToCart(me, item);
        Map<String, Object> res = cart.checkout("bank_transfer", null, wallet, null, user(me));
        assertEquals(40_000L, ((Number) res.get("voucherDiscount")).longValue());
        assertEquals(760_000L, ((Number) res.get("amount")).longValue());
    }
}
