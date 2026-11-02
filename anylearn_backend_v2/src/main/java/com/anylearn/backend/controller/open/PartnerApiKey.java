package com.anylearn.backend.controller.open;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** The shared key of partner apps (`ZNS_PARTNER_API_KEY`, header `X-Api-Key`), used by every `/api/open/*` partner endpoint. */
final class PartnerApiKey {

    private PartnerApiKey() {}

    /** Constant-time compare; an empty configured key accepts nothing. */
    static boolean matches(String configured, String given) {
        return configured != null && !configured.isBlank() && given != null
                && MessageDigest.isEqual(configured.getBytes(StandardCharsets.UTF_8), given.getBytes(StandardCharsets.UTF_8));
    }
}
