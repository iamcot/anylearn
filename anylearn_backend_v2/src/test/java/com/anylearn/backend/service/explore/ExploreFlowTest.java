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

    // ---- plan 16 ----

    @Autowired ExploreCreatorService creators;

    private long tag(String name) {
        jdbc.update("INSERT INTO tags (name, tag_group, created_at, updated_at) VALUES (?, 'other', NOW(), NOW())", name);
        return jdbc.queryForObject("SELECT id FROM tags WHERE name = ?", Long.class, name);
    }

    private static List<Long> ids(Map<String, Object> page) {
        return ((List<Map<String, Object>>) page.get("items")).stream().map(p -> ((Number) p.get("id")).longValue()).toList();
    }

    private String status(long id) {
        return jdbc.queryForObject("SELECT status FROM explore_posts WHERE id = ?", String.class, id);
    }

    @Test
    void creatorPostsWaitForReviewAndSCreatorPublishes() {
        long c = user();
        long admin = user();
        assertThrows(IllegalStateException.class, () -> creators.save(c, null, "article", "Bài", null, null, null, null, List.of(), false));
        creators.setCreator(c, "creator", null, admin);
        long p = creators.save(c, null, "article", "Mẹo ngủ", "Cho bé ngủ sớm", null, null, null, List.of(), false);
        assertEquals("pending", status(p));
        assertEquals(c, jdbc.queryForObject("SELECT author_id FROM explore_posts WHERE id = ?", Long.class, p));

        assertThrows(IllegalArgumentException.class, () -> creators.review(p, "reject", " "));
        creators.review(p, "reject", "Thiếu nguồn");
        assertEquals("rejected", status(p));
        assertEquals("pending", creators.show(c, p));
        creators.review(p, "approve", null);
        assertEquals("published", status(p));

        assertEquals("hidden", creators.hide(c, p));
        assertEquals("published", creators.show(c, p));
        creators.save(c, p, "article", "Mẹo ngủ (sửa)", null, null, null, null, List.of(), false);
        assertEquals("pending", status(p));
        assertThrows(IllegalStateException.class, () -> creators.delete(c, p));
        creators.hide(c, p);
        assertEquals("pending", creators.show(c, p));

        long other = user();
        assertThrows(IllegalStateException.class, () -> creators.hide(other, p));
        creators.setCreator(other, "s_creator", null, admin);
        assertThrows(IllegalArgumentException.class, () -> creators.hide(other, p));
        long q = creators.save(other, null, "article", "Clip vui", null, null, null, null, List.of(), false);
        assertEquals("published", status(q));
        creators.review(q, "hide", "Sai chủ đề");
        assertEquals("pending", creators.show(other, q));
        creators.hide(other, q);
        creators.delete(other, q);
        assertEquals(0L, jdbc.queryForObject("SELECT COUNT(*) FROM explore_posts WHERE id = ?", Long.class, q));
    }

    @Test
    void clipUploadKeepsThePostAsDraftUntilAttached() {
        long c = user();
        creators.setCreator(c, "s_creator", null, user());
        long p = creators.save(c, null, "video", "Clip", null, null, null, null, List.of(), true);
        assertEquals("draft", status(p));
        creators.attachMedia(c, p, "https://vz-1.b-cdn.net/abc/playlist.m3u8", "https://vz-1.b-cdn.net/abc/thumbnail.jpg");
        assertEquals("published", status(p));
        assertEquals("https://vz-1.b-cdn.net/abc/thumbnail.jpg", jdbc.queryForObject("SELECT poster_url FROM explore_posts WHERE id = ?", String.class, p));
        // a new clip replaces the thumbnail of the old one, a poster chosen by hand stays
        creators.attachMedia(c, p, "https://vz-1.b-cdn.net/def/playlist.m3u8", "https://vz-1.b-cdn.net/def/thumbnail.jpg");
        assertEquals("https://vz-1.b-cdn.net/def/thumbnail.jpg", jdbc.queryForObject("SELECT poster_url FROM explore_posts WHERE id = ?", String.class, p));
    }

    @Test
    void feedPutsUnseenAndMatchingPostsFirst() {
        jdbc.update("UPDATE explore_posts SET status = 'hidden'");
        long u = user();
        long english = tag("Tiếng Anh test " + System.nanoTime());
        long music = tag("Âm nhạc test " + System.nanoTime());
        long a = explore.savePost(null, "article", "Bài A", null, null, null, null, "published", false, List.of(music));
        long b = explore.savePost(null, "article", "Bài B", null, null, null, null, "published", false, List.of(english));
        long liked = explore.savePost(null, "article", "Bài đã thích", null, null, null, null, "published", false, List.of(english));
        explore.toggleLike(u, liked);
        explore.countView(u, liked);
        jdbc.update("UPDATE explore_seen SET first_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE user_id = ?", u);
        jdbc.update("UPDATE explore_likes SET created_at = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE user_id = ?", u);

        List<Long> order = ids(explore.feed(u, 1, 10));
        assertEquals(List.of(b, a, liked), order);
        assertEquals(List.of(a, liked), ids(explore.feed(u, 1, 10, null, List.of(b))));
        assertEquals("Tiếng Anh", ((List<Map<String, Object>>) explore.post(u, b).get("tags")).get(0).get("name").toString().substring(0, 9));
    }

    @Test
    void searchFindsTitleBodyAndTag() {
        long u = user();
        String word = "zxq" + System.nanoTime();
        long t = tag("Tag " + word);
        long byTitle = explore.savePost(null, "article", "Tiêu đề " + word, null, null, null, null, "published", false, List.of());
        long byBody = explore.savePost(null, "article", "Khác", "Nội dung " + word, null, null, null, "published", false, List.of());
        long byTag = explore.savePost(null, "article", "Khác nữa", null, null, null, null, "published", false, List.of(t));
        explore.savePost(null, "article", "Nháp " + word, null, null, null, null, "draft", false, List.of());
        // Meilisearch is not running in tests, so this is the SQL fallback; posts written in this test are not in the index anyway
        List<Long> found = ids(explore.search(u, word, 1, 12));
        assertEquals(3, found.size());
        assertTrue(found.containsAll(List.of(byTitle, byBody, byTag)));
    }
}
