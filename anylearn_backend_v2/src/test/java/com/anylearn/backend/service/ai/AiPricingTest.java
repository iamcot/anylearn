package com.anylearn.backend.service.ai;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AiPricingTest {

    @Test
    void costsAMillionTokensAtTheListPrice() {
        assertEquals(0.60, AiPricing.cost("claude-haiku-5-5", 1_000_000, 1_000_000), 1e-9);
        assertEquals(0.0003, AiPricing.cost("claude-haiku-5-5", 1_000, 400), 1e-9);
    }

    @Test
    void unknownModelCostsNothing() {
        assertFalse(AiPricing.known("some-model"));
        assertEquals(0, AiPricing.cost("some-model", 5_000, 5_000));
        assertEquals(0, AiPricing.cost(null, 5_000, 5_000));
    }
}
