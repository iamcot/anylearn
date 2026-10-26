package com.anylearn.backend.service.insights;

import java.util.Set;
import java.util.regex.Pattern;

/** Which searches are worth a row, and how raw request values are cleaned before they are stored. */
public final class SearchLogPolicy {

    static final int MAX_KEYWORD_LENGTH = 255;
    static final int MAX_SESSION_KEY_LENGTH = 64;
    static final int MAX_REF_LENGTH = 40;
    static final int MAX_FILTER_LENGTH = 10;
    static final int MAX_CATEGORY_LENGTH = 100;
    static final int MAX_LEARNER_AGE = 100;
    private static final Pattern REF = Pattern.compile("[A-Za-z0-9_-]{8," + MAX_REF_LENGTH + "}");
    private static final Set<String> AUDIENCES = Set.of("child", "self");
    private static final Set<String> MODES = Set.of("class", "school", "teacher");

    private SearchLogPolicy() {}

    /**
     * Only the first page of a search with a keyword or a filter counts: paging and the empty browse page say nothing about
     * what the visitor wants, and a search needs a valid ref so its click can be linked.
     */
    public static boolean shouldLog(SearchQuery query, int page, SearchContext context) {
        if (page != 0 || context == null || !isValidRef(context.ref())) return false;
        return query.hasKeyword() || query.hasFilter();
    }

    public static boolean isValidRef(String ref) {
        return ref != null && REF.matcher(ref).matches();
    }

    public static String clean(String value, int maxLength) {
        if (value == null) return null;
        String trimmed = value.strip();
        if (trimmed.isEmpty()) return null;
        return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength);
    }

    public static String cleanKeyword(String keyword) {
        return clean(keyword, MAX_KEYWORD_LENGTH);
    }

    public static String cleanFilter(String filter) {
        return clean(filter, MAX_FILTER_LENGTH);
    }

    public static String cleanMode(String mode) {
        return mode != null && MODES.contains(mode) ? mode : "class";
    }

    public static String cleanAudience(String audience) {
        return audience != null && AUDIENCES.contains(audience) ? audience : null;
    }

    public static Integer cleanLearnerAge(Integer age) {
        return age != null && age >= 0 && age <= MAX_LEARNER_AGE ? age : null;
    }
}
