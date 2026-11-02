package com.anylearn.backend.service.zns;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class ZnsTemplatesTest {

    @Test
    void everyTemplateSendsExactlyItsDeclaredParams() {
        for (ZnsTemplates.Def def : ZnsTemplates.DEFS) {
            assertThat(def.sample().keySet()).as(def.key()).containsExactlyInAnyOrderElementsOf(def.params());
            assertThat(def.defaultTemplateId()).matches("\\d+");
        }
    }

    @Test
    void approvedIdsAreTheOnesFromTheDoc() {
        assertThat(ZnsTemplates.def(ZnsTemplates.ORDER_SUCCESS).orElseThrow().defaultTemplateId()).isEqualTo("659722");
        assertThat(ZnsTemplates.def(ZnsTemplates.ORDER_REMINDER).orElseThrow().defaultTemplateId()).isEqualTo("659976");
        assertThat(ZnsTemplates.def(ZnsTemplates.COURSE_START).orElseThrow().defaultTemplateId()).isEqualTo("659979");
        assertThat(ZnsTemplates.def(ZnsTemplates.MID_SURVEY).orElseThrow().defaultTemplateId()).isEqualTo("659981");
    }

    @Test
    void orderSuccessJoinsCoursesAndLearners() {
        Map<String, String> data = ZnsTemplates.orderSuccess("  Mẹ Bin ", 812L, List.of("Piano", "Vẽ", "Piano"),
                List.of("Bin", "Na", "Bin"), 2_500_000L, LocalDate.of(2026, 11, 2), "0901234567");
        assertThat(data).containsEntry("customer_name", "Mẹ Bin")
                .containsEntry("order_code", "812")
                .containsEntry("course_name", "Piano và 1 khóa khác")
                .containsEntry("learner", "Bin, Na")
                .containsEntry("price", "2500000")
                .containsEntry("date", "02/11/2026")
                .containsEntry("phone_number", "0901234567");
    }

    @Test
    void missingNameFallsBackToPhoneThenBan() {
        assertThat(ZnsTemplates.orderSuccess(null, 1L, List.of(), List.of(), null, null, "0901").get("customer_name")).isEqualTo("0901");
        assertThat(ZnsTemplates.courseStart(" ", 1L, null, "A", null, null).get("customer_name")).isEqualTo("bạn");
        assertThat(ZnsTemplates.orderSuccess(null, 1L, List.of(), List.of(), null, null, null).get("price")).isEqualTo("0");
    }

    @Test
    void reminderCarriesTheTransferNoteAndDeadlineDay() {
        Map<String, String> data = ZnsTemplates.orderReminder("An", 55L, 300_000L, LocalDateTime.of(2026, 11, 5, 22, 30));
        assertThat(data).containsEntry("bank_transfer_note", "ALQR55")
                .containsEntry("deadline", "22:30 05/11/2026")
                .containsEntry("amount", "300000");
    }

    @Test
    void startTimeHasTheHourWhenTheClassHasOne() {
        assertThat(ZnsTemplates.courseStart("An", 1L, null, "A", LocalDate.of(2026, 11, 5), java.time.LocalTime.of(18, 0)).get("start_time"))
                .isEqualTo("18:00 05/11/2026");
        assertThat(ZnsTemplates.courseStart("An", 1L, null, "A", LocalDate.of(2026, 11, 5), null).get("start_time")).isEqualTo("05/11/2026");
    }

    @Test
    void longTextsAreCut() {
        String longTitle = "x".repeat(150);
        String course = ZnsTemplates.midSurvey(1L, null, longTitle, "y".repeat(40)).get("course_name");
        assertThat(course).hasSize(ZnsTemplates.TEXT_MAX).endsWith("…");
        assertThat(ZnsTemplates.midSurvey(1L, null, "A", "y".repeat(40)).get("learner_name")).hasSize(ZnsTemplates.NAME_MAX);
        assertThat(ZnsTemplates.midSurvey(1L, null, "A", null).get("learner_name")).isEqualTo("Học viên");
    }

    @Test
    void sendWindowIsEightToTwentyOne() {
        assertThat(ZnsTemplates.inSendWindow(7)).isFalse();
        assertThat(ZnsTemplates.inSendWindow(8)).isTrue();
        assertThat(ZnsTemplates.inSendWindow(20)).isTrue();
        assertThat(ZnsTemplates.inSendWindow(21)).isFalse();
    }
}
