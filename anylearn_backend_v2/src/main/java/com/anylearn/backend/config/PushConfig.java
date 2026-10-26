package com.anylearn.backend.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

// VAPID keys of the Web Push sender (base64url, as printed by `npx web-push generate-vapid-keys`).
// Without both keys push is off: the API says so and notifications only reach open tabs (SSE).
@Component
@ConfigurationProperties(prefix = "push")
@Getter @Setter
public class PushConfig {

    private String vapidPublicKey = "";
    private String vapidPrivateKey = "";
    private String subject = "mailto:info@anylearn.vn";

    public boolean isEnabled() {
        return vapidPublicKey != null && !vapidPublicKey.isBlank()
                && vapidPrivateKey != null && !vapidPrivateKey.isBlank();
    }
}
