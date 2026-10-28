package com.anylearn.backend.service.ai;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/** The usage log against the real schema (needs the database like the context test); every test rolls back. */
@SpringBootTest
@Transactional
class AiUsageServiceTest {

    @Autowired AiUsageService usage;

    @Test
    @SuppressWarnings("unchecked")
    void reportAddsUpCallsPerFeatureAndCountsErrors() {
        long before = ((Number) ((Map<String, Object>) usage.report(1).get("totals")).get("inputTokens")).longValue();
        usage.record(AiUsageService.QUIZ_WRITE, "test-model", 100, 40, 2000, null);
        usage.record(AiUsageService.QUIZ_WRITE, "test-model", 50, 10, 1000, null);
        usage.record(AiUsageService.COMPARE, "test-model", 0, 0, 500, "boom");

        Map<String, Object> report = usage.report(1);
        Map<String, Object> totals = (Map<String, Object>) report.get("totals");
        assertEquals(before + 150, ((Number) totals.get("inputTokens")).longValue());
        List<Map<String, Object>> features = (List<Map<String, Object>>) report.get("features");
        Map<String, Object> quiz = features.stream().filter(f -> "quiz_write".equals(f.get("feature"))).findFirst().orElseThrow();
        assertTrue(((Number) quiz.get("calls")).longValue() >= 2);
        Map<String, Object> compare = features.stream().filter(f -> "compare".equals(f.get("feature"))).findFirst().orElseThrow();
        assertTrue(((Number) compare.get("errors")).longValue() >= 1);
        assertFalse(((List<?>) report.get("recentErrors")).isEmpty());
    }
}
