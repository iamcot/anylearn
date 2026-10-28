package com.anylearn.backend.service.explore;

import com.anylearn.backend.service.chat.ChatRules;

import java.util.List;

/** Pure rules of Khám phá (plan 14, phase 7): what a post and a comment may hold. */
public final class ExploreRules {

    private ExploreRules() {}

    public static final List<String> KINDS = List.of("article", "image", "video");
    public static final List<String> STATUSES = List.of("draft", "pending", "published", "hidden", "rejected");
    /** creator: every new or edited post waits for an admin; s_creator: publishes by itself (plan 16). */
    public static final String CREATOR = "creator";
    public static final String S_CREATOR = "s_creator";
    public static final List<String> LEVELS = List.of(CREATOR, S_CREATOR);
    public static final int MAX_TAGS = 8;
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

    // ---- creators (plan 16) ----

    public static String cleanLevel(String raw) {
        String level = raw == null ? CREATOR : raw.trim().toLowerCase().replace('-', '_');
        if (!LEVELS.contains(level)) throw new IllegalArgumentException("Loại creator không hợp lệ");
        return level;
    }

    /** Rejected, or hidden by an admin: only a new review can bring it back. */
    public static boolean blockedByAdmin(String status, String hiddenBy) {
        return "rejected".equals(status) || ("hidden".equals(status) && "admin".equals(hiddenBy));
    }

    /**
     * The status a creator's post takes when they save it (status = its current one, null for a new post). A post the creator
     * hid stays hidden; a post an admin rejected or hid goes back for review; otherwise s_creator publishes and creator waits.
     */
    public static String statusAfterCreatorSave(String level, String status, String hiddenBy) {
        if ("hidden".equals(status) && !"admin".equals(hiddenBy)) return "hidden";
        if (blockedByAdmin(status, hiddenBy)) return "pending";
        return S_CREATOR.equals(level) ? "published" : "pending";
    }

    /** "Hiện" pressed by the creator on a hidden or rejected post. */
    public static String statusAfterCreatorShow(String level, boolean approved, String status, String hiddenBy) {
        if (blockedByAdmin(status, hiddenBy)) return "pending";
        if (S_CREATOR.equals(level) || approved) return "published";
        return "pending";
    }

    /** A creator may hide a post that is live or waiting. */
    public static boolean creatorCanHide(String status) {
        return "published".equals(status) || "pending".equals(status);
    }

    /** A creator may delete a post only once it is off the feed: hidden, rejected or a draft (a clip that never finished). */
    public static boolean creatorCanDelete(String status) {
        return "hidden".equals(status) || "rejected".equals(status) || "draft".equals(status);
    }

    /** Distinct tag ids, at most MAX_TAGS. */
    public static List<Long> cleanTagIds(List<Long> raw) {
        if (raw == null) return List.of();
        List<Long> out = raw.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (out.size() > MAX_TAGS) throw new IllegalArgumentException("Tối đa " + MAX_TAGS + " tag cho một bài");
        return out;
    }

    /** Last two words of a name, the way players are shown everywhere in Vui học. */
    public static String authorName(String fullName) {
        return com.anylearn.backend.service.quiz.QuizBoardRules.displayName(fullName);
    }

    /**
     * Ranking of a post the person has not seen: tags that match their interests weigh most, then freshness (halves every
     * week), then engagement per view. Kept here so the SQL in ExploreService and the test agree.
     */
    public static double rankScore(int tagMatches, double daysOld, long views, long likes, long comments, long shares) {
        double affinity = Math.min(tagMatches, 5) * 3.0;
        double fresh = 2.0 / (1.0 + Math.max(daysOld, 0) / 7.0);
        double engagement = 5.0 * (likes + 2.0 * comments + 3.0 * shares) / (views + 20.0);
        return affinity + fresh + engagement;
    }
}
