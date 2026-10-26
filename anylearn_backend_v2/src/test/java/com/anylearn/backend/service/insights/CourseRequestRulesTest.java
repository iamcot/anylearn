package com.anylearn.backend.service.insights;

import com.anylearn.backend.entity.CourseRequest;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CourseRequestRulesTest {

    private static CourseRequestInput input(String phone, String subject) {
        return new CourseRequestInput(" Mẹ Bin ", phone, subject, 9, "79", " Quận 7 ", 2_000_000L, "weekend", "offline", " cần lớp gần nhà ", "ref-12345678");
    }

    @Test
    void normalizesVietnamesePhoneNumbers() {
        assertThat(CourseRequestRules.normalizePhone("0912 345 678")).isEqualTo("0912345678");
        assertThat(CourseRequestRules.normalizePhone("+84 912.345.678")).isEqualTo("0912345678");
        assertThat(CourseRequestRules.normalizePhone("84912345678")).isEqualTo("0912345678");
        assertThat(CourseRequestRules.normalizePhone("(028) 1234 5678")).isEqualTo("02812345678");
    }

    @Test
    void rejectsPhoneNumbersThatCannotBeRight() {
        assertThat(CourseRequestRules.normalizePhone("12345")).isNull();
        assertThat(CourseRequestRules.normalizePhone("abc")).isNull();
        assertThat(CourseRequestRules.normalizePhone("1912345678")).isNull();
        assertThat(CourseRequestRules.normalizePhone(null)).isNull();
    }

    @Test
    void buildsACleanRequest() {
        CourseRequest request = CourseRequestRules.toRequest(input("0912345678", "  Cờ vua  "), 7L);

        assertThat(request.getUserId()).isEqualTo(7L);
        assertThat(request.getContactName()).isEqualTo("Mẹ Bin");
        assertThat(request.getContactPhone()).isEqualTo("0912345678");
        assertThat(request.getSubject()).isEqualTo("Cờ vua");
        assertThat(request.getSubjectNormalized()).isEqualTo("co vua");
        assertThat(request.getDistrictText()).isEqualTo("Quận 7");
        assertThat(request.getPreferredTime()).isEqualTo("weekend");
        assertThat(request.getMode()).isEqualTo("offline");
        assertThat(request.getNote()).isEqualTo("cần lớp gần nhà");
        assertThat(request.getSourceRef()).isEqualTo("ref-12345678");
        assertThat(request.getStatus()).isEqualTo(CourseRequest.STATUS_NEW);
    }

    @Test
    void dropsValuesOutsideTheAllowedLists() {
        CourseRequestInput odd = new CourseRequestInput(null, "0912345678", "Cờ vua", null, null, null, null, "whenever", "teleport", null, "bad");

        CourseRequest request = CourseRequestRules.toRequest(odd, null);

        assertThat(request.getPreferredTime()).isNull();
        assertThat(request.getMode()).isNull();
        assertThat(request.getSourceRef()).isNull();
    }

    @Test
    void refusesWhatWeCannotActOn() {
        assertThatThrownBy(() -> CourseRequestRules.toRequest(input("12", "Cờ vua"), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Số điện thoại");
        assertThatThrownBy(() -> CourseRequestRules.toRequest(input("0912345678", " a "), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("khóa học gì");
        assertThatThrownBy(() -> CourseRequestRules.toRequest(
                new CourseRequestInput(null, "0912345678", "Cờ vua", 400, null, null, null, null, null, null, null), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Độ tuổi");
        assertThatThrownBy(() -> CourseRequestRules.toRequest(
                new CourseRequestInput(null, "0912345678", "Cờ vua", null, null, null, -5L, null, null, null, null), null))
                .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("Ngân sách");
    }
}
