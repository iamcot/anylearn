package com.anylearn.backend.service.interests;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/** Pure rules of the optional interest survey of a child: which answers exist and how many are kept. */
public final class LearnerInterestRules {

    public static final String LIKES = "likes";
    public static final String WANTS = "wants";
    public static final String BUDGET = "budget";
    public static final int MAX_PER_QUESTION = 8;

    /** Same keys as `config/interests.ts` in the web app, which holds the Vietnamese labels. */
    public static final Set<String> INTERESTS = Set.of("chess", "art", "swim", "english", "coding", "dance", "music",
            "sports", "life_skills", "math", "science", "reading");
    /** Monthly budget in thousand dong: under 500, 500 to 1000, 1000 to 2000, over 2000. */
    public static final Set<String> BUDGETS = Set.of("lt500", "500_1000", "1000_2000", "gt2000");

    private LearnerInterestRules() {}

    /** Known interest keys, each once, in the order given, at most {@link #MAX_PER_QUESTION}; anything else is dropped. */
    public static List<String> cleanInterests(List<?> raw) {
        List<String> keys = new ArrayList<>();
        if (raw == null) return keys;
        for (Object value : raw) {
            if (value instanceof String key && INTERESTS.contains(key) && !keys.contains(key)) keys.add(key);
            if (keys.size() == MAX_PER_QUESTION) break;
        }
        return keys;
    }

    /** The budget key, or null when none (or an unknown one) was chosen. */
    public static String cleanBudget(Object raw) {
        return raw instanceof String key && BUDGETS.contains(key) ? key : null;
    }
}
