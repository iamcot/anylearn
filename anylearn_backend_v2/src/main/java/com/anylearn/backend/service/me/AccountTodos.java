package com.anylearn.backend.service.me;

import java.util.ArrayList;
import java.util.List;

/** The "Cần làm ngay" list of /account (plan 06.1): pure, so the order and the wording are tested. */
public final class AccountTodos {

    public record Todo(String kind, String label, String route, int count) {}

    private AccountTodos() {}

    public static List<Todo> build(int pendingOrders, int learnersWithoutFullDob, int reviewsToWrite) {
        List<Todo> todos = new ArrayList<>();
        if (pendingOrders > 0) todos.add(new Todo("orders", pendingOrders + " đơn hàng chờ thanh toán", "/account/orders?tab=pending", pendingOrders));
        if (learnersWithoutFullDob > 0) todos.add(new Todo("dob", learnersWithoutFullDob + " bé chưa có ngày sinh đầy đủ", "/account/children", learnersWithoutFullDob));
        if (reviewsToWrite > 0) todos.add(new Todo("reviews", reviewsToWrite + " khóa học chờ bạn đánh giá", "/account/schedule", reviewsToWrite));
        return todos;
    }
}
