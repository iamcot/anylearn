package com.anylearn.backend.service.seo;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SeoRulesTest {

    @Test
    void slugDropsAccentsAndPunctuation() {
        assertEquals("be-hoc-boi-5-tuoi", SeoRules.slug("Bé học Bơi: 5 tuổi!"));
        assertEquals("duong-dua-dieu-ky", SeoRules.slug("Đường đua Điều Kỳ"));
        assertEquals("bai-viet", SeoRules.slug("!!!"));
        assertEquals("bai-viet", SeoRules.slug(null));
    }

    @Test
    void longSlugIsCutWithoutTrailingDash() {
        String slug = SeoRules.slug("a ".repeat(100));
        assertTrue(slug.length() <= SeoRules.MAX_SLUG);
        assertFalse(slug.endsWith("-"));
    }

    @Test
    void pagesAndOffsets() {
        assertEquals(0, SeoRules.pages(0));
        assertEquals(1, SeoRules.pages(1));
        assertEquals(1, SeoRules.pages(SeoRules.PAGE_SIZE));
        assertEquals(2, SeoRules.pages(SeoRules.PAGE_SIZE + 1));
        assertEquals(0, SeoRules.offset(0));
        assertEquals(SeoRules.PAGE_SIZE, SeoRules.offset(2));
        assertTrue(SeoRules.knownType("course"));
        assertFalse(SeoRules.knownType("users"));
    }
}
