package com.anylearn.backend.service.me;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AccountTodosTest {

    @Test
    void emptyWhenNothingToDo() {
        assertThat(AccountTodos.build(0, 0, 0)).isEmpty();
    }

    @Test
    void ordersFirstThenDobAndReviews() {
        var todos = AccountTodos.build(2, 1, 3);
        assertThat(todos).extracting(AccountTodos.Todo::kind).containsExactly("orders", "dob", "reviews");
        assertThat(todos.get(0).label()).isEqualTo("2 đơn hàng chờ thanh toán");
        assertThat(todos.get(0).route()).isEqualTo("/account/orders?tab=pending");
    }

    @Test
    void skipsZeroCounts() {
        assertThat(AccountTodos.build(0, 0, 1)).extracting(AccountTodos.Todo::kind).containsExactly("reviews");
    }
}
