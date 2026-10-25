package com.anylearn.backend.service.push;

import com.anylearn.backend.config.PushConfig;
import com.anylearn.backend.entity.PushSubscription;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Component;

import java.security.GeneralSecurityException;
import java.security.Security;

@Component
public class VapidPushTransport implements PushTransport {

    // A push service keeps an undelivered message this long (phone off, no network), then drops it.
    static final int TTL_SECONDS = 24 * 60 * 60;

    // The library loads every key (ours and the browser's) through the "BC" provider by name.
    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) Security.addProvider(new BouncyCastleProvider());
    }

    private final PushConfig config;
    private PushService client;

    public VapidPushTransport(PushConfig config) {
        this.config = config;
    }

    @Override
    public int send(PushSubscription subscription, byte[] payload) throws Exception {
        Notification message = Notification.builder()
                .endpoint(subscription.getEndpoint())
                .userPublicKey(subscription.getP256dh())
                .userAuth(subscription.getAuth())
                .payload(payload)
                .ttl(TTL_SECONDS)
                .build();
        return client().send(message, Encoding.AES128GCM).getStatusLine().getStatusCode();
    }

    private synchronized PushService client() throws GeneralSecurityException {
        if (client != null) return client;
        client = new PushService(config.getVapidPublicKey(), config.getVapidPrivateKey(), config.getSubject());
        return client;
    }
}
