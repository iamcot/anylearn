package com.anylearn.backend.service.studio;

import com.anylearn.backend.entity.User;
import com.anylearn.backend.repository.UserRepository;
import com.anylearn.backend.service.adminaccess.AdminAccessService;
import com.anylearn.backend.service.adminaccess.AdminPermissions;
import com.anylearn.backend.service.explore.ExploreCreatorService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Machine keys, post source, social queue and the content reviewer against the real schema; every test rolls back. */
@SpringBootTest
@Transactional
class StudioFlowTest {

    @Autowired ApiKeyService keys;
    @Autowired SocialQueueService queue;
    @Autowired AdminAccessService access;
    @Autowired ExploreCreatorService creators;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;

    @AfterEach
    void clearRequest() {
        RequestContextHolder.resetRequestAttributes();
    }

    private long user(String role) {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, status, created_at) VALUES ('anyLEARN Studio', ?, ?, 'x', ?, 1, NOW())", phone, phone, role);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    @Test
    void aKeyActsAsItsAccountUntilRevoked() {
        long studio = user("member");
        Map<String, Object> created = keys.create("t2m Mac", studio, null);
        String key = (String) created.get("key");
        assertEquals(studio, keys.authenticate(key).orElseThrow().user().getId());
        assertTrue(keys.authenticate(key.substring(0, key.length() - 1) + "Z").isEmpty() || !key.endsWith("Z"));
        long id = ((Number) keys.list().stream().filter(k -> key.startsWith((String) k.get("prefix"))).findFirst().orElseThrow().get("id")).longValue();
        assertTrue(keys.revoke(id));
        assertTrue(keys.authenticate(key).isEmpty());
    }

    @Test
    void postsOfTheMachineAreMarkedT2mAndWaitForReview() {
        long studio = user("member");
        creators.setCreator(studio, "creator", "t2m", studio);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute(StudioRules.REQUEST_ATTRIBUTE, 1L);
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));
        long postId = creators.save(studio, null, "article", "Đố vui cùng Leo", "Nội dung", null, null, null, List.of(), false);
        Map<String, Object> row = jdbc.queryForMap("SELECT source, status FROM explore_posts WHERE id = ?", postId);
        assertEquals("t2m", row.get("source"));
        assertEquals("pending", row.get("status"));

        long line = queue.add(postId, "facebook", "Caption", null, null, "ra-mat-v2", studio, studio);
        Map<String, Object> q = jdbc.queryForMap("SELECT link, status FROM social_queue WHERE id = ?", line);
        assertTrue(((String) q.get("link")).contains("/fun/explore/" + postId + "/do-vui-cung-leo?utm_source=facebook"));
        assertEquals("waiting", q.get("status"));
        assertThrows(IllegalArgumentException.class, () -> queue.add(postId, "facebook", "x", null, null, null, user("member"), user("member")));
        queue.setStatus(line, "posted", "https://facebook.com/anylearn/posts/1");
        assertEquals("posted", jdbc.queryForObject("SELECT status FROM social_queue WHERE id = ?", String.class, line));
        assertEquals(1L, ((Number) ((List<Map<String, Object>>) queue.stats(studio, 30).get("posts")).get(0).get("socialPosted")).longValue());
    }

    @Test
    void aContentReviewerIsNotAnAdmin() {
        long id = user("member");
        User reviewer = users.findById(id).orElseThrow();
        assertFalse(access.canReviewContent(reviewer));
        assertFalse(access.canEnterBackOffice(reviewer));
        access.set(id, List.of(AdminPermissions.CONTENT_REVIEW, "orders"), null);
        assertTrue(access.canReviewContent(reviewer));
        assertTrue(access.canEnterBackOffice(reviewer));
        assertEquals(List.of(AdminPermissions.CONTENT_REVIEW), access.list().stream().filter(p -> ((Number) p.get("id")).longValue() == id).findFirst().orElseThrow().get("permissions"));
        access.set(id, List.of(), null);
        assertFalse(access.canReviewContent(reviewer));
    }
}
