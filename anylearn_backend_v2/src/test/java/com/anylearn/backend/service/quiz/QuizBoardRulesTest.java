package com.anylearn.backend.service.quiz;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class QuizBoardRulesTest {

    @Test
    void periodKeysFollowTheIsoWeekAndTheMonth() {
        assertEquals("W2026-44", QuizBoardRules.periodKey("week", LocalDate.of(2026, 10, 28)));
        assertEquals("M2026-10", QuizBoardRules.periodKey("month", LocalDate.of(2026, 10, 28)));
        // 1 Jan 2027 is still in the last ISO week of 2026
        assertEquals("W2026-53", QuizBoardRules.periodKey("week", LocalDate.of(2027, 1, 1)));
        assertEquals("W2026-44", QuizBoardRules.periodKey("week", LocalDate.of(2026, 10, 26)));
    }

    @Test
    void kindAndOverCheck() {
        assertEquals("week", QuizBoardRules.kindOf("W2026-44"));
        assertEquals("month", QuizBoardRules.kindOf("M2026-10"));
        assertNull(QuizBoardRules.kindOf("2026-44"));
        LocalDate today = LocalDate.of(2026, 10, 28);
        assertFalse(QuizBoardRules.isOver("W2026-44", today));
        assertTrue(QuizBoardRules.isOver("W2026-43", today));
        assertFalse(QuizBoardRules.isOver("M2026-10", today));
        assertTrue(QuizBoardRules.isOver("M2026-09", today));
    }

    @Test
    void lastPeriodIsTheOneThatJustEnded() {
        assertEquals("W2026-43", QuizBoardRules.lastPeriod("week", LocalDate.of(2026, 10, 26)));
        assertEquals("M2026-09", QuizBoardRules.lastPeriod("month", LocalDate.of(2026, 10, 1)));
        assertEquals("M2025-12", QuizBoardRules.lastPeriod("month", LocalDate.of(2026, 1, 1)));
    }

    @Test
    void displayNameNeverShowsAPhoneOrEmail() {
        assertEquals("Văn An", QuizBoardRules.displayName("Nguyễn Văn An"));
        assertEquals("Mẹ Bin", QuizBoardRules.displayName("Mẹ Bin"));
        assertEquals("Người chơi", QuizBoardRules.displayName("0912345678"));
        assertEquals("Người chơi", QuizBoardRules.displayName("a@b.com"));
        assertEquals("Người chơi", QuizBoardRules.displayName("  "));
        assertEquals("Người chơi", QuizBoardRules.displayName(null));
    }

    @Test
    void prizesParseOrFallBack() {
        List<Integer> fallback = List.of(3, 2, 1);
        assertEquals(List.of(5, 3, 2), QuizBoardRules.parsePrizes("5, 3,2", fallback));
        assertEquals(List.of(4), QuizBoardRules.parsePrizes("4", fallback));
        assertEquals(fallback, QuizBoardRules.parsePrizes("1,2,3,4", fallback));
        assertEquals(fallback, QuizBoardRules.parsePrizes("a,b", fallback));
        assertEquals(fallback, QuizBoardRules.parsePrizes("99", fallback));
        assertEquals(fallback, QuizBoardRules.parsePrizes(null, fallback));
    }
}
