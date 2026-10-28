package com.anylearn.backend.service.explore;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ExploreRulesTest {

    @Test
    void titleAndKindAreChecked() {
        assertEquals("Mẹo hay", ExploreRules.cleanTitle("  Mẹo hay "));
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanTitle(" "));
        assertEquals("article", ExploreRules.cleanKind(null));
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanKind("gif"));
    }

    @Test
    void clipAndPhotoNeedALinkButAnArticleDoesNot() {
        assertNull(ExploreRules.cleanMedia("article", null));
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanMedia("video", ""));
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanMedia("image", "http://x.vn/a.jpg"));
        assertNull(ExploreRules.cleanMedia("video", "", "draft"));
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanMedia("video", "", "published"));
        assertEquals("https://x.vn/a.mp4", ExploreRules.cleanMedia("video", " https://x.vn/a.mp4 "));
    }

    @Test
    void commentRules() {
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanComment("  "));
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanComment("a".repeat(301)));
        assertNull(ExploreRules.commentProblem(false, null, 0, 5));
        assertNotNull(ExploreRules.commentProblem(true, null, 0, 5));
        assertNotNull(ExploreRules.commentProblem(false, "xau", 0, 5));
        assertNotNull(ExploreRules.commentProblem(false, null, 5, 5));
        assertNull(ExploreRules.commentProblem(false, null, 50, 0));
    }

    @Test
    void creatorStatusRules() {
        assertEquals("pending", ExploreRules.statusAfterCreatorSave("creator", null, null));
        assertEquals("published", ExploreRules.statusAfterCreatorSave("s_creator", null, null));
        assertEquals("pending", ExploreRules.statusAfterCreatorSave("creator", "published", null));
        assertEquals("hidden", ExploreRules.statusAfterCreatorSave("s_creator", "hidden", "creator"));
        assertEquals("pending", ExploreRules.statusAfterCreatorSave("s_creator", "hidden", "admin"));
        assertEquals("pending", ExploreRules.statusAfterCreatorSave("s_creator", "rejected", null));

        assertEquals("published", ExploreRules.statusAfterCreatorShow("creator", true, "hidden", "creator"));
        assertEquals("pending", ExploreRules.statusAfterCreatorShow("creator", false, "hidden", "creator"));
        assertEquals("published", ExploreRules.statusAfterCreatorShow("s_creator", false, "hidden", "creator"));
        assertEquals("pending", ExploreRules.statusAfterCreatorShow("s_creator", true, "hidden", "admin"));
        assertEquals("pending", ExploreRules.statusAfterCreatorShow("creator", true, "rejected", null));

        assertTrue(ExploreRules.creatorCanHide("published"));
        assertTrue(ExploreRules.creatorCanHide("pending"));
        assertFalse(ExploreRules.creatorCanHide("hidden"));
        assertTrue(ExploreRules.creatorCanDelete("hidden"));
        assertTrue(ExploreRules.creatorCanDelete("rejected"));
        assertFalse(ExploreRules.creatorCanDelete("published"));
    }

    @Test
    void levelsAndTags() {
        assertEquals("s_creator", ExploreRules.cleanLevel("s-creator"));
        assertEquals("creator", ExploreRules.cleanLevel(null));
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanLevel("boss"));
        assertEquals(java.util.List.of(3L, 5L), ExploreRules.cleanTagIds(java.util.Arrays.asList(3L, null, 5L, 3L, 0L)));
        assertThrows(IllegalArgumentException.class, () -> ExploreRules.cleanTagIds(java.util.List.of(1L, 2L, 3L, 4L, 5L, 6L, 7L, 8L, 9L)));
    }

    @Test
    void rankPrefersMatchingTagsThenFreshPosts() {
        double matching = ExploreRules.rankScore(2, 30, 100, 1, 0, 0);
        double fresh = ExploreRules.rankScore(0, 0, 100, 1, 0, 0);
        assertTrue(matching > fresh);
        assertTrue(ExploreRules.rankScore(0, 0, 0, 0, 0, 0) > ExploreRules.rankScore(0, 14, 0, 0, 0, 0));
        assertEquals(ExploreRules.rankScore(5, 0, 0, 0, 0, 0), ExploreRules.rankScore(9, 0, 0, 0, 0, 0));
    }
}
