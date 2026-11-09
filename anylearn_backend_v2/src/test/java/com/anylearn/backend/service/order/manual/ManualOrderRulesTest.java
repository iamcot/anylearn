package com.anylearn.backend.service.order.manual;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ManualOrderRulesTest {

    private static ManualOrderRules.Input order(String phone, String name, boolean forChild, String childName, String childDob,
                                                List<ManualOrderRules.Line> items, String payment, Long amount) {
        return new ManualOrderRules.Input(phone, name, "", forChild, null, childName, childDob, false, items, payment, true, amount, null);
    }

    private static final List<ManualOrderRules.Line> ONE = List.of(new ManualOrderRules.Line(5L, null, null));

    @Test
    void existingAccountNeedsOnlyPhoneCoursesAndPayment() {
        assertThat(ManualOrderRules.problem(order("+84 901 234 567", null, false, null, null, ONE, "cash", null), true)).isNull();
    }

    @Test
    void newAccountNeedsARealName() {
        assertThat(ManualOrderRules.problem(order("0901234567", "", false, null, null, ONE, "cash", null), false))
                .isEqualTo("Vui lòng nhập họ và tên.");
        assertThat(ManualOrderRules.problem(order("0901234567", "Nguyễn Văn An", false, null, null, ONE, "cash", null), false)).isNull();
    }

    @Test
    void phoneMustBeAVietnameseMobile() {
        assertThat(ManualOrderRules.problem(order("2826993000", "An", false, null, null, ONE, "cash", null), true))
                .isEqualTo("Số điện thoại không hợp lệ.");
    }

    @Test
    void childNeedsANameAndAPastBirthday() {
        assertThat(ManualOrderRules.problem(order("0901234567", null, true, " ", null, ONE, "cash", null), true))
                .isEqualTo("Vui lòng nhập tên của con.");
        assertThat(ManualOrderRules.problem(order("0901234567", null, true, "Bin", "2099-01-01", ONE, "cash", null), true))
                .isEqualTo("Ngày sinh của con ở tương lai.");
        assertThat(ManualOrderRules.problem(order("0901234567", null, true, "Bin", "12/03/2019", ONE, "cash", null), true))
                .isEqualTo("Ngày sinh của con không hợp lệ.");
        assertThat(ManualOrderRules.problem(order("0901234567", null, true, "Bin", "2019-03-12", ONE, "cash", null), true)).isNull();
    }

    @Test
    void pickedChildNeedsNoName() {
        var in = new ManualOrderRules.Input("0901234567", null, null, true, 42L, null, null, false, ONE, "cash", true, null, null);
        assertThat(ManualOrderRules.problem(in, true)).isNull();
    }

    @Test
    void coursesPaymentAndAmountAreChecked() {
        assertThat(ManualOrderRules.problem(order("0901234567", null, false, null, null, List.of(), "cash", null), true))
                .isEqualTo("Chưa chọn khóa học.");
        var twice = List.of(new ManualOrderRules.Line(5L, null, null), new ManualOrderRules.Line(5L, 2L, null));
        assertThat(ManualOrderRules.problem(order("0901234567", null, false, null, null, twice, "cash", null), true))
                .isEqualTo("Một khóa học được chọn hai lần trong cùng đơn.");
        assertThat(ManualOrderRules.problem(order("0901234567", null, false, null, null, ONE, "vnpay", null), true))
                .isEqualTo("Chọn hình thức thanh toán.");
        assertThat(ManualOrderRules.problem(order("0901234567", null, false, null, null, ONE, "cash", -1L), true))
                .isEqualTo("Số tiền không được âm.");
        assertThat(ManualOrderRules.problem(order("0901234567", null, false, null, null, ONE, "bank_transfer", 0L), true)).isNull();
    }
}
