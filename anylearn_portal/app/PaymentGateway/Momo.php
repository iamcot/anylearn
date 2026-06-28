<?php namespace App\PaymentGateway;

use App\DataObjects\ServiceResponse;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;

class Momo implements PaymentInterface {
    const NAME = 'momo';
    const SUCCESS_CODE = "0";

    private $amount;
    private $orderId;

    public function validate($input) {
        $amount = isset($input['amount']) ? $input['amount'] : 0;
        $orderId = isset($input['orderid']) ? $input['orderid'] : "";
        if (empty($orderId) && !App::environment('live')) {
            $orderId = time();
        }
        if ($amount <= 0 || empty($orderId)) {
            return 'REQUIRE_AMOUNT_OR_ORDERID';
        }

        $this->amount = $amount;
        $this->orderId = $orderId;
        return true;
    }

    /**
     * 
     * @return ServiceResponse $response
     */
    public function processPayment() {
        if (empty($this->amount) || empty($this->orderId)) {
            $response = new ServiceResponse(false, 'NOT_VALID_INPUT');
        }
        $response = $this->getPaymentPage($this->amount, $this->orderId);
        if (!$response instanceof ServiceResponse) {
            $response = new ServiceResponse(false, 'NOT_VALID_RESPONSE');
            return $response;
        }
        // Log::debug($response);
        if (empty($response->data)) {
            $response->status = false;
            $response->errorCode = 'NOT_VALID_DATA';
        }
        
        return $response;
    }

    /**
     * 
     * @return string
     */
    public function processReturnData($response) {
        parse_str($response, $arrResponse);
        $data = $this->processFeedbackData($arrResponse, "return");

        return $this->buildUrl($data);
    }

    public function processFeedbackData($response, $from) {
        $data = [
            'status' => 0,
            'message' => '',
        ];

        if (empty($response)) {
            $data['message'] = 'NO_RESPONE';
            return $data;
        }

        $data = array_merge($data,[
            'orderId' => isset($response['orderId']) ? $response['orderId'] : '',
            'amount' => isset($response['amount']) ? $response['amount'] : '',
            'transId' => isset($response['transId']) ? $response['transId'] : '',
            'payType' => isset($response['payType']) ? $response['payType'] : '',
            'payment' => self::NAME,
        ]);

        if (isset($response['resultCode']) && $response['resultCode'] == self::SUCCESS_CODE) {
            $data['status'] = 1;
        } else {
            //$data['message'] = isset($response['message']) ? $response['message'] : '';
            $data['message'] = 'Thanh toán không thành công!';

        }

        return $data;
    }

    public function prepareNotifyResponse($response, $feedbackResult) {
        $data = [
            'status' => self::SUCCESS_CODE,
            'message' => 'Order confirmed',
            'data' => [
                'billId' => isset($response['orderId']) ? $response['orderId'] : '',
                'momoTransId' => isset($response['transId']) ? $response['transId'] : '',
                'amount' => isset($response['amount']) ? $response['amount'] : '',
            ],
        ];
        $signRaw = "status=0&message=Order confirmed&amount=" . $data['data']['amount'] . "&billId=" 
        . $data['data']['billId'] . "&momoTransId=" . $data['data']['momoTransId'];
        $data['signature'] =  hash_hmac('sha256', $signRaw, env('PAYMENT_MOMO_SECRET'));
        return $data;
    }

    private function buildUrl($data) {
        $flatdata = [];
        foreach($data as $key => $value) {
            $flatdata[] = urlencode($key) . '=' . urlencode($value);
         }
        return env('CALLBACK_SERVER_MOMO') . '?' . implode("&", $flatdata);
    }

     /**
      * Get QR page of Momo
      *
      * @return ServiceResponse $response
      */
    private function getPaymentPage($amount, $orderid, $extras = []) {
        try {
            $result = $this->createPaymentRequest($amount, $orderid);
            $signature = $result['signature'];
            $data = json_decode($result['result'],true);
            Log::debug($data);
            if (!isset($data['resultCode'])) {
                return new ServiceResponse(false, "NOT_VALID_RESPONSE");
            }
            if ($data['resultCode'] == 0 && isset($data['payUrl'])) {
                return new ServiceResponse(true, 0, $data['payUrl']);
            } else {
                return new ServiceResponse(false, $data['resultCode'], $data);
            }
        } catch (\Exception $e) {
            return new ServiceResponse(false, 'EXCEPTION', $e);
        }
        return new ServiceResponse(false, "NOT_VALID_RESPONSE");
    }

    /**
     * create payment request send to momo
     * 
     * @return array()
     */
    private function createPaymentRequest($amount, $orderid) {
        $domain = $this->getServer() . '/v2/gateway/api/create';
        $partnerCode = env('PAYMENT_MOMO_PARTNER', '');
        $accessKey = env('PAYMENT_MOMO_ACCESS', '');
        $serectkey = env('PAYMENT_MOMO_SECRET', '');
        $orderInfo = 'Vui lòng thanh toán đơn hàng của bạn';
        $returnUrl = env('APP_URL') . '/payment-return/momo'; //'/api/payment/return/momo';
        $notifyurl = env('APP_URL') . '/payment-notify/momo';
        $requestId = time()."";
        $requestType = "captureWallet";
        $extraData = '';

        $signRaw = "accessKey=" . $accessKey
        . "&amount=" . $amount
        . "&extraData=" . $extraData
        . "&ipnUrl="  . $notifyurl
        . "&orderId=" . $orderid
        . "&orderInfo=" . $orderInfo
        . "&partnerCode=" . $partnerCode
        . "&redirectUrl=" . $returnUrl
        . "&requestId=" . $requestId
        . "&requestType=" . $requestType;
        
        Log::debug("signRaw=" . $signRaw);
        $signature =  hash_hmac('sha256', $signRaw, env('PAYMENT_MOMO_SECRET', ''));

        $data =  [
            'partnerCode' => $partnerCode,
            'requestId' => $requestId,
            'amount' => $amount,
            'orderId' => strval($orderid),
            'orderInfo' => $orderInfo,
            'redirectUrl' => $returnUrl,
            'ipnUrl' => $notifyurl,
            'requestType' => $requestType,
            'extraData' => $extraData,
            'lang' => 'vi',
            'signature' => $signature
        ];
        Log::debug($domain);
        Log::debug($data);

        $result = CurlHelper::Post($domain, json_encode($data));
        // Log::debug($result);
    
        return [
            'result' => $result,
            'signature' => $signature,
        ];
    }

    private function getServer() {
        if (App::environment('production')) {
            return env('PAYMENT_MOMO_SERVER', '');
        } else return 'https://test-payment.momo.vn';
    }
}

    /**
     * Momo test user: 0961800390
     * Momo test pass & otp: 000000
     */
