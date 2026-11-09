package com.anylearn.backend.service.order.manual;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Manual order entry against the real schema (needs MySQL or MariaDB like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class ManualOrderFlowTest {

    @Autowired ManualOrderService service;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @Autowired jakarta.persistence.EntityManager em;

    private static String newPhone() {
        return "09" + String.format("%08d", (long) (Math.random() * 100000000L));
    }

    private User admin() {
        String phone = newPhone();
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Admin', ?, ?, 'x', 'admin', NOW())", phone, phone);
        return users.findByPhone(phone).orElseThrow();
    }

    private long course(long price) {
        String phone = "08" + String.format("%08d", (long) (Math.random() * 100000000L));
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Trung tam', ?, ?, 'x', 'school', NOW())", phone, phone);
        long partner = jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
        // An age limit and no DOB on the learner: the shop would refuse, the admin entry does not.
        jdbc.update("INSERT INTO items (user_id, title, type, subtype, status, user_status, price, ages_min, ages_max) VALUES (?, 'Khoa thu', 'class', 'online', 1, 1, ?, 4, 8)", partner, price);
        return jdbc.queryForObject("SELECT MAX(id) FROM items", Long.class);
    }

    private static ManualOrderRules.Input input(String phone, String name, boolean forChild, String childName,
                                                List<Long> items, boolean paid, Long amount) {
        return new ManualOrderRules.Input(phone, name, "", forChild, null, childName, "2019-05-01", false,
                items.stream().map(id -> new ManualOrderRules.Line(id, null, null)).toList(), "cash", paid, amount, "Thu tại sự kiện");
    }

    @Test
    void aNewPhoneGetsAMemberAccountAChildAndAPaidOrder() {
        User admin = admin();
        long a = course(300_000), b = course(500_000);
        String phone = newPhone();

        Map<String, Object> out = service.create(input(phone, "Nguyễn Thị Mai", true, "Bin", List.of(a, b), true, 750_000L), admin);
        em.flush();

        assertEquals(true, out.get("accountCreated"));
        assertEquals(6, String.valueOf(out.get("password")).length());
        User buyer = users.findByPhone(phone).orElseThrow();
        assertEquals("member", buyer.getRole());
        long orderId = ((Number) out.get("orderId")).longValue();
        assertEquals("delivered", jdbc.queryForObject("SELECT status FROM orders WHERE id = ?", String.class, orderId));
        assertEquals(750_000L, jdbc.queryForObject("SELECT amount FROM orders WHERE id = ?", Long.class, orderId));
        assertEquals("cash", jdbc.queryForObject("SELECT payment FROM orders WHERE id = ?", String.class, orderId));

        Long child = ((Number) out.get("learnerId")).longValue();
        assertEquals(buyer.getId(), jdbc.queryForObject("SELECT user_id FROM users WHERE id = ?", Long.class, child));
        assertEquals(2, jdbc.queryForObject("SELECT COUNT(*) FROM user_course_enrollments WHERE order_id = ? AND user_id = ?", Integer.class, orderId, child));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM item_user_actions WHERE user_id = ? AND type = 'cart'", Integer.class, buyer.getId()));
        assertEquals(1, jdbc.queryForObject("SELECT account_created FROM manual_orders WHERE order_id = ?", Integer.class, orderId));
    }

    @Test
    void anExistingAccountKeepsItsCartAndReusesTheChildOfTheSameName() {
        User admin = admin();
        long a = course(300_000), other = course(100_000);
        String phone = newPhone();
        service.create(input(phone, "Trần Văn Nam", true, "Bông", List.of(a), false, null), admin);
        User buyer = users.findByPhone(phone).orElseThrow();
        jdbc.update("INSERT INTO item_user_actions (item_id, user_id, type, value, created_at, updated_at) VALUES (?, ?, 'cart', '1', NOW(), NOW())", other, buyer.getId());

        Map<String, Object> out = service.create(input(phone, null, true, " bông ", List.of(course(200_000)), false, null), admin);
        em.flush();

        assertEquals(false, out.get("accountCreated"));
        assertNull(out.get("password"));
        assertEquals("pay_pending", out.get("status"));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE user_id = ? AND is_child = 1", Integer.class, buyer.getId()));
        assertEquals(1, jdbc.queryForObject("SELECT COUNT(*) FROM item_user_actions WHERE user_id = ? AND type = 'cart'", Integer.class, buyer.getId()),
                "the buyer's own cart is left alone");
    }

    @Test
    void lookupListsTheChildren() {
        User admin = admin();
        String phone = newPhone();
        assertEquals(false, service.lookup(phone).get("exists"));
        service.create(input(phone, "Lê Thu Hà", true, "Na", List.of(course(100_000)), true, null), admin);
        Map<String, Object> found = service.lookup(phone);
        assertEquals(true, found.get("exists"));
        assertEquals(1, ((List<?>) found.get("children")).size());
    }
}
