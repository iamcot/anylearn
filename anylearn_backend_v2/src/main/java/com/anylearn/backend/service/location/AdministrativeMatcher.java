package com.anylearn.backend.service.location;

import com.anylearn.backend.service.PersonNames;

import java.util.List;
import java.util.Optional;

/** Finds our province, district or ward code from the name Google gives ("Thành phố Hồ Chí Minh", "Quận 3"). */
public final class AdministrativeMatcher {

    public record Entry(String code, String name) {}

    private static final List<String> TYPE_WORDS = List.of(
            "thanh pho", "thi xa", "thi tran", "tinh", "quan", "huyen", "phuong", "xa", "tp.", "tp");

    private AdministrativeMatcher() {}

    public static Optional<String> matchCode(List<Entry> candidates, String googleName) {
        String wanted = withoutType(googleName);
        if (wanted.isEmpty()) return Optional.empty();
        return candidates.stream()
                .filter(entry -> withoutType(entry.name()).equals(wanted))
                .map(Entry::code)
                .findFirst();
    }

    static String withoutType(String name) {
        String normalized = PersonNames.normalize(name);
        for (String type : TYPE_WORDS) {
            if (normalized.startsWith(type + " ")) return normalized.substring(type.length() + 1).trim();
        }
        return normalized;
    }
}
