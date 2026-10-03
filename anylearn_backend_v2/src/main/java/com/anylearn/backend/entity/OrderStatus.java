package com.anylearn.backend.entity;

public final class OrderStatus {
    public static final String NEW           = "new";
    public static final String PAY_PENDING   = "pay_pending";
    public static final String PAID          = "paid";
    public static final String DELIVERED     = "delivered";
    public static final String FAIL          = "fail";
    public static final String CANCEL_BUYER  = "cancel_buyer";
    public static final String CANCEL_SELLER = "cancel_seller";
    public static final String CANCEL_SYSTEM = "cancel_system";
    public static final String RETURN_BUYER  = "return_buyer";
    public static final String RETURN_SELLER = "return_seller";
    public static final String REFUND        = "refund";

    private OrderStatus() {}
}
