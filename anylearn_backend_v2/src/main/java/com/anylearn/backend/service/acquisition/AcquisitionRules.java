package com.anylearn.backend.service.acquisition;

import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Pure rules of "Nguồn khách" (plan 19.A4): cleaning UTM values and naming a channel. */
public final class AcquisitionRules {

    private AcquisitionRules() {}

    public static final int MAX_VALUE = 100;
    public static final int MAX_PATH = 300;
    /** Landing calls one browser (IP) may make per minute. */
    public static final int LANDING_PER_MINUTE = 30;
    public static final String[] FIELDS = {"utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"};

    private static final Pattern EXPLORE_PATH = Pattern.compile("^/fun/explore/(\\d{1,12})(?:/|$|\\?)");
    private static final Pattern EXPLORE_CONTENT = Pattern.compile("^(?:explore|kp|post)[-_]?(\\d{1,12})$");

    /**
     * A UTM value as stored: trimmed, control characters dropped, at most 100 characters; source, medium and campaign
     * lower case (Facebook and facebook are one channel). Blank = null.
     */
    public static String clean(String field, String raw) {
        if (raw == null) return null;
        String value = raw.replaceAll("[\\p{Cntrl}]", "").trim();
        if (value.isEmpty()) return null;
        if (!"utm_content".equals(field) && !"utm_term".equals(field)) value = value.toLowerCase(Locale.ROOT);
        return value.length() > MAX_VALUE ? value.substring(0, MAX_VALUE) : value;
    }

    /** The UTM values of a request body ({utm_source: ...}), cleaned, nulls kept out. */
    public static Map<String, String> utm(Map<String, ?> body) {
        Map<String, String> out = new LinkedHashMap<>();
        if (body == null) return out;
        for (String f : FIELDS) {
            Object v = body.get(f);
            String c = clean(f, v == null ? null : String.valueOf(v));
            if (c != null) out.put(f, c);
        }
        return out;
    }

    /** Path part of a landing address (no host, no fragment), at most 300 characters; anything not starting with "/" = null. */
    public static String cleanPath(String raw) {
        if (raw == null) return null;
        String path = raw.trim();
        if (!path.startsWith("/") || path.startsWith("//")) return null;
        int hash = path.indexOf('#');
        if (hash >= 0) path = path.substring(0, hash);
        return path.length() > MAX_PATH ? path.substring(0, MAX_PATH) : path;
    }

    /** The Khám phá post a person landed on: from the address /fun/explore/{id}/..., else from a content code "explore-12". */
    public static Long explorePostId(String landingPath, String utmContent) {
        if (landingPath != null) {
            Matcher m = EXPLORE_PATH.matcher(landingPath);
            if (m.find()) return Long.parseLong(m.group(1));
        }
        if (utmContent != null) {
            Matcher m = EXPLORE_CONTENT.matcher(utmContent.trim().toLowerCase(Locale.ROOT));
            if (m.matches()) return Long.parseLong(m.group(1));
        }
        return null;
    }

    /** "2026-10-29T10:20:00.000Z" or epoch milliseconds → a date-time, or null; never later than `now`. */
    public static LocalDateTime firstSeen(String raw, LocalDateTime now) {
        if (raw == null || raw.isBlank()) return null;
        try {
            LocalDateTime at;
            if (raw.trim().matches("\\d{10,14}")) {
                at = LocalDateTime.ofInstant(java.time.Instant.ofEpochMilli(Long.parseLong(raw.trim())), java.time.ZoneId.systemDefault());
            } else {
                at = LocalDateTime.ofInstant(java.time.Instant.parse(raw.trim()), java.time.ZoneId.systemDefault());
            }
            return at.isAfter(now) ? now : at;
        } catch (DateTimeParseException | NumberFormatException e) {
            return null;
        }
    }

    /** The label of a channel in the report: source / medium, "giới thiệu" for a referral link alone, "trực tiếp" for none. */
    public static String channel(String source, String medium, String ref) {
        if (source == null || source.isBlank()) return ref != null && !ref.isBlank() ? "giới thiệu" : "trực tiếp";
        return medium == null || medium.isBlank() ? source : source + " / " + medium;
    }

    /** Days of a report: 7, 30 or 90 (anything else = 30). */
    public static int days(int raw) {
        return raw == 7 || raw == 90 ? raw : 30;
    }
}
