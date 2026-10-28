package com.anylearn.backend.service.explore;

import com.anylearn.backend.service.chat.ChatRules;

import java.util.List;

/** Pure rules of Khám phá (plan 14, phase 7): what a post and a comment may hold. */
public final class ExploreRules {

    private ExploreRules() {}

    public static final List<String> KINDS = List.of("article", "image", "video");
    public static final List<String> STATUSES = List.of("draft", "published", "hidden");
    public static final int MAX_COMMENT = 300;
    public static final int MAX_TITLE = 160;

    public static String cleanTitle(String raw) {
        String title = raw == null ? "" : raw.trim();
        if (title.isEmpty()) throw new IllegalArgumentException("Tiêu đề đang trống");
        if (title.length() > MAX_TITLE) throw new IllegalArgumentException("Tiêu đề tối đa " + MAX_TITLE + " ký tự");
        return title;
    }

    public static String cleanKind(String raw) {
        String kind = raw == null ? "article" : raw.trim().toLowerCase();
        if (!KINDS.contains(kind)) throw new IllegalArgumentException("Loại bài không hợp lệ");
        return kind;
    }

    public static String cleanStatus(String raw) {
        String status = raw == null ? "draft" : raw.trim().toLowerCase();
        if (!STATUSES.contains(status)) throw new IllegalArgumentException("Trạng thái không hợp lệ");
        return status;
    }

    /** A clip is a link (https), a photo is an upload or a link; an article may have neither. Returns the cleaned link or null. */
    public static String cleanMedia(String kind, String raw) {
        return cleanMedia(kind, raw, "published");
    }

    /** A draft photo or clip may have no link yet (a clip is still uploading to Bunny); anything else needs it. */
    public static String cleanMedia(String kind, String raw, String status) {
        String url = raw == null || raw.isBlank() ? null : raw.trim();
        if (url != null && !url.startsWith("https://") && !url.startsWith("/")) throw new IllegalArgumentException("Đường dẫn hình hoặc clip cần bắt đầu bằng https://");
        if (url != null && url.length() > 500) throw new IllegalArgumentException("Đường dẫn quá dài");
        if (("video".equals(kind) || "image".equals(kind)) && url == null && !"draft".equals(status)) throw new IllegalArgumentException("Bài hình ảnh hoặc clip cần có hình / đường dẫn clip");
        return url;
    }

    public static String cleanComment(String raw) {
        String body = raw == null ? "" : raw.trim();
        if (body.isEmpty()) throw new IllegalArgumentException("Bình luận đang trống");
        if (body.length() > MAX_COMMENT) throw new IllegalArgumentException("Bình luận tối đa " + MAX_COMMENT + " ký tự");
        return body;
    }

    /** What stops a comment, or null: banned person, banned word, too many in the last minute. */
    public static String commentProblem(boolean banned, String bannedWord, long sentInLastMinute, int limitPerMinute) {
        if (banned) return "Bạn đã bị khóa bình luận. Liên hệ anyLEARN nếu cần hỗ trợ";
        if (bannedWord != null) return "Bình luận có từ không phù hợp, bạn viết lại nhé";
        if (ChatRules.rateLimited(sentInLastMinute, limitPerMinute)) return "Bạn bình luận nhanh quá, chờ một chút nhé";
        return null;
    }
}
