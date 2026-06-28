<?php namespace App\Constants;
class OrderConstants {
    const STATUS_NEW = 'new';
    const STATUS_PAY_PENDING = 'pay_pending';
    const STATUS_PAID = 'paid';
    const STATUS_SHIPED = 'shiped';
    const STATUS_DELIVERED = 'delivered';
    const STATUS_FAIL = 'fail';
    const STATUS_CANCEL_BUYER = 'cancel_buyer';
    const STATUS_CANCEL_SELLER = 'cancel_seller';
    const STATUS_CANCEL_SYSTEM = 'cancel_system';
    const STATUS_RETURN_BUYER = 'return_buyer';
    const STATUS_RETURN_BUYER_PENDING = 'return_buyer_pending';
    const STATUS_RETURN_SELLER = 'return_seller';
    const STATUS_RETURN_SYSTEM = 'return_system';
    const STATUS_REFUND= 'refund';

    const PAYMENT_ATM = 'atm';
    const PAYMENT_ONEPAY = 'onepaylocal';
    const PAYMENT_FREE = 'free';
}