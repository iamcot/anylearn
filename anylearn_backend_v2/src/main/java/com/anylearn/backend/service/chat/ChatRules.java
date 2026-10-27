package com.anylearn.backend.service.chat;

import com.anylearn.backend.service.PersonNames;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/** Pure rules of the class chat (plan 11): names, message checks, who may speak. */
public final class ChatRules {

    public static final int MIN_NAME = 2;
    public static final int MAX_NAME = 30;
    public static final int MAX_BODY = 1000;
    public static final int MAX_REPORT_REASON = 255;
    public static final String ROLE_MEMBER = "member";
    public static final String ROLE_MODERATOR = "moderator";

    private ChatRules() {}

    /** The name other parents see, e.g. "Mẹ Bin". No phone number or email in it. */
    public static String cleanDisplayName(String raw) {
        String name = raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
        if (name.length() < MIN_NAME || name.length() > MAX_NAME) {
            throw new IllegalArgumentException("Tên hiển thị từ " + MIN_NAME + " đến " + MAX_NAME + " ký tự");
        }
        if (name.contains("@") || name.replaceAll("\\D", "").length() >= 6) {
            throw new IllegalArgumentException("Tên hiển thị không được chứa số điện thoại hoặc email");
        }
        return name;
    }

    public static String cleanBody(String raw) {
        String body = raw == null ? "" : raw.trim();
        if (body.isEmpty()) throw new IllegalArgumentException("Tin nhắn đang trống");
        if (body.length() > MAX_BODY) throw new IllegalArgumentException("Tin nhắn tối đa " + MAX_BODY + " ký tự");
        return body;
    }

    public static String cleanReason(String raw) {
        String reason = raw == null ? "" : raw.trim();
        if (reason.length() < 3) throw new IllegalArgumentException("Hãy ghi ngắn gọn lý do báo cáo");
        return reason.length() > MAX_REPORT_REASON ? reason.substring(0, MAX_REPORT_REASON) : reason;
    }

    public static List<String> parseWords(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split("[,\\n]")).map(PersonNames::normalize).filter(w -> !w.isBlank()).distinct().toList();
    }

    /** Banned words match ignoring accents and case; returns the first one found, or null. */
    public static String findBannedWord(String body, List<String> words) {
        if (words == null || words.isEmpty()) return null;
        String text = PersonNames.normalize(body);
        for (String word : words) if (text.contains(word)) return word;
        return null;
    }

    public static boolean rateLimited(long sentInLastMinute, int limitPerMinute) {
        return limitPerMinute > 0 && sentInLastMinute >= limitPerMinute;
    }

    public static boolean isModerator(String role) {
        return ROLE_MODERATOR.equals(role);
    }

    /** What stops this member from writing right now, or null when nothing does. */
    public static String sendProblem(boolean roomLocked, boolean banned, LocalDateTime mutedUntil, boolean rulesAccepted,
                                     boolean left, boolean moderator, LocalDateTime now) {
        if (left) return "Bạn đã rời nhóm này";
        if (banned) return "Bạn đã bị khóa chat. Liên hệ anyLEARN nếu cần hỗ trợ";
        if (roomLocked && !moderator) return "Nhóm đang tạm khóa";
        if (!rulesAccepted) return "Hãy chọn tên hiển thị và đồng ý nội quy trước";
        if (mutedUntil != null && mutedUntil.isAfter(now)) return "Bạn đang bị tạm khóa chat";
        return null;
    }

    /** Still in the class, or the course ended no more than {@code retentionDays} ago (read only after that). */
    public static boolean stillInGroup(String enrollmentStatus, java.time.LocalDate endDate, java.time.LocalDate today, int retentionDays) {
        if ("active".equals(enrollmentStatus)) return endDate == null || !endDate.plusDays(retentionDays).isBefore(today);
        return false;
    }
}
