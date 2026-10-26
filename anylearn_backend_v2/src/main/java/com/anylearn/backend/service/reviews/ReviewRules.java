package com.anylearn.backend.service.reviews;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Pure rules of reviews: the criteria, how the overall stars are decided, what text and photos are accepted. */
public final class ReviewRules {

    /** The four things a parent scores from 1 to 5, in the order they are shown. */
    public static final List<String> CRITERIA = List.of("teacher", "facility", "progress", "value");
    public static final int MAX_COMMENT_LENGTH = 2000;
    public static final int MAX_REPLY_LENGTH = 2000;
    public static final int MAX_MEDIA = 4;
    public static final String PUBLISHED = "published";
    public static final String HIDDEN = "hidden";

    private ReviewRules() {}

    /** Keeps the known criteria with a score of 1 to 5; anything else is dropped. */
    public static Map<String, Integer> cleanScores(Map<?, ?> raw) {
        Map<String, Integer> scores = new LinkedHashMap<>();
        if (raw == null) return scores;
        for (String criterion : CRITERIA) {
            if (raw.get(criterion) instanceof Number number && number.intValue() >= 1 && number.intValue() <= 5) {
                scores.put(criterion, number.intValue());
            }
        }
        return scores;
    }

    /** The stars shown: the one given (1 to 5), otherwise the rounded average of the scores, otherwise 0 (invalid). */
    public static int overallRating(Integer given, Map<String, Integer> scores) {
        if (given != null && given >= 1 && given <= 5) return given;
        if (scores.isEmpty()) return 0;
        double sum = scores.values().stream().mapToInt(Integer::intValue).sum();
        return (int) Math.round(sum / scores.size());
    }

    public static String cleanText(String text, int maxLength) {
        if (text == null) return "";
        String trimmed = text.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) : trimmed;
    }

    /** Photo addresses that belong to our storage, at most {@link #MAX_MEDIA}, each once. */
    public static List<String> cleanMedia(List<?> raw, java.util.function.Predicate<String> isOurs) {
        List<String> urls = new ArrayList<>();
        if (raw == null) return urls;
        for (Object value : raw) {
            if (value instanceof String url && isOurs.test(url) && !urls.contains(url)) urls.add(url);
            if (urls.size() == MAX_MEDIA) break;
        }
        return urls;
    }

    public static boolean isKnownStatus(String status) {
        return PUBLISHED.equals(status) || HIDDEN.equals(status);
    }
}
