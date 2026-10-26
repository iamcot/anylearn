package com.anylearn.backend.service;

import com.anylearn.backend.entity.User;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

/** Names of people in a family: "Bé Bin", "be  bin" and "BÉ BIN" are the same name; "Đức" and "duc" too. */
public final class PersonNames {

    private PersonNames() {}

    public static String normalize(String name) {
        if (name == null) return "";
        String withoutMarks = Normalizer.normalize(name, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return withoutMarks.replace('đ', 'd').replace('Đ', 'd')
                .toLowerCase(Locale.ROOT).trim().replaceAll("\\s+", " ");
    }

    public static boolean sameName(String first, String second) {
        return !normalize(first).isEmpty() && normalize(first).equals(normalize(second));
    }

    /** A parent cannot have two children with the same name: the pickers list children by name only. */
    public static void requireUniqueChildName(List<User> children, String name, Long exceptChildId) {
        boolean taken = children.stream()
                .filter(child -> !child.getId().equals(exceptChildId))
                .anyMatch(child -> sameName(child.getName(), name));
        if (taken) throw new IllegalArgumentException("Đã có bé tên \"" + name.trim() + "\" trong tài khoản. Vui lòng đặt tên khác.");
    }
}
