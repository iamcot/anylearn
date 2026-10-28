package com.anylearn.backend.service.explore;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** Khám phá against the real schema (needs the database like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class ExploreFlowTest {

    @Autowired ExploreService explore;
    @Autowired ExploreSettings settings;
    @Autowired JdbcTemplate jdbc;

    private long user() {
        String phone = "09" + (long) (Math.random() * 100000000L);
        jdbc.update("INSERT INTO users (name, phone, refcode, password, role, created_at) VALUES ('Nguyen Van Bin', ?, ?, 'x', 'member', NOW())", phone, phone);
        return jdbc.queryForObject("SELECT id FROM users WHERE phone = ?", Long.class, phone);
    }

    private long post(String status) {
        return explore.savePost(null, "article", "Mẹo học", "Nội dung", null, null, null, status, false);
    }

    @Test
    void onlyPublishedPostsAreInTheFeed() {
        long u = user();
        long draft = post("draft");
        long live = post("published");
        List<Map<String, Object>> items = (List<Map<String, Object>>) explore.feed(u, 1, 30).get("items");
        assertTrue(items.stream().anyMatch(p -> ((Number) p.get("id")).longValue() == live));
        assertTrue(items.stream().noneMatch(p -> ((Number) p.get("id")).longValue() == draft));
        explore.savePost(draft, "article", "Mẹo học", null, null, null, null, "published", false);
        assertNotNull(jdbc.queryForObject("SELECT published_at FROM explore_posts WHERE id = ?", Object.class, draft));
    }

    @Test
    void likeTogglesAndCounts() {
        long u = user();
        long p = post("published");
        assertEquals(true, explore.toggleLike(u, p).get("liked"));
        assertEquals(1L, ((Number) explore.toggleLike(user(), p).get("likes")).longValue() - 1);
        assertEquals(false, explore.toggleLike(u, p).get("liked"));
        assertThrows(IllegalStateException.class, () -> explore.toggleLike(u, post("draft")));
    }

    @Test
    void commentsAreCountedReportedHiddenAndBanned() {
        long u = user();
        long p = post("published");
        long other = user();
        explore.addComment(u, p, "Hay quá");
        assertEquals(1, ((Number) explore.comments(p, other, 0, 20).size()).intValue());
        long commentId = ((Number) explore.comments(p, other, 0, 20).get(0).get("id")).longValue();
        assertEquals("Van Bin", explore.comments(p, other, 0, 20).get(0).get("name"));

        explore.reportComment(other, commentId, "Quảng cáo");
        assertEquals(1, explore.openReports());
        explore.setCommentStatus(commentId, false);
        assertEquals(0, explore.openReports());
        assertEquals(0, explore.comments(p, other, 0, 20).size());
        assertEquals(0L, jdbc.queryForObject("SELECT comments_count FROM explore_posts WHERE id = ?", Long.class, p));

        explore.setBan(u, true, "spam");
        assertThrows(IllegalStateException.class, () -> explore.addComment(u, p, "Lại nữa"));
        explore.setBan(u, false, null);
        explore.addComment(u, p, "Xin lỗi");
    }

    @Test
    void rateLimitAndBannedWordsStopComments() {
        long u = user();
        long p = post("published");
        settings.save(Map.of("bannedWords", "xấu xa", "commentsPerMinute", 2));
        assertThrows(IllegalStateException.class, () -> explore.addComment(u, p, "Đồ xau xa"));
        explore.addComment(u, p, "Một");
        explore.addComment(u, p, "Hai");
        assertThrows(IllegalStateException.class, () -> explore.addComment(u, p, "Ba"));
    }

    @Test
    void commentsCanBeSwitchedOff() {
        long u = user();
        long p = post("published");
        settings.save(Map.of("commentsEnabled", false));
        assertThrows(IllegalStateException.class, () -> explore.addComment(u, p, "Hi"));
    }
}
