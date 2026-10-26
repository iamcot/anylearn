package com.anylearn.backend.service.tags;

import com.anylearn.backend.entity.Tag;
import com.anylearn.backend.service.PersonNames;

import java.util.List;
import java.util.Optional;

/** Rules for the tag dictionary that need no database. */
public final class TagRules {

    public static final int MAX_NAME_LENGTH = 100;

    private TagRules() {}

    /** Trims and collapses spaces; null when nothing usable is left or the name is too long. */
    public static String cleanName(String raw) {
        if (raw == null) return null;
        String name = raw.trim().replaceAll("\\s+", " ");
        if (name.isEmpty() || name.length() > MAX_NAME_LENGTH) return null;
        return name;
    }

    /** "Bóng rổ", "bong ro" and "BÓNG  RỔ" are one tag. */
    public static Optional<Tag> findSameName(List<Tag> existing, String name, Long exceptId) {
        return existing.stream()
                .filter(tag -> !tag.getId().equals(exceptId))
                .filter(tag -> PersonNames.sameName(tag.getName(), name))
                .findFirst();
    }
}
