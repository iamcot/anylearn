package com.anylearn.backend.service.video;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class VideoCourseRulesTest {

    private static final LocalDateTime T0 = LocalDateTime.of(2026, 10, 28, 20, 0);

    @Test
    void freeLessonsPlayForEveryone() {
        assertTrue(VideoCourseRules.canWatch(true, false));
        assertTrue(VideoCourseRules.canWatch(false, true));
        assertFalse(VideoCourseRules.canWatch(false, false));
    }

    @Test
    void bunnyStatusMapping() {
        assertEquals("ready", VideoCourseRules.videoStatus(4));
        assertEquals("ready", VideoCourseRules.videoStatus(8));
        assertEquals("failed", VideoCourseRules.videoStatus(5));
        assertEquals("failed", VideoCourseRules.videoStatus(6));
        assertEquals("uploading", VideoCourseRules.videoStatus(0));
        assertEquals("processing", VideoCourseRules.videoStatus(3));
    }

    @Test
    void completeNeedsTheEndAndRealWatching() {
        // reached 90% and watched 70%
        assertTrue(VideoCourseRules.isComplete(600, 540, 420, 90, 70));
        // seeked to the end without watching
        assertFalse(VideoCourseRules.isComplete(600, 600, 60, 90, 70));
        // watched a lot but stopped half way
        assertFalse(VideoCourseRules.isComplete(600, 300, 500, 90, 70));
        // no length: only by hand
        assertFalse(VideoCourseRules.isComplete(null, 100, 100, 90, 70));
    }

    @Test
    void watchDeltaIsCapped() {
        assertEquals(0, VideoCourseRules.clampDelta(-5));
        assertEquals(15, VideoCourseRules.clampDelta(15));
        assertEquals(VideoCourseRules.MAX_WATCH_DELTA, VideoCourseRules.clampDelta(5000));
    }

    @Test
    void resumePositionRestartsNearTheEnd() {
        assertEquals(120, VideoCourseRules.resumePosition(600, 120));
        assertEquals(0, VideoCourseRules.resumePosition(600, 598));
        assertEquals(0, VideoCourseRules.resumePosition(600, 0));
        assertEquals(50, VideoCourseRules.resumePosition(null, 50));
    }

    @Test
    void resumeLessonPicksTheRightOne() {
        List<Long> order = List.of(1L, 2L, 3L, 4L);
        // nothing watched: the first
        assertEquals(1L, VideoCourseRules.resumeLesson(order, Map.of()));
        // last touched lesson unfinished: that one
        assertEquals(3L, VideoCourseRules.resumeLesson(order, Map.of(
                1L, new VideoCourseRules.LessonState(true, T0.minusDays(2)),
                3L, new VideoCourseRules.LessonState(false, T0))));
        // last touched done: the next not done after it
        assertEquals(3L, VideoCourseRules.resumeLesson(order, Map.of(
                2L, new VideoCourseRules.LessonState(true, T0),
                1L, new VideoCourseRules.LessonState(false, T0.minusDays(1)))));
        // last one done and nothing after: the first not done
        assertEquals(1L, VideoCourseRules.resumeLesson(order, Map.of(
                4L, new VideoCourseRules.LessonState(true, T0))));
        // all done: the first
        assertEquals(1L, VideoCourseRules.resumeLesson(List.of(1L, 2L), Map.of(
                1L, new VideoCourseRules.LessonState(true, T0),
                2L, new VideoCourseRules.LessonState(true, T0))));
        assertNull(VideoCourseRules.resumeLesson(List.of(), Map.of()));
    }

    @Test
    void milestones() {
        assertEquals(80, VideoCourseRules.crossedMilestone(75, 80, 80));
        assertEquals(100, VideoCourseRules.crossedMilestone(75, 100, 80));
        assertEquals(0, VideoCourseRules.crossedMilestone(80, 90, 80));
        assertEquals(0, VideoCourseRules.crossedMilestone(100, 100, 80));
        assertEquals(66, VideoCourseRules.percent(2, 3) - 1);
        assertEquals(0, VideoCourseRules.percent(1, 0));
    }

    @Test
    void weekdaysAndPlans() {
        assertEquals(List.of(1, 3, 7), VideoCourseRules.parseWeekdays("7, 3,1,3,9,x"));
        assertEquals("1,3,7", VideoCourseRules.weekdaysText(List.of(7, 1, 3)));
        assertEquals("T3, T5, CN lúc 20:00", VideoCourseRules.planText(List.of(2, 4, 7), LocalTime.of(20, 0)));
        assertNotNull(VideoCourseRules.planProblem(List.of(), LocalTime.NOON, 1));
        assertNotNull(VideoCourseRules.planProblem(List.of(1), null, 1));
        assertNotNull(VideoCourseRules.planProblem(List.of(1), LocalTime.NOON, 0));
        assertNull(VideoCourseRules.planProblem(List.of(1), LocalTime.NOON, 2));
    }

    @Test
    void reminderWindow() {
        // 2026-10-28 is a Wednesday (3)
        List<Integer> wed = List.of(3);
        assertTrue(VideoCourseRules.reminderDue(wed, LocalTime.of(20, 0), T0, 20));
        assertTrue(VideoCourseRules.reminderDue(wed, LocalTime.of(20, 0), T0.plusMinutes(19), 20));
        assertFalse(VideoCourseRules.reminderDue(wed, LocalTime.of(20, 0), T0.plusMinutes(20), 20));
        assertFalse(VideoCourseRules.reminderDue(wed, LocalTime.of(20, 0), T0.minusMinutes(1), 20));
        assertFalse(VideoCourseRules.reminderDue(List.of(4), LocalTime.of(20, 0), T0, 20));
    }

    @Test
    void signedUrlMatchesBunnyDirectoryToken() {
        // expected value computed with Bunny's reference algorithm (PHP sample, directory token with token_path)
        assertEquals("https://cdn.example.com/bcdn_token=UUTgEuvxuOx1AgDIQodcVOhkCLQE7usCKyqOMgtIVoA&token_path=%2Fvid-123%2F&expires=1700000000/vid-123/playlist.m3u8",
                VideoCourseRules.signedUrl("cdn.example.com", "abc-key", "vid-123", "playlist.m3u8", 1700000000L));
    }

    @Test
    void durationText() {
        assertEquals("1 giờ 5 phút", VideoCourseRules.durationText(3900));
        assertEquals("12 phút", VideoCourseRules.durationText(720));
        assertEquals("45 giây", VideoCourseRules.durationText(45));
        assertEquals("", VideoCourseRules.durationText(0));
    }

    @Test
    void notesNeedTextInsideTheLessonAndRoom() {
        assertNull(VideoCourseRules.noteProblem("Ghi chú", 30, 600, 0));
        assertNotNull(VideoCourseRules.noteProblem("  ", 30, 600, 0));
        assertNotNull(VideoCourseRules.noteProblem("x".repeat(501), 30, 600, 0));
        assertNotNull(VideoCourseRules.noteProblem("ok", -1, 600, 0));
        assertNotNull(VideoCourseRules.noteProblem("ok", 700, 600, 0));
        assertNull(VideoCourseRules.noteProblem("ok", 700, null, 0), "a lesson with no known length accepts any position");
        assertNotNull(VideoCourseRules.noteProblem("ok", 10, 600, VideoCourseRules.NOTES_PER_LESSON));
    }
}
