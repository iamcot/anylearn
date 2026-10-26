package com.anylearn.backend.entity;

import java.util.LinkedHashMap;
import java.util.Map;

/** The groups a tag can belong to. "other" is the inbox for tags nobody sorted yet. */
public final class TagGroups {

    public static final String OTHER = "other";

    public static final Map<String, String> LABELS = new LinkedHashMap<>();
    static {
        LABELS.put("sport", "Thể thao");
        LABELS.put("language", "Ngoại ngữ");
        LABELS.put("stem", "STEM / Công nghệ");
        LABELS.put("art", "Nghệ thuật");
        LABELS.put("academic", "Học thuật");
        LABELS.put("life", "Kỹ năng sống");
        LABELS.put(OTHER, "Chưa phân loại");
    }

    private TagGroups() {}

    public static boolean isValid(String group) {
        return group != null && LABELS.containsKey(group);
    }
}
