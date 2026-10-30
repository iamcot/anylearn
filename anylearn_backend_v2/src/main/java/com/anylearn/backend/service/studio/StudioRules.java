package com.anylearn.backend.service.studio;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

/**
 * Pure rules of the content studio (plan 19.A6): machine keys for t2m, which paths a key may call, the social queue
 * (channels, statuses) and the tracked link a social post points to.
 */
public final class StudioRules {

    private StudioRules() {}

    public static final String KEY_PREFIX = "al_";
    public static final String HEADER = "X-Api-Key";
    /** Request attribute set when a call is made with a machine key (its id). */
    public static final String REQUEST_ATTRIBUTE = "studioKeyId";
    public static final List<String> CHANNELS = List.of("facebook", "zalo", "tiktok", "youtube", "instagram");
    public static final List<String> STATUSES = List.of("waiting", "posted", "skipped");
    public static final int MAX_CAPTION = 5000;

    /** A machine key works only on the creator routes of Khám phá and the studio routes (numbers, social queue). */
    private static final List<String> KEY_PATHS = List.of("/api/explore/creator/", "/api/studio/");

    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

    /** A new key: "al_" + 40 random characters (shown once, only its hash is kept). */
    public static String newKey(SecureRandom random) {
        StringBuilder sb = new StringBuilder(KEY_PREFIX);
        for (int i = 0; i < 40; i++) sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        return sb.toString();
    }

    public static String hash(String key) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(key.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** What the list shows of a key: "al_AbC4…". */
    public static String prefixOf(String key) {
        return key.substring(0, Math.min(key.length(), 8));
    }

    public static boolean looksLikeKey(String raw) {
        return raw != null && raw.startsWith(KEY_PREFIX) && raw.length() == KEY_PREFIX.length() + 40 && raw.substring(3).chars().allMatch(c -> ALPHABET.indexOf(c) >= 0);
    }

    /** May a machine key call this path (without the /v2 context)? */
    public static boolean keyMayCall(String path) {
        if (path == null) return false;
        for (String p : KEY_PATHS) if (path.startsWith(p) || path.equals(p.substring(0, p.length() - 1))) return true;
        return false;
    }

    public static String cleanChannel(String raw) {
        String channel = raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
        if (!CHANNELS.contains(channel)) throw new IllegalArgumentException("Kênh không hợp lệ");
        return channel;
    }

    public static String cleanCaption(String raw) {
        String caption = raw == null ? null : raw.trim();
        if (caption != null && caption.length() > MAX_CAPTION) throw new IllegalArgumentException("Nội dung tối đa " + MAX_CAPTION + " ký tự");
        return caption == null || caption.isEmpty() ? null : caption;
    }

    /** A posted link must be a web address. */
    public static String cleanUrl(String raw) {
        String url = raw == null ? "" : raw.trim();
        if (url.isEmpty()) return null;
        if (!url.matches("(?i)^https?://\\S+$") || url.length() > 500) throw new IllegalArgumentException("Link không hợp lệ");
        return url;
    }

    /**
     * The tracked link of a social post about a Khám phá post: the public page with utm_source = channel,
     * utm_medium = social, utm_campaign, utm_content = "explore-{id}" (so "Nguồn khách" ties sign-ups to the post).
     */
    public static String postLink(String origin, long postId, String slug, String channel, String campaign) {
        String base = (origin == null ? "" : origin.replaceAll("/+$", "")) + "/fun/explore/" + postId + "/" + slug;
        String camp = campaign == null || campaign.isBlank() ? "kham-pha" : campaign.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]+", "-");
        return base + "?utm_source=" + channel + "&utm_medium=social&utm_campaign=" + camp + "&utm_content=explore-" + postId;
    }
}
