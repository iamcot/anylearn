package com.anylearn.backend.service.payment.bank;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** SePay calls the webhook with the header {@code Authorization: Apikey <key>}. */
public final class SepayAuth {

    private SepayAuth() {}

    public static boolean isValid(String header, String apiKey) {
        if (header == null || apiKey == null || apiKey.isBlank()) return false;
        byte[] expected = ("Apikey " + apiKey).getBytes(StandardCharsets.UTF_8);
        byte[] received = header.trim().getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, received);
    }
}
