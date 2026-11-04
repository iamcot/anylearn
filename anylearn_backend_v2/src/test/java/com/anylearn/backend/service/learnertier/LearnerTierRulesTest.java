package com.anylearn.backend.service.learnertier;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class LearnerTierRulesTest {

    private static final List<Integer> T = List.of(0, 1, 3, 6, 10);

    @Test
    void tiersByFinishedCourses() {
        assertEquals(0, LearnerTierRules.tierIndex(0, T));
        assertEquals(1, LearnerTierRules.tierIndex(1, T));
        assertEquals(2, LearnerTierRules.tierIndex(5, T));
        assertEquals(4, LearnerTierRules.tierIndex(25, T));
        assertEquals(1, LearnerTierRules.toNext(0, T));
        assertEquals(1, LearnerTierRules.toNext(5, T));
        assertEquals(0, LearnerTierRules.toNext(12, T));
    }

    @Test
    void classNeedsTheEndAndEnoughAttendance() {
        assertTrue(LearnerTierRules.classFinished(10, 10, 8, 80));
        assertFalse(LearnerTierRules.classFinished(10, 10, 7, 80));
        assertFalse(LearnerTierRules.classFinished(10, 9, 9, 80));
        assertFalse(LearnerTierRules.classFinished(0, 0, 0, 80));
    }

    @Test
    void videoNeedsEveryLesson() {
        assertTrue(LearnerTierRules.videoFinished(12, 12));
        assertFalse(LearnerTierRules.videoFinished(12, 11));
        assertFalse(LearnerTierRules.videoFinished(0, 0));
    }
}
