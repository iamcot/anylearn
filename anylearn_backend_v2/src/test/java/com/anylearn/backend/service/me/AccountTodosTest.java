package com.anylearn.backend.service.me;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AccountTodosTest {

    @Test
    void emptyWhenNothingToDo() {
        assertThat(AccountTodos.build(0, 0, 0, 0)).isEmpty();
    }

    @Test
    void ordersFirstThenDobReviewsAndNotifications() {
        var todos = AccountTodos.build(2, 1, 3, 4);
        assertThat(todos).extracting(AccountTodos.Todo::kind).containsExactly("orders", "dob", "reviews", "notifications");
        assertThat(todos.get(0).label()).isEqualTo("2 đơn hàng chờ thanh toán");
        assertThat(todos.get(0).route()).isEqualTo("/account/orders?tab=pending");
    }

    @Test
    void skipsZeroCounts() {
        assertThat(AccountTodos.build(0, 0, 1, 0)).extracting(AccountTodos.Todo::kind).containsExactly("reviews");
    }
}
