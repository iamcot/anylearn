package com.anylearn.backend.service.quiz;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class QuizRulesTest {

    private static QuizRules.Candidate ok() {
        return new QuizRules.Candidate("Thủ đô của Việt Nam là gì?", List.of("Hà Nội", "Huế", "Đà Nẵng", "Cần Thơ"), 0, "Hà Nội là thủ đô.");
    }

    @Test
    void defaultMixIsValidAndGetsHarderWithRank() {
        assertNull(QuizRules.mixProblem(QuizRules.DEFAULT_MIX));
        assertArrayEquals(new int[]{100, 0, 0, 0, 0}, QuizRules.DEFAULT_MIX.get("dong"));
        assertArrayEquals(new int[]{80, 20, 0, 0, 0}, QuizRules.DEFAULT_MIX.get("bac"));
    }

    @Test
    void pickDifficultyFollowsThePercentages() {
        int[] bac = {80, 20, 0, 0, 0};
        assertEquals(1, QuizRules.pickDifficulty(bac, 0.0));
        assertEquals(1, QuizRules.pickDifficulty(bac, 0.79));
        assertEquals(2, QuizRules.pickDifficulty(bac, 0.80));
        assertEquals(2, QuizRules.pickDifficulty(bac, 0.999));
        assertEquals(1, QuizRules.pickDifficulty(new int[]{100, 0, 0, 0, 0}, 0.999));
    }

    @Test
    void mixMustAddUpTo100() {
        Map<String, int[]> bad = new java.util.LinkedHashMap<>(QuizRules.DEFAULT_MIX);
        bad.put("vang", new int[]{30, 50, 30, 0, 0});
        assertNotNull(QuizRules.mixProblem(bad));
        bad.put("vang", new int[]{50, 50, 0});
        assertNotNull(QuizRules.mixProblem(bad));
        assertNotNull(QuizRules.mixProblem(Map.of()));
    }

    @Test
    void mixSurvivesJson() {
        Map<String, int[]> parsed = QuizRules.parseMix(QuizRules.mixToJson(QuizRules.DEFAULT_MIX));
        assertNotNull(parsed);
        assertArrayEquals(QuizRules.DEFAULT_MIX.get("kimcuong"), parsed.get("kimcuong"));
        assertNull(QuizRules.parseMix("{}"));
    }

    @Test
    void topicKeyFromLabel() {
        assertEquals("xa_hoi_doi_song", QuizRules.topicKeyFrom("Xã hội & đời sống"));
        assertEquals("toan_tu_duy", QuizRules.topicKeyFrom("Toán tư duy"));
        assertTrue(QuizRules.validTopicKey("toan_tu_duy"));
        assertFalse(QuizRules.validTopicKey("x"));
        assertFalse(QuizRules.validTopicKey(""));
    }

    @Test
    void hashIgnoresAccentsCaseAndPunctuation() {
        assertEquals(QuizRules.hash("Thủ đô của Việt Nam là gì?"), QuizRules.hash("thu do cua viet nam la gi"));
        assertNotEquals(QuizRules.hash("Thủ đô của Lào là gì?"), QuizRules.hash("Thủ đô của Việt Nam là gì?"));
    }

    @Test
    void similarQuestionsAreDuplicates() {
        assertTrue(QuizRules.similarity("Con nên ngủ bao nhiêu giờ mỗi ngày?", "Con nên ngủ bao nhiêu giờ mỗi đêm?") >= 0.6);
        assertTrue(QuizRules.isDuplicate("Thủ đô của Việt Nam là gì", Set.of(), List.of("Thủ đô của Việt Nam là gì?")));
        assertFalse(QuizRules.isDuplicate("Nốt nhạc đầu tiên là gì?", Set.of(), List.of("Thủ đô của Việt Nam là gì?")));
    }

    @Test
    void validatesCandidates() {
        assertNull(QuizRules.problem(ok()));
        assertNotNull(QuizRules.problem(new QuizRules.Candidate("Ngắn", List.of("a", "b", "c", "d"), 0, null)));
        assertNotNull(QuizRules.problem(new QuizRules.Candidate("Câu hỏi đủ dài để hợp lệ?", List.of("a", "b", "c"), 0, null)));
        assertNotNull(QuizRules.problem(new QuizRules.Candidate("Câu hỏi đủ dài để hợp lệ?", List.of("Hà Nội", "ha noi", "c", "d"), 0, null)));
        assertNotNull(QuizRules.problem(new QuizRules.Candidate("Câu hỏi đủ dài để hợp lệ?", List.of("a", "b", "c", "d"), 4, null)));
    }

    @Test
    void parsesQuestionsAndCountsInvalid() {
        String json = "{\"questions\":[{\"body\":\"Thủ đô của Việt Nam là gì?\",\"options\":[\"Hà Nội\",\"Huế\",\"Đà Nẵng\",\"Cần Thơ\"],\"correct\":0,\"explanation\":\"x\"},"
                + "{\"body\":\"Hỏng\",\"options\":[\"a\"],\"correct\":0}]}";
        int[] invalid = {0};
        List<QuizRules.Candidate> list = QuizRules.parseQuestions(json, invalid);
        assertEquals(1, list.size());
        assertEquals(1, invalid[0]);
        assertTrue(QuizRules.parseQuestions("không phải json", null).isEmpty());
    }

    @Test
    void parsesBlindAnswers() {
        Map<Integer, Integer> answers = QuizRules.parseAnswers("{\"answers\":[{\"index\":0,\"choice\":2},{\"index\":1,\"choice\":9}]}");
        assertEquals(Map.of(0, 2), answers);
    }

    @Test
    void shuffleKeepsTheRightAnswer() {
        QuizRules.Candidate c = ok();
        for (int i = 0; i < 30; i++) {
            QuizRules.Candidate s = QuizBankService.shuffled(c);
            assertEquals("Hà Nội", s.options().get(s.correct()));
        }
    }

    @Test
    void shortfallAndDuplicateRate() {
        assertEquals(100, QuizRules.shortfall(150, 50, 300));
        assertEquals(0, QuizRules.shortfall(300, 0, 300));
        assertEquals(0.2, QuizRules.duplicateRate(50, 10));
        assertEquals(0, QuizRules.duplicateRate(0, 0));
    }
}
