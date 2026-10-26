package com.anylearn.backend.service.push;

// Body of POST /api/push/subscribe: the browser's PushSubscription.toJSON() plus where it runs.
public record PushSubscribeRequest(String endpoint, Keys keys, String platform, Boolean standalone) {

    public record Keys(String p256dh, String auth) {}

    public boolean isComplete() {
        return notBlank(endpoint) && keys != null && notBlank(keys.p256dh()) && notBlank(keys.auth());
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
