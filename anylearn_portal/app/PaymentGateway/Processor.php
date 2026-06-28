<?php

namespace App\PaymentGateway;

class Processor
{
    static $processor = null;

    public static function getProcessor($payment)
    {
        if (null != self::$processor) {
            return self::$processor;
        }
        switch ($payment) {
            case Momo::NAME:
                self::$processor = new Momo();
                break;
            case OnepayLocal::NAME:
                self::$processor =  new OnepayLocal();
                break;
            case Vnpay::NAME:
                self::$processor =  new Vnpay();
                break;
            case OnepayTg::NAME:
                self::$processor =  new OnepayTg();
                break;
            case OnepayFee::NAME:
                self::$processor =  new OnepayFee();
                break;
            default:
                break;
        }
        return self::$processor;
    }

    static public function generatePaymentToken($orderId, $lenght = 20)
    {
        $randomString = str_shuffle('0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
        return $orderId ? $orderId . 'Al' . substr($randomString, 0, $lenght) : $orderId;
    }

    static public function getOrderIdFromPaymentToken($paymentToken)
    {
        return stristr($paymentToken, 'Al', true);
    }
}
