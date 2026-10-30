package com.anylearn.backend.service.seo;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

/** Pure rules of the public links (plan 19.A1 / 19.A3): slugs and the pages of the sitemap. */
public final class SeoRules {

    private SeoRules() {}

    /** Kinds of link in the sitemap, in the order the index lists them. */
    public static final List<String> TYPES = List.of("course", "partner", "article", "collection", "pathway", "explore", "landing");
    /** Links per sitemap file (Google allows 50,000; smaller files are cheaper to rebuild). */
    public static final int PAGE_SIZE = 10_000;
    /** Longest slug kept in a link. */
    public static final int MAX_SLUG = 80;
    /** A landing page "{môn} cho trẻ {tuổi} tại {quận}" exists only with at least this many real courses (plan 19.A7). */
    public static final int LANDING_MIN_COURSES = 3;

    /** "Bé học Bơi: 5 tuổi!" → "be-hoc-boi-5-tuoi"; the same result as the site's `slugify`. Empty text = "bai-viet". */
    public static String slug(String text) {
        if (text == null) return "bai-viet";
        String plain = Normalizer.normalize(text.replace('đ', 'd').replace('Đ', 'D'), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        String slug = plain.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
        if (slug.length() > MAX_SLUG) slug = slug.substring(0, MAX_SLUG).replaceAll("-+$", "");
        return slug.isEmpty() ? "bai-viet" : slug;
    }

    public static boolean knownType(String type) {
        return type != null && TYPES.contains(type);
    }

    /** Number of sitemap files for `count` links (at least 1 when there is a link). */
    public static int pages(long count) {
        return count <= 0 ? 0 : (int) ((count + PAGE_SIZE - 1) / PAGE_SIZE);
    }

    /** 1-based page number clamped to at least 1. */
    public static int offset(int page) {
        return (Math.max(page, 1) - 1) * PAGE_SIZE;
    }
}
