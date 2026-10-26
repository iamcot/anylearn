package com.anylearn.backend.service.insights;

/** What a visitor asked the search for (the same fields the search API takes). */
public record SearchQuery(String keyword, String mode, String category, String age, String price, String location,
                          String format, Long authorId) {

    boolean hasKeyword() {
        return keyword != null && !keyword.isBlank();
    }

    boolean hasFilter() {
        return notBlank(category) || notBlank(age) || notBlank(price) || notBlank(location) || notBlank(format);
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
