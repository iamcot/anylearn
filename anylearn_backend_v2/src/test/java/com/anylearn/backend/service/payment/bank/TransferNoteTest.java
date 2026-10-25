package com.anylearn.backend.service.payment.bank;

import org.junit.jupiter.api.Test;

import java.util.OptionalLong;

import static org.assertj.core.api.Assertions.assertThat;

class TransferNoteTest {

    @Test
    void appendsTheOrderIdWithoutPadding() {
        assertThat(TransferNote.forOrder(7)).isEqualTo("ALQR7");
        assertThat(TransferNote.forOrder(42)).isEqualTo("ALQR42");
        assertThat(TransferNote.forOrder(1234)).isEqualTo("ALQR1234");
        assertThat(TransferNote.forOrder(1234567890L)).isEqualTo("ALQR1234567890");
    }

    @Test
    void readsBackWhatItBuilds() {
        for (long orderId : new long[] {7, 42, 999, 1234, 1234567890L}) {
            assertThat(TransferNote.extractOrderId(TransferNote.forOrder(orderId))).isEqualTo(OptionalLong.of(orderId));
        }
    }

    @Test
    void findsOrderIdWhenBankAddsItsOwnPrefix() {
        assertThat(TransferNote.extractOrderId("MBVCB.123456.ALQR0042.CT tu NGUYEN VAN A"))
                .isEqualTo(OptionalLong.of(42));
    }

    @Test
    void ignoresCaseSpacesAndDashes() {
        assertThat(TransferNote.extractOrderId("alqr 77")).isEqualTo(OptionalLong.of(77));
        assertThat(TransferNote.extractOrderId("ALQR-88")).isEqualTo(OptionalLong.of(88));
    }

    @Test
    void doesNotConfuseShorterOrderIdWithLongerOne() {
        assertThat(TransferNote.extractOrderId("ALQR123")).isEqualTo(OptionalLong.of(123));
        assertThat(TransferNote.extractOrderId("ALQR12")).isEqualTo(OptionalLong.of(12));
    }

    @Test
    void prefersFirstTextThatHasTheNote() {
        assertThat(TransferNote.extractOrderId("", null, "ALQR5", "ALQR6")).isEqualTo(OptionalLong.of(5));
    }

    @Test
    void returnsEmptyWithoutAValidNote() {
        assertThat(TransferNote.extractOrderId("chuyen tien hoc phi", null, "")).isEmpty();
        assertThat(TransferNote.extractOrderId("ALQR")).isEmpty();
        assertThat(TransferNote.extractOrderId("ALQR-")).isEmpty();
        assertThat(TransferNote.extractOrderId("ALQRPAY42")).as("old format").isEmpty();
    }

    @Test
    void readsAtMostTenDigits() {
        assertThat(TransferNote.extractOrderId("ALQR12345678901")).isEqualTo(OptionalLong.of(1234567890L));
    }
}
