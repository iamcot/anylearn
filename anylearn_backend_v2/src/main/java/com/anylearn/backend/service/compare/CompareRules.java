package com.anylearn.backend.service.compare;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;

/** Pure rules of the course comparison (plan 04.6): which ids are taken, what the AI reads, what is flagged. */
public final class CompareRules {

    public static final int MAX_COURSES = 3;
    private static final int MAX_DESCRIPTION_CHARS = 3000;
    private static final int MAX_FACT_CHARS = 160;
    private static final ObjectMapper JSON = new ObjectMapper();

    /** What the AI may fill per course. Each is a short phrase taken from the description, or absent when it says nothing. */
    public static final Map<String, String> FACT_LABELS = labels(
            "audience", "Phù hợp với",
            "method", "Cách học",
            "includes", "Đã bao gồm",
            "bring", "Cần chuẩn bị",
            "outcome", "Kết quả mong đợi");

    private CompareRules() {}

    private static Map<String, String> labels(String... pairs) {
        Map<String, String> map = new LinkedHashMap<>();
        for (int i = 0; i + 1 < pairs.length; i += 2) map.put(pairs[i], pairs[i + 1]);
        return map;
    }

    /** Ids from the request in the order given, without repeats, at most {@link #MAX_COURSES}; junk is skipped. */
    public static List<Long> parseIds(String csv) {
        List<Long> ids = new ArrayList<>();
        if (csv == null) return ids;
        for (String part : csv.split(",")) {
            if (ids.size() >= MAX_COURSES) break;
            try {
                long id = Long.parseLong(part.trim());
                if (id > 0 && !ids.contains(id)) ids.add(id);
            } catch (NumberFormatException ignored) {
                // skip
            }
        }
        return ids;
    }

    /** The description as plain text the AI can read: tags and entities removed, spaces folded, cut to a fixed size. */
    public static String plainText(String html) {
        if (html == null) return "";
        String text = html.replaceAll("(?is)<(script|style)[^>]*>.*?</\\1>", " ")
                .replaceAll("(?i)<br\\s*/?>|</p>|</li>|</div>|</h[1-6]>", "\n")
                .replaceAll("<[^>]+>", " ")
                .replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"")
                .replaceAll("[ \\t\\x0B\\f\\r]+", " ")
                .replaceAll("\\s*\\n\\s*", "\n").trim();
        return text.length() > MAX_DESCRIPTION_CHARS ? text.substring(0, MAX_DESCRIPTION_CHARS) : text;
    }

    /** Fingerprint of everything the AI reads about a course; the stored facts are valid while it is unchanged. */
    public static String contentHash(String title, String shortContent, String content) {
        String joined = (title == null ? "" : title) + "\n" + plainText(shortContent) + "\n" + plainText(content);
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(joined.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    /** A description too short to say anything is not sent to the AI. */
    public static boolean worthReading(String title, String shortContent, String content) {
        return plainText(shortContent).length() + plainText(content).length() >= 40;
    }

    /**
     * Reads the AI's tool input `{"courses":[{"id":1,"audience":"...",...}]}`. Only allowed ids and known keys are kept,
     * empty or "không nêu" values are dropped (the page shows "Mô tả không nêu"), long values are cut.
     */
    public static Map<Long, Map<String, String>> parseFacts(String json, Set<Long> allowed) {
        Map<Long, Map<String, String>> result = new LinkedHashMap<>();
        if (json == null) return result;
        try {
            for (JsonNode course : JSON.readTree(json).path("courses")) {
                long id = course.path("id").asLong(0);
                if (!allowed.contains(id) || result.containsKey(id)) continue;
                Map<String, String> facts = new LinkedHashMap<>();
                for (String key : FACT_LABELS.keySet()) {
                    String value = course.path(key).asText("").trim();
                    if (value.isEmpty() || isNone(value)) continue;
                    facts.put(key, value.length() > MAX_FACT_CHARS ? value.substring(0, MAX_FACT_CHARS) : value);
                }
                result.put(id, facts);
            }
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
        return result;
    }

    private static boolean isNone(String value) {
        String v = value.toLowerCase(Locale.ROOT);
        return v.equals("null") || v.equals("n/a") || v.startsWith("không nêu") || v.startsWith("không có thông tin");
    }

    /**
     * Index of the best value of a row (lowest when {@code lowerIsBetter}); null when fewer than two courses have a
     * value or the best is shared, so nothing is highlighted when it would not say anything.
     */
    public static Integer bestIndex(List<? extends Number> values, boolean lowerIsBetter) {
        Integer best = null;
        boolean tie = false;
        int known = 0;
        for (int i = 0; i < values.size(); i++) {
            Number v = values.get(i);
            if (v == null) continue;
            known++;
            if (best == null) { best = i; continue; }
            int cmp = Double.compare(v.doubleValue(), values.get(best).doubleValue());
            if (cmp == 0) tie = true;
            else if ((cmp < 0) == lowerIsBetter) { best = i; tie = false; }
        }
        return known < 2 || tie ? null : best;
    }

    /** Courses of different formats make "price per session" a loose figure; the page says so. */
    public static boolean mixedFormats(List<String> subtypes) {
        return subtypes.stream().filter(Objects::nonNull).map(s -> s.equals("online") || s.equals("video") ? "online" : "offline")
                .distinct().count() > 1;
    }

    private static final Map<String, String> DAYS = Map.of(
            "mon", "T2", "tue", "T3", "wed", "T4", "thu", "T5", "fri", "T6", "sat", "T7", "sun", "CN");

    /** "T2, T4 · 18:00-19:30" from a class's weekdays and times; empty when it has none. */
    public static String scheduleLine(String weekdays, String timeStart, String timeEnd) {
        return scheduleLine(weekdays, timeStart, timeEnd, false);
    }

    /** As above; a flexible ("open") class says so, and with no day or time it is just "Linh hoạt". */
    public static String scheduleLine(String weekdays, String timeStart, String timeEnd, boolean flexible) {
        String line = plainScheduleLine(weekdays, timeStart, timeEnd);
        if (!flexible) return line;
        return line.isEmpty() ? "Linh hoạt, chọn ngày bắt đầu" : line + " (linh hoạt)";
    }

    private static String plainScheduleLine(String weekdays, String timeStart, String timeEnd) {
        List<String> days = new ArrayList<>();
        if (weekdays != null) {
            for (String day : weekdays.split(",")) {
                String label = DAYS.get(day.trim().toLowerCase(Locale.ROOT));
                if (label != null) days.add(label);
            }
        }
        String time = timeStart == null || timeStart.isBlank() ? "" : timeEnd == null || timeEnd.isBlank() ? timeStart : timeStart + "-" + timeEnd;
        String joined = String.join(", ", days);
        if (joined.isEmpty()) return time;
        return time.isEmpty() ? joined : joined + " · " + time;
    }

    /** What a course is about, as the system knows it: its categories and tags (lower case, to match across courses). */
    public record Topic(String title, List<String> categories, Set<String> keys) {}

    /** The note above the table and the columns it points at (indexes into the list given). */
    public record FieldNotice(String text, List<Integer> off) {}

    /**
     * Whether the picked courses are about the same field, from shared categories or tags (no AI, so it can be checked).
     * Two courses are related when they share a category or a tag. A course related to none of the others is "off";
     * nothing is said when the courses are all related or merely chained, or when a course has no category and no tag
     * (unknown is not "different"). Returns null when there is nothing to say.
     */
    public static FieldNotice fieldNotice(List<Topic> topics) {
        List<Integer> known = new ArrayList<>();
        for (int i = 0; i < topics.size(); i++) if (!topics.get(i).keys().isEmpty()) known.add(i);
        if (known.size() < 2) return null;
        List<Integer> isolated = new ArrayList<>();
        for (int i : known) {
            boolean related = false;
            for (int j : known) {
                if (i != j && !Collections.disjoint(topics.get(i).keys(), topics.get(j).keys())) { related = true; break; }
            }
            if (!related) isolated.add(i);
        }
        if (isolated.isEmpty()) return null;
        if (isolated.size() == known.size()) {
            String text = known.size() == 2
                    ? "Hai khóa này thuộc lĩnh vực khác nhau (" + describe(topics.get(known.get(0))) + " và " + describe(topics.get(known.get(1))) + "), nên số liệu chỉ để tham khảo."
                    : "Các khóa này thuộc những lĩnh vực khác nhau, nên số liệu chỉ để tham khảo.";
            return new FieldNotice(text, isolated);
        }
        List<String> names = isolated.stream().map(i -> "\"" + topics.get(i).title() + "\" (" + describe(topics.get(i)) + ")").toList();
        return new FieldNotice((isolated.size() == 1 ? "Khóa " : "Các khóa ") + String.join(", ", names)
                + " thuộc lĩnh vực khác so với các khóa còn lại.", isolated);
    }

    private static String describe(Topic topic) {
        return topic.categories().isEmpty() ? "chưa rõ danh mục" : String.join(", ", topic.categories().stream().limit(2).toList());
    }
}
