package com.anylearn.backend.service.payment.bank;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Map;
import java.util.Optional;

/** One bank transfer reported by a SePay webhook. {@code transferredAt} is UTC. */
public record SepayEvent(
        String txnId,
        boolean incoming,
        long amount,
        String content,
        String code,
        String accountNumber,
        LocalDateTime transferredAt) {

    private static final DateTimeFormatter SEPAY_DATE = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    // SePay sends the transaction time in Vietnam time
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    public static Optional<SepayEvent> parse(Map<String, Object> body) {
        if (body == null) return Optional.empty();
        String txnId = textOf(body.get("id"));
        String direction = textOf(body.get("transferType"));
        Optional<Long> amount = wholeNumber(body.get("transferAmount"));
        Optional<LocalDateTime> transferredAt = parseDate(textOf(body.get("transactionDate")));
        boolean knownDirection = "in".equals(direction) || "out".equals(direction);
        if (txnId.isEmpty() || !knownDirection || amount.isEmpty() || amount.get() <= 0 || transferredAt.isEmpty()) {
            return Optional.empty();
        }
        String content = textOf(body.get("content"));
        if (content.isEmpty()) content = textOf(body.get("description"));
        return Optional.of(new SepayEvent(txnId, "in".equals(direction), amount.get(), content,
                textOf(body.get("code")), textOf(body.get("accountNumber")), transferredAt.get()));
    }

    private static String textOf(Object value) {
        if (value instanceof String text) return text.trim();
        if (value instanceof Number number) return String.valueOf(number.longValue());
        return "";
    }

    private static Optional<Long> wholeNumber(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue() == Math.rint(number.doubleValue()) ? Optional.of(number.longValue()) : Optional.empty();
        }
        if (value instanceof String text) {
            try { return Optional.of(Long.parseLong(text.trim())); } catch (NumberFormatException e) { return Optional.empty(); }
        }
        return Optional.empty();
    }

    private static Optional<LocalDateTime> parseDate(String text) {
        try {
            LocalDateTime local = LocalDateTime.parse(text, SEPAY_DATE);
            return Optional.of(local.atZone(VIETNAM).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime());
        } catch (DateTimeParseException e) {
            return Optional.empty();
        }
    }
}
