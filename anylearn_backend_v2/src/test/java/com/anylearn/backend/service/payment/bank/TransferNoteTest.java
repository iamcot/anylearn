package com.anylearn.backend.service.payment.bank;

import org.junit.jupiter.api.Test;

import java.util.OptionalLong;

import static org.assertj.core.api.Assertions.assertThat;

class TransferNoteTest {

    @Test
    void buildsNoteFromOrderId() {
        assertThat(TransferNote.forOrder(1234)).isEqualTo("ALQRPAY1234");
    }

    @Test
    void findsOrderIdWhenBankAddsItsOwnPrefix() {
        assertThat(TransferNote.extractOrderId("MBVCB.123456.ALQRPAY1234.CT tu NGUYEN VAN A"))
                .isEqualTo(OptionalLong.of(1234));
    }

    @Test
    void ignoresCaseSpacesAndDashes() {
        assertThat(TransferNote.extractOrderId("alqrpay 77")).isEqualTo(OptionalLong.of(77));
        assertThat(TransferNote.extractOrderId("ALQRPAY-88")).isEqualTo(OptionalLong.of(88));
    }

    @Test
    void doesNotConfuseShorterOrderIdWithLongerOne() {
        assertThat(TransferNote.extractOrderId("ALQRPAY123")).isEqualTo(OptionalLong.of(123));
        assertThat(TransferNote.extractOrderId("ALQRPAY12")).isEqualTo(OptionalLong.of(12));
    }

    @Test
    void prefersFirstTextThatHasTheNote() {
        assertThat(TransferNote.extractOrderId("", null, "ALQRPAY5", "ALQRPAY6")).isEqualTo(OptionalLong.of(5));
    }

    @Test
    void returnsEmptyWithoutNote() {
        assertThat(TransferNote.extractOrderId("chuyen tien hoc phi", null, "")).isEmpty();
        assertThat(TransferNote.extractOrderId("ALQRPAY")).isEmpty();
    }
}
