package com.anylearn.backend.service.pricing;

import com.anylearn.backend.entity.PriceReport;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PriceReportRulesTest {

    @Test
    void visitorReportKeepsTheCleanedFieldsAndNormalizedPhone() {
        PriceReport report = PriceReportRules.toReport(
                new PriceReportInput(5L, 1_200_000L, "  Trường ABC ", " thấy trên website ", "+84 912 345 678"), null);
        assertThat(report.getItemId()).isEqualTo(5L);
        assertThat(report.getSeenPlace()).isEqualTo("Trường ABC");
        assertThat(report.getNote()).isEqualTo("thấy trên website");
        assertThat(report.getContactPhone()).isEqualTo("0912345678");
        assertThat(report.getSeenPrice()).isEqualTo(1_200_000L);
        assertThat(report.getStatus()).isEqualTo(PriceReport.STATUS_NEW);
    }

    @Test
    void loggedInPersonDoesNotNeedAPhone() {
        PriceReport report = PriceReportRules.toReport(new PriceReportInput(null, null, "Trường ABC", null, null), 7L);
        assertThat(report.getUserId()).isEqualTo(7L);
        assertThat(report.getContactPhone()).isNull();
    }

    @Test
    void visitorWithoutAccountMustLeaveAPhone() {
        assertThatThrownBy(() -> PriceReportRules.toReport(new PriceReportInput(5L, null, "Trường ABC", null, null), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("số điện thoại");
    }

    @Test
    void needsToKnowWhereTheLowerPriceWas() {
        assertThatThrownBy(() -> PriceReportRules.toReport(new PriceReportInput(5L, 1_000_000L, " ", null, "0912345678"), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("ở đâu");
    }

    @Test
    void rejectsAnImpossiblePriceOrPhone() {
        assertThatThrownBy(() -> PriceReportRules.toReport(new PriceReportInput(5L, -5L, "A", null, "0912345678"), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Giá");
        assertThatThrownBy(() -> PriceReportRules.toReport(new PriceReportInput(5L, null, "A", null, "123"), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("điện thoại");
    }
}
