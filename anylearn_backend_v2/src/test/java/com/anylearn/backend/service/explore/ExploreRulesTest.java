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
}
