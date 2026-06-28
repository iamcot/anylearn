<?php

namespace App\DigitalSupport;

use App\DataObjects\ServiceResponse;
use App\PaymentGateway\CurlHelper;

class DigitalMonkey implements OrderingPartnerInterface
{
    const AGENT_PATH = 'https://monkey.edu.vn/api/create-order-agent';
    const AGENT_CODE = 'ANYLEARN';
    const API_KEY = 'OhcKZpp1dteB7dfgIeJRK1opWWAyuI';

    const STATUS_FAIL = 'fail';

    public function validateOrderData($orderData)
    {
        if (empty($orderData['product_id']) || empty($orderData['transaction_id'])) {
            return false;
        }
        return $orderData;
    }

    public function submitOrderRequest($orderData)
    {
        $header = ['api-key:' . self::API_KEY, 'agent-code:' . self::AGENT_CODE];
        return CurlHelper::post(self::AGENT_PATH, json_encode($orderData), $header);
    }

    public function processReturnData($returnData)
    {
        if (!isset($returnData['status']) || $returnData['status'] == self::STATUS_FAIL) {
            return new ServiceResponse(false, $returnData['message'] ?? 'INVALID_RESPONSE');
        }
        return new ServiceResponse(true, $returnData['message'], $returnData['data']);
    }

    public function orderItemFromPartnerAPI($orderData)
    {
        if (false === $this->validateOrderData($orderData)) {
            return new ServiceResponse(false, 'INVALID_ORDER_DATA');
        }
        if (env('MONKEY_API_TEST', 1)) {
            // Testing
            $returnData = [
                'status' => 'success',
                'message' => 'success message',
                'data' => [
                    'account' => 'username_test',
                    'password' => 'password_123',
                    'order_id' => 'order_' . random_int(10, 200),
                ],
            ];
        } else {
            $returnData = json_decode($this->submitOrderRequest($orderData), true);
        }

        return $this->processReturnData($returnData);
    }
}
