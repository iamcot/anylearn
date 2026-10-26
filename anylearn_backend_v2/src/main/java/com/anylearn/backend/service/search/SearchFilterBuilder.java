package com.anylearn.backend.service.search;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/** Turns {@link SearchFilters} into MeiliSearch filter clauses; every clause is ANDed, ORs live inside one clause. */
public final class SearchFilterBuilder {

    public static final double DEFAULT_RADIUS_KM = 10;
    public static final double MAX_RADIUS_KM = 100;

    private SearchFilterBuilder() {}

    public static List<String> build(SearchFilters f) {
        List<String> clauses = new ArrayList<>(List.of("status = 1", "userStatus = 1"));
        if (notBlank(f.category())) clauses.add("categoryUrls = " + quote(f.category()));
        if (f.authorId() != null) clauses.add("authorId = " + f.authorId());
        addAgeBucket(clauses, f.ageBucket());
        addLearnerAge(clauses, f.learnerAgeMin(), f.learnerAgeMax());
        addPriceBucket(clauses, f.priceBucket());
        if (f.priceMin() != null) clauses.add("price >= " + f.priceMin());
        if (f.priceMax() != null) clauses.add("price <= " + f.priceMax());
        if (notBlank(f.provinceCode())) clauses.add("authorProvinceCodes = " + quote(f.provinceCode()));
        if (notBlank(f.districtCode())) clauses.add("districtCodes = " + quote(f.districtCode()));
        addMode(clauses, f.mode());
        if (f.hasNear()) clauses.add(String.format(java.util.Locale.ROOT, "_geoRadius(%s, %s, %d)",
                f.nearLat(), f.nearLng(), Math.round(radiusKm(f.radiusKm()) * 1000)));
        addAnyOf(clauses, "timeSlots", f.timeSlots() == null ? List.of() : f.timeSlots().stream().filter(TimeSlots.ALL::contains).toList());
        if (notBlank(f.partnerType())) clauses.add("partnerType = " + quote(f.partnerType()));
        if (f.freeTrial()) clauses.add("hasFreeTrial = true");
        if (f.onSale()) clauses.add("onSale = true");
        if (f.tagIds() != null && !f.tagIds().isEmpty())
            clauses.add("(" + f.tagIds().stream().map(id -> "tagIds = " + id).collect(Collectors.joining(" OR ")) + ")");
        addStartWithin(clauses, f);
        return clauses;
    }

    public static double radiusKm(Double requested) {
        if (requested == null || requested <= 0) return DEFAULT_RADIUS_KM;
        return Math.min(requested, MAX_RADIUS_KM);
    }

    private static void addAgeBucket(List<String> clauses, String bucket) {
        if (bucket == null) return;
        switch (bucket) {
            case "3-5" -> { clauses.add("agesMin <= 5"); clauses.add("agesMax >= 3"); }
            case "6-10" -> { clauses.add("agesMin <= 10"); clauses.add("agesMax >= 6"); }
            case "11-15" -> { clauses.add("agesMin <= 15"); clauses.add("agesMax >= 11"); }
            case "16+" -> clauses.add("agesMax >= 16");
            default -> { }
        }
    }

    // A course with no age limit suits everyone, so it stays in the results.
    private static void addLearnerAge(List<String> clauses, Integer youngest, Integer oldest) {
        if (youngest == null || oldest == null) return;
        clauses.add("(agesMin NOT EXISTS OR agesMin IS NULL OR agesMin <= " + oldest + ")");
        clauses.add("(agesMax NOT EXISTS OR agesMax IS NULL OR agesMax >= " + youngest + ")");
    }

    private static void addPriceBucket(List<String> clauses, String bucket) {
        if (bucket == null) return;
        switch (bucket) {
            case "under2" -> clauses.add("price < 2000000");
            case "2to5" -> { clauses.add("price >= 2000000"); clauses.add("price <= 5000000"); }
            case "over5" -> clauses.add("price > 5000000");
            default -> { }
        }
    }

    private static void addMode(List<String> clauses, String mode) {
        if (mode == null) return;
        switch (mode) {
            case "online" -> clauses.add("subtype = \"online\"");
            case "digital" -> clauses.add("subtype = \"digital\"");
            case "offline" -> { clauses.add("subtype != \"online\""); clauses.add("subtype != \"digital\""); }
            default -> { }
        }
    }

    private static void addAnyOf(List<String> clauses, String field, List<String> values) {
        if (values.isEmpty()) return;
        clauses.add("(" + values.stream().map(v -> field + " = " + quote(v)).collect(Collectors.joining(" OR ")) + ")");
    }

    private static void addStartWithin(List<String> clauses, SearchFilters f) {
        if (f.startWithinDays() == null || f.startWithinDays() < 0 || f.today() == null) return;
        long today = f.today().toEpochDay();
        clauses.add("nextStartDay >= " + today);
        clauses.add("nextStartDay <= " + (today + f.startWithinDays()));
    }

    static String quote(String value) {
        return "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
