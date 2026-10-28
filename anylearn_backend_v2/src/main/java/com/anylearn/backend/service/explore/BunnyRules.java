package com.anylearn.backend.service.explore;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/** Pure rules of the Bunny Stream upload (plan 15, section 9): the TUS signature and the public links of a video. */
public final class BunnyRules {

    private BunnyRules() {}

    /** How long a signed upload stays valid, in seconds. */
    public static final long UPLOAD_VALID_SECONDS = 6 * 3600;

    /** `sha256(libraryId + apiKey + expirationTime + videoId)` as lowercase hex, the TUS `AuthorizationSignature`. */
    public static String signature(String libraryId, String apiKey, long expire, String videoId) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest((libraryId + apiKey + expire + videoId).getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder();
            for (byte b : hash) out.append(String.format("%02x", b));
            return out.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** The host as the person typed it: no scheme, no slash ("https://vz-1.b-cdn.net/" gives "vz-1.b-cdn.net"). */
    public static String cleanHost(String host) {
        if (host == null) return "";
        return host.trim().replaceFirst("^https?://", "").replaceAll("/+$", "");
    }

    public static String playlistUrl(String cdnHost, String videoId) {
        return "https://" + cleanHost(cdnHost) + "/" + videoId + "/playlist.m3u8";
    }

    public static String thumbnailUrl(String cdnHost, String videoId) {
        return "https://" + cleanHost(cdnHost) + "/" + videoId + "/thumbnail.jpg";
    }

    /** A video title for Bunny: trimmed, never empty, at most 200 characters. */
    public static String cleanTitle(String title) {
        String clean = title == null ? "" : title.trim();
        if (clean.isEmpty()) clean = "Khám phá";
        return clean.length() > 200 ? clean.substring(0, 200) : clean;
    }

    /**
     * The Bunny video id of a link of our own library (`https://{cdnHost}/{videoId}/...`), or null for any other link
     * (YouTube, an mp4 elsewhere, another library), so deleting never touches a video that is not ours.
     */
    public static String videoIdOf(String cdnHost, String url) {
        String host = cleanHost(cdnHost);
        if (host.isEmpty() || url == null) return null;
        String prefix = "https://" + host + "/";
        if (!url.startsWith(prefix)) return null;
        String rest = url.substring(prefix.length());
        int slash = rest.indexOf('/');
        String id = slash < 0 ? rest : rest.substring(0, slash);
        return id.matches("[0-9a-fA-F-]{16,64}") ? id : null;
    }
}
