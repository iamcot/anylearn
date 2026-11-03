package com.anylearn.backend.service.journey;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class JourneyRulesTest {

    private static final Set<String> ALL = JourneyRules.DEFS.stream().map(JourneyRules.Def::key).collect(Collectors.toSet());

    @Test
    void keysAreUniqueAndChaptersExist() {
        assertEquals(JourneyRules.DEFS.size(), ALL.size());
        JourneyRules.DEFS.forEach(d -> assertTrue(d.chapter() >= 1 && d.chapter() <= JourneyRules.CHAPTERS.size()));
    }

    @Test
    void optionalMissionsDoNotBlockAChapter() {
        Set<String> done = Set.of("add_child", "interests", "home_address", "notifications");
        assertTrue(JourneyRules.chapterComplete(1, done, ALL));
        assertFalse(JourneyRules.chapterComplete(1, Set.of("add_child"), ALL));
        // a switched-off mission does not block either
        Set<String> enabled = new HashSet<>(ALL);
        enabled.remove("notifications");
        assertTrue(JourneyRules.chapterComplete(1, Set.of("add_child", "interests", "home_address"), enabled));
    }

    @Test
    void laterChaptersOpenAfterTheFirstOrder() {
        assertTrue(JourneyRules.chapterOpen(3, false));
        assertFalse(JourneyRules.chapterOpen(4, false));
        assertTrue(JourneyRules.chapterOpen(5, true));
    }

    @Test
    void nextIsTheFirstRequiredMissionThenOptional() {
        assertEquals("add_child", JourneyRules.next(Set.of(), ALL, false).orElseThrow().key());
        Set<String> required = JourneyRules.DEFS.stream().filter(d -> !d.optional() && d.chapter() <= 3).map(JourneyRules.Def::key).collect(Collectors.toSet());
        // all required of chapters 1-3 done, no order yet → an optional one of chapters 1-3
        assertEquals("install_app", JourneyRules.next(required, ALL, false).orElseThrow().key());
        // with an order, chapter 4 required missions come before optionals
        assertEquals("attend", JourneyRules.next(required, ALL, true).orElseThrow().key());
    }
}
