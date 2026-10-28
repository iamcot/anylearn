package com.anylearn.backend.service.quiz;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class QuizEnergyTest {

    private static final LocalDateTime T0 = LocalDateTime.of(2026, 10, 28, 10, 0, 0);

    @Test
    void neverPlayedIsFull() {
        assertEquals(30, QuizEnergy.current(null, null, T0, 30, 5));
        assertEquals(0, QuizEnergy.nextInSeconds(null, null, T0, 30, 5));
    }

    @Test
    void regeneratesOnePerInterval() {
        assertEquals(10, QuizEnergy.current(10, T0, T0.plusMinutes(4).plusSeconds(59), 30, 5));
        assertEquals(11, QuizEnergy.current(10, T0, T0.plusMinutes(5), 30, 5));
        assertEquals(14, QuizEnergy.current(10, T0, T0.plusMinutes(21), 30, 5));
    }

    @Test
    void neverPassesTheMax() {
        assertEquals(30, QuizEnergy.current(25, T0, T0.plusDays(3), 30, 5));
        // the admin lowered the max below a stored value
        assertEquals(20, QuizEnergy.current(28, T0, T0, 20, 5));
    }

    @Test
    void nextPointCountdown() {
        assertEquals(300, QuizEnergy.nextInSeconds(10, T0, T0, 30, 5));
        assertEquals(192, QuizEnergy.nextInSeconds(10, T0, T0.plusSeconds(108), 30, 5));
        assertEquals(300 - 60, QuizEnergy.nextInSeconds(10, T0, T0.plusMinutes(6), 30, 5));
        assertEquals(0, QuizEnergy.nextInSeconds(30, T0, T0.plusMinutes(6), 30, 5));
    }

    @Test
    void spendFromFullStartsTheClockNow() {
        QuizEnergy.State s = QuizEnergy.spend(null, null, T0, 30, 5, 1);
        assertEquals(29, s.value());
        assertEquals(T0, s.at());
    }

    @Test
    void spendKeepsTheProgressOfTheRunningPoint() {
        // 10 at T0, 7 minutes later 11 with 2 minutes of the next point already counted
        QuizEnergy.State s = QuizEnergy.spend(10, T0, T0.plusMinutes(7), 30, 5, 1);
        assertEquals(10, s.value());
        assertEquals(T0.plusMinutes(5), s.at());
        assertEquals(180, QuizEnergy.nextInSeconds(s.value(), s.at(), T0.plusMinutes(7), 30, 5));
    }

    @Test
    void spendingTheLastPointsAndRunningOut() {
        assertNull(QuizEnergy.spend(0, T0, T0.plusMinutes(2), 30, 5, 1));
        QuizEnergy.State s = QuizEnergy.spend(1, T0, T0, 30, 5, 1);
        assertEquals(0, s.value());
        assertNull(QuizEnergy.spend(s.value(), s.at(), T0.plusMinutes(4), 30, 5, 1));
        assertEquals(0, QuizEnergy.spend(s.value(), s.at(), T0.plusMinutes(5), 30, 5, 1).value());
    }

    @Test
    void addIsCappedAtMax() {
        QuizEnergy.State s = QuizEnergy.add(25, T0, T0, 30, 5, 10);
        assertEquals(30, s.value());
        assertEquals(T0, s.at());
        QuizEnergy.State part = QuizEnergy.add(5, T0, T0.plusMinutes(7), 30, 5, 10);
        assertEquals(16, part.value());
        assertEquals(T0.plusMinutes(5), part.at());
    }

    @Test
    void formatsCountdown() {
        assertEquals("03:12", QuizEnergy.mmss(192));
        assertEquals("00:00", QuizEnergy.mmss(-4));
        assertEquals("65:00", QuizEnergy.mmss(3900));
    }
}
