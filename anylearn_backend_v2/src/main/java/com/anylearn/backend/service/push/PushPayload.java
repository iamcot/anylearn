package com.anylearn.backend.service.push;

import com.anylearn.backend.entity.Notification;

// What the service worker receives. The worker turns route + extraContent into a page through
// /notifications/open on the website, so the route mapping stays in one place (the frontend).
public record PushPayload(
        String title,
        String body,
        Long notificationId,
        String route,
        String extraContent,
        long unread,
        String tag) {

    static final String DEFAULT_TITLE = "anyLEARN";
    static final int MAX_BODY_LENGTH = 300;

    public static PushPayload of(Notification notification, long unread) {
        String title = isBlank(notification.getTitle()) ? DEFAULT_TITLE : notification.getTitle();
        return new PushPayload(
                title,
                shorten(notification.getContent()),
                notification.getId(),
                notification.getRoute(),
                notification.getExtraContent(),
                unread,
                "notif-" + notification.getId());
    }

    public static PushPayload test(long unread) {
        return new PushPayload(DEFAULT_TITLE, "Thông báo đã bật. Bạn sẽ nhận nhắc lịch học và đơn hàng ở đây.",
                null, null, null, unread, "push-test");
    }

    // Push services cap the encrypted message at about 4 KB; a long content would make the send fail.
    static String shorten(String content) {
        if (content == null) return "";
        String trimmed = content.strip();
        if (trimmed.length() <= MAX_BODY_LENGTH) return trimmed;
        return trimmed.substring(0, MAX_BODY_LENGTH - 1) + "…";
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
