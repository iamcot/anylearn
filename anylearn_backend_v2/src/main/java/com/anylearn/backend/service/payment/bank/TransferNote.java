package com.anylearn.backend.service.payment.bank;

import java.text.Normalizer;
import java.util.Locale;
import java.util.OptionalLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bank transfer note of an order: {@code ALQR} + the order id, e.g. {@code ALQR7} or {@code ALQR1234}. It follows the "payment code" format configured at SePay
 * (prefix of 2-5 letters, suffix of 1-10 digits), so SePay also sends it in the webhook field
 * {@code code}. Banks often add their own prefix, change case or drop spaces, so the note is
 * searched in normalized text.
 */
public final class TransferNote {

    public static final String PREFIX = "ALQR";

    private static final int MIN_DIGITS = 1;
    private static final int MAX_DIGITS = 10;
    private static final Pattern ORDER_REF = Pattern.compile(PREFIX + "(\\d{" + MIN_DIGITS + "," + MAX_DIGITS + "})");
    private static final Pattern COMBINING_MARKS = Pattern.compile("\\p{M}+");
    private static final Pattern NOT_ALPHANUMERIC = Pattern.compile("[^A-Z0-9]");

    private TransferNote() {}

    public static String forOrder(long orderId) {
        return PREFIX + orderId;
    }

    public static OptionalLong extractOrderId(String... texts) {
        for (String text : texts) {
            OptionalLong found = extractFromText(text);
            if (found.isPresent()) return found;
        }
        return OptionalLong.empty();
    }

    private static OptionalLong extractFromText(String text) {
        if (text == null) return OptionalLong.empty();
        Matcher matcher = ORDER_REF.matcher(normalize(text));
        return matcher.find() ? OptionalLong.of(Long.parseLong(matcher.group(1))) : OptionalLong.empty();
    }

    static String normalize(String text) {
        String withoutMarks = COMBINING_MARKS.matcher(Normalizer.normalize(text, Normalizer.Form.NFD)).replaceAll("");
        return NOT_ALPHANUMERIC.matcher(withoutMarks.toUpperCase(Locale.ROOT)).replaceAll("");
    }
}
