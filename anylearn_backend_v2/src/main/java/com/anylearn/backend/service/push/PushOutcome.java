package com.anylearn.backend.service.push;

public enum PushOutcome {
    DELIVERED,
    // 404/410: the browser dropped the subscription (uninstalled, permission revoked). Delete it.
    GONE,
    FAILED;

    public static PushOutcome fromStatus(int status) {
        if (status >= 200 && status < 300) return DELIVERED;
        if (status == 404 || status == 410) return GONE;
        return FAILED;
    }
}
