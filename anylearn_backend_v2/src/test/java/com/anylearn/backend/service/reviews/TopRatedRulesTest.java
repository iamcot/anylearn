package com.anylearn.backend.service.reviews;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TopRatedRulesTest {

    @Test
    void daysFallBackToDefault() {
        assertEquals(90, TopRatedRules.days(null));
        assertEquals(90, TopRatedRules.days("abc"));
        assertEquals(90, TopRatedRules.days("2"));
        assertEquals(30, TopRatedRules.days(" 30 "));
    }

    @Test
    void titleFollowsThePeriod() {
        assertTrue(TopRatedRules.title(30).endsWith("trong tháng"));
        assertTrue(TopRatedRules.title(31).endsWith("trong quý"));
        assertTrue(TopRatedRules.title(90).endsWith("trong quý"));
        assertEquals("Top khóa học được đánh giá cao", TopRatedRules.title(91));
    }

    @Test
    void problemOnOutOfRange() {
        assertNotNull(TopRatedRules.problem(null));
        assertNotNull(TopRatedRules.problem(3));
        assertNull(TopRatedRules.problem(180));
    }
}
