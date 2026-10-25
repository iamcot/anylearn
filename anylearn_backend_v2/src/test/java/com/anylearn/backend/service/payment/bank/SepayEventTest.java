package com.anylearn.backend.service.payment.bank;

import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class SepayEventTest {

    private Map<String, Object> validBody() {
        Map<String, Object> body = new HashMap<>();
        body.put("id", 92704);
        body.put("transferType", "in");
        body.put("transferAmount", 2000000);
        body.put("transactionDate", "2026-10-24 14:02:37");
        body.put("content", "ALQRPAY1234");
        body.put("accountNumber", "0123456789");
        return body;
    }

    @Test
    void parsesAValidTransferAndConvertsVietnamTimeToUtc() {
        Optional<SepayEvent> event = SepayEvent.parse(validBody());

        assertThat(event).isPresent();
        assertThat(event.get().txnId()).isEqualTo("92704");
        assertThat(event.get().incoming()).isTrue();
        assertThat(event.get().amount()).isEqualTo(2_000_000L);
        assertThat(event.get().content()).isEqualTo("ALQRPAY1234");
        assertThat(event.get().transferredAt()).isEqualTo(LocalDateTime.of(2026, 10, 24, 7, 2, 37));
    }

    @Test
    void fallsBackToDescriptionWhenContentIsMissing() {
        Map<String, Object> body = validBody();
        body.remove("content");
        body.put("description", "BankAPINotify ALQRPAY9");

        assertThat(SepayEvent.parse(body).orElseThrow().content()).isEqualTo("BankAPINotify ALQRPAY9");
    }

    @Test
    void marksOutgoingTransfers() {
        Map<String, Object> body = validBody();
        body.put("transferType", "out");

        assertThat(SepayEvent.parse(body).orElseThrow().incoming()).isFalse();
    }

    @Test
    void rejectsBodiesThatAreNotUsable() {
        assertThat(SepayEvent.parse(null)).isEmpty();

        Map<String, Object> noId = validBody();
        noId.remove("id");
        assertThat(SepayEvent.parse(noId)).isEmpty();

        Map<String, Object> zero = validBody();
        zero.put("transferAmount", 0);
        assertThat(SepayEvent.parse(zero)).isEmpty();

        Map<String, Object> fraction = validBody();
        fraction.put("transferAmount", 1000.5);
        assertThat(SepayEvent.parse(fraction)).isEmpty();

        Map<String, Object> badDate = validBody();
        badDate.put("transactionDate", "yesterday");
        assertThat(SepayEvent.parse(badDate)).isEmpty();

        Map<String, Object> badType = validBody();
        badType.put("transferType", "sideways");
        assertThat(SepayEvent.parse(badType)).isEmpty();
    }
}
