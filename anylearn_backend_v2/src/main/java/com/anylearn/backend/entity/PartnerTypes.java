package com.anylearn.backend.entity;

import java.util.LinkedHashMap;
import java.util.Map;

/** Kinds of partner shown as a filter ("trường", "trung tâm"...). Set on the partner, not on each course. */
public final class PartnerTypes {

    public static final Map<String, String> LABELS = new LinkedHashMap<>();
    static {
        LABELS.put("school", "Trường học");
        LABELS.put("center", "Trung tâm");
        LABELS.put("club", "Câu lạc bộ");
        LABELS.put("tutor", "Gia sư");
        LABELS.put("expert", "Chuyên gia");
    }

    private PartnerTypes() {}

    public static boolean isValid(String type) {
        return type != null && LABELS.containsKey(type);
    }
}
