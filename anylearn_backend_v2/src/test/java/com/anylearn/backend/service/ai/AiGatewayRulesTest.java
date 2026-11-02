package com.anylearn.backend.service.ai;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AiGatewayRulesTest {

    private static final Map<String, Object> TOOL = Map.of("name", "write_questions", "input_schema", Map.of("type", "object"));

    private static AiGatewayRules.Request req(String feature, String system, String user, int maxTokens, Map<String, Object> tool) {
        return new AiGatewayRules.Request(feature, system, user, maxTokens, tool);
    }

    @Test
    void acceptsAPartnerFeatureWithAPromptAndATool() {
        assertNull(AiGatewayRules.problem(req(AiUsageService.P11OF_QUIZ_WRITE, "sys", "viết 10 câu", 6000, TOOL)));
        assertNull(AiGatewayRules.problem(req(AiUsageService.P11OF_QUIZ_VERIFY, "sys", "làm bài", 1, TOOL)));
    }

    @Test
    void refusesAnylearnsOwnFeaturesAndUnknownOnes() {
        assertNotNull(AiGatewayRules.problem(req(AiUsageService.QUIZ_WRITE, "sys", "u", 100, TOOL)));
        assertNotNull(AiGatewayRules.problem(req("11of_other", "sys", "u", 100, TOOL)));
        assertNotNull(AiGatewayRules.problem(req(null, "sys", "u", 100, TOOL)));
    }

    @Test
    void refusesMissingPromptsTooManyTokensAndBadTools() {
        String f = AiUsageService.P11OF_QUIZ_WRITE;
        assertNotNull(AiGatewayRules.problem(req(f, " ", "u", 100, TOOL)));
        assertNotNull(AiGatewayRules.problem(req(f, "sys", null, 100, TOOL)));
        assertNotNull(AiGatewayRules.problem(req(f, "sys", "x".repeat(AiGatewayRules.MAX_PROMPT_CHARS), 100, TOOL)));
        assertNotNull(AiGatewayRules.problem(req(f, "sys", "u", 0, TOOL)));
        assertNotNull(AiGatewayRules.problem(req(f, "sys", "u", AiGatewayRules.MAX_OUTPUT_TOKENS + 1, TOOL)));
        assertNotNull(AiGatewayRules.problem(req(f, "sys", "u", 100, null)));
        assertNotNull(AiGatewayRules.problem(req(f, "sys", "u", 100, Map.of("name", "a b", "input_schema", Map.of()))));
        assertNotNull(AiGatewayRules.problem(req(f, "sys", "u", 100, Map.of("name", "ok"))));
        assertNotNull(AiGatewayRules.problem(null));
    }

    @Test
    void capOfZeroSwitchesTheGatewayOff() {
        assertFalse(AiGatewayRules.overCap(0, 1000));
        assertFalse(AiGatewayRules.overCap(999, 1000));
        assertTrue(AiGatewayRules.overCap(1000, 1000));
        assertTrue(AiGatewayRules.overCap(0, 0));
    }

    @Test
    void everyPartnerFeatureHasThePrefixALabelAndAModelSetting() {
        for (String f : AiGatewayRules.FEATURES) {
            assertTrue(f.startsWith(AiGatewayRules.PARTNER_PREFIX), f);
            assertTrue(AiUsageService.LABELS.containsKey(f), f);
            assertTrue(AiModelSettings.FEATURES.contains(f), f);
            assertTrue(f.length() <= 30, "ai_usage_log.feature is VARCHAR(30): " + f);
        }
    }
}
