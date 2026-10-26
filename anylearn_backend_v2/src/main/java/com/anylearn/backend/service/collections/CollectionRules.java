package com.anylearn.backend.service.collections;

import com.anylearn.backend.service.PersonNames;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.regex.Pattern;

/** Pure rules of collections: the address of the page, when it is shown, which courses count. */
public final class CollectionRules {

    private static final Pattern SLUG = Pattern.compile("[a-z0-9]+(-[a-z0-9]+)*");
    public static final int MAX_SLUG_LENGTH = 120;

    private CollectionRules() {}

    /** "Hè không màn hình!" -> "he-khong-man-hinh". */
    public static String slugOf(String title) {
        String slug = PersonNames.normalize(title).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        return slug.length() > MAX_SLUG_LENGTH ? slug.substring(0, MAX_SLUG_LENGTH).replaceAll("-+$", "") : slug;
    }

    public static boolean isValidSlug(String slug) {
        return slug != null && slug.length() <= MAX_SLUG_LENGTH && SLUG.matcher(slug).matches();
    }

    /** Shown from `from` to `to`, both days included; an empty end is open. */
    public static boolean isInSeason(LocalDate from, LocalDate to, LocalDate today) {
        if (from != null && today.isBefore(from)) return false;
        return to == null || !today.isAfter(to);
    }

    /** The courses of a list keep the order an admin gave them; a course listed twice counts once. */
    public static List<Long> distinctInOrder(List<Long> itemIds) {
        return itemIds == null ? List.of() : List.copyOf(new LinkedHashSet<>(itemIds.stream().filter(id -> id != null && id > 0).toList()));
    }
}
