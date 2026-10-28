package com.anylearn.backend.service.ai;

import java.util.Map;

/** List prices of the Anthropic API in USD per million tokens (input, output), used only to show an estimate in the back office. */
public final class AiPricing {

    private AiPricing() {}

    /** Prices for prompts up to 100K tokens; cache discounts and long-prompt surcharges are not counted. Update when Anthropic changes them. */
    private static final Map<String, double[]> PRICES = Map.ofEntries(
            Map.entry("claude-haiku-5-5", new double[]{0.10, 0.50}),
            Map.entry("claude-haiku-4-5", new double[]{1.00, 5.00}),
            Map.entry("claude-sonnet-5-5", new double[]{2.00, 10.00}),
            Map.entry("claude-sonnet-5", new double[]{2.00, 10.00}),
            Map.entry("claude-sonnet-4-6", new double[]{3.00, 15.00}),
            Map.entry("claude-opus-5-5", new double[]{4.00, 20.00}),
            Map.entry("claude-opus-5", new double[]{5.00, 25.00}),
            Map.entry("claude-opus-4-8", new double[]{5.00, 25.00}),
            Map.entry("claude-opus-4-7", new double[]{5.00, 25.00}),
            Map.entry("claude-opus-4-6", new double[]{5.00, 25.00}),
            Map.entry("claude-fable-5-1", new double[]{10.00, 50.00}),
            Map.entry("claude-fable-5", new double[]{10.00, 50.00}));

    /** USD per million tokens {input, output} or null for a model we have no price for. */
    public static double[] prices(String model) {
        return model == null ? null : PRICES.get(model);
    }

    /** Estimated cost in USD of the tokens, or 0 when the model has no known price. */
    public static double cost(String model, long inputTokens, long outputTokens) {
        double[] p = prices(model);
        if (p == null) return 0;
        return (inputTokens * p[0] + outputTokens * p[1]) / 1_000_000.0;
    }

    public static boolean known(String model) {
        return prices(model) != null;
    }
}
