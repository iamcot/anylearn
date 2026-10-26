package com.anylearn.backend.service.push;

import com.anylearn.backend.config.PushConfig;
import com.anylearn.backend.entity.PushSubscription;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.math.BigInteger;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.SecureRandom;
import java.security.interfaces.ECPrivateKey;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.Arrays;
import java.util.Base64;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

// Runs the real library (encryption + VAPID signature) against a local fake push service.
class VapidPushTransportTest {

    private HttpServer server;

    @AfterEach
    void stop() {
        if (server != null) server.stop(0);
    }

    private static String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static byte[] unsigned32(BigInteger value) {
        byte[] raw = value.toByteArray();
        byte[] out = new byte[32];
        int length = Math.min(raw.length, 32);
        System.arraycopy(raw, raw.length - length, out, 32 - length, length);
        return out;
    }

    private static byte[] uncompressedPoint(ECPublicKey key) {
        byte[] point = new byte[65];
        point[0] = 0x04;
        System.arraycopy(unsigned32(key.getW().getAffineX()), 0, point, 1, 32);
        System.arraycopy(unsigned32(key.getW().getAffineY()), 0, point, 33, 32);
        return point;
    }

    private static KeyPair p256() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        return generator.generateKeyPair();
    }

    @Test
    void sendsAnEncryptedSignedMessage() throws Exception {
        AtomicReference<String> authorization = new AtomicReference<>();
        AtomicReference<String> encoding = new AtomicReference<>();
        AtomicReference<byte[]> body = new AtomicReference<>();
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/push", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            encoding.set(exchange.getRequestHeaders().getFirst("Content-Encoding"));
            body.set(exchange.getRequestBody().readAllBytes());
            exchange.sendResponseHeaders(201, -1);
            exchange.close();
        });
        server.start();

        KeyPair vapid = p256();
        PushConfig config = new PushConfig();
        config.setVapidPublicKey(base64Url(uncompressedPoint((ECPublicKey) vapid.getPublic())));
        config.setVapidPrivateKey(base64Url(unsigned32(((ECPrivateKey) vapid.getPrivate()).getS())));

        byte[] auth = new byte[16];
        new SecureRandom().nextBytes(auth);
        PushSubscription device = new PushSubscription();
        device.setEndpoint("http://127.0.0.1:" + server.getAddress().getPort() + "/push");
        device.setP256dh(base64Url(uncompressedPoint((ECPublicKey) p256().getPublic())));
        device.setAuth(base64Url(auth));

        byte[] payload = "{\"title\":\"anyLEARN\"}".getBytes(StandardCharsets.UTF_8);
        int status = new VapidPushTransport(config).send(device, payload);

        assertThat(status).isEqualTo(201);
        assertThat(encoding.get()).isEqualTo("aes128gcm");
        assertThat(authorization.get()).startsWith("vapid t=").contains("k=" + config.getVapidPublicKey());
        assertThat(body.get()).isNotEmpty();
        assertThat(Arrays.equals(body.get(), payload)).isFalse();
    }
}
