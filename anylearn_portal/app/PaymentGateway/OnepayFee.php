<?php

namespace App\PaymentGateway;

use App\DataObjects\ServiceResponse;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;

class OnepayFee implements PaymentInterface
{
    const NAME = 'onepayfee';
    const SUCCESS_CODE = "0";
    private $amount;
    private $orderId;
    private $ip;
    private $saveToken;
    private $existsToken;
    private $existsTokenExp;
    private $userId;

    public function validate($input)
    {
        $amount = isset($input['amount']) ? $input['amount'] : 0;
        $orderId = isset($input['orderid']) ? $input['orderid'] : "";
        $ip = isset($input['ip']) ? $input['ip'] : "";
        if (empty($orderId) && !App::environment('production')) {
            $orderId = time();
        }
        if ($amount <= 0 || empty($orderId) || empty($ip)) {
            return 'REQUIRE_AMOUNT_OR_ORDERID_IP';
        }

        $this->amount = $amount * 100; //special rule of 1pay
        $this->orderId = $orderId;
        $this->ip = $ip;

        $this->saveToken = isset($input['save_card']) ? $input['save_card'] : false;
        $this->existsToken = isset($input['token_num']) ? $input['token_num'] : false;
        $this->existsTokenExp = isset($input['token_exp']) ? $input['token_exp'] : false;

        if ($this->saveToken || $this->existsToken) {
            $this->userId = isset($input['user_id']) ? $input['user_id'] : false;
            if ($this->userId === false) {
                return 'REQUIRED_USER_INFO_TO_USE_CARD';
            }
        }
        return true;
    }

    public function processPayment()
    {
        if (empty($this->amount) || empty($this->orderId) || empty($this->ip)) {
            $response = new ServiceResponse(false, 'NOT_VALID_INPUT');
        }
        $response = $this->getPaymentPage();
        if (!$response instanceof ServiceResponse) {
            $response = new ServiceResponse(false, 'NOT_VALID_RESPONSE');
            return $response;
        }

        if (empty($response->data)) {
            $response->status = false;
            $response->errorCode = 'NOT_VALID_DATA';
        }

        return $response;
    }

    public function processReturnData($str)
    {
       
        $data = $this->processFeedbackData($str, "return");

        return $this->buildUrl($data);
    }

    public function prepareNotifyResponse($response, $feedbackResult)
    {
        $responseCode = $feedbackResult['status'] ? 1 : 0;
        $data = "responsecode=$responseCode&desc=confirm-success";
        return $data;
    }

    public function processFeedbackData($str, $from)
    {
        $response = [];
        foreach (explode('&', $str) as $couple) {
            list($key, $val) = explode('=', $couple);
            $response[$key] = $val;
        }
        $data = [
            'status' => 0,
            'message' => '',
        ];

        if (empty($response)) {
            $data['message'] = 'NO_RESPONE';
            return $data;
        }

        $data = array_merge($data, [
            'orderId' => isset($response['vpc_OrderInfo']) ? $response['vpc_OrderInfo'] : '',
            'amount' => isset($response['vpc_Amount']) ? $response['vpc_Amount'] : '',
            'transId' => isset($response['vpc_MerchTxnRef']) ? $response['vpc_MerchTxnRef'] : '',
            'payType' => 'web',
            'payment' => self::NAME,
        ]);

        if (isset($response['vpc_TokenNum'])) {
            $data['newTokenNum'] = $response['vpc_TokenNum'];
            $data['newTokenExp'] = isset($response['vpc_TokenExp']) ? $response['vpc_TokenExp'] : '';
            $data['newCardType'] = isset($response['vpc_Card']) ? $response['vpc_Card'] : '';
            $data['newCardUid'] = isset($response['vpc_CardUid']) ? $response['vpc_CardUid'] : '';
        }

        if (!$this->checkHash($response)) {
            $data['message'] = 'INVALID_HASH';
            return $data;
        }

        if (isset($response['vpc_TxnResponseCode']) && $response['vpc_TxnResponseCode'] == self::SUCCESS_CODE) {
            $data['status'] = 1;
        } else {
            $data['message'] = isset($response['vcp_Message']) ? $response['vcp_Message'] : $this->getResponseDescription($response['vpc_TxnResponseCode']);
        }
        return $data;
    }

    private function buildUrl($data)
    {
        $flatdata = [];
        foreach ($data as $key => $value) {
            $flatdata[] = urlencode($key) . '=' . urlencode($value);
        }
        return env('CALLBACK_SERVER_FEE') . '?' . implode("&", $flatdata);
    }

    public function checkHash($input)
    {
        if (
            strlen(env('PAYMENT_ONEPAY_FEE_SECRET')) > 0
            && $input["vpc_TxnResponseCode"] != "7"
            && $input["vpc_TxnResponseCode"] != "No Value Returned"
        ) {
            $hash = isset($input['vpc_SecureHash']) ? $input['vpc_SecureHash'] : '';
            ksort($input);
            $stringHashData = "";

            foreach ($input as $key => $value) {
                if ($key != "vpc_SecureHash" && (strlen($value) > 0) && ((substr($key, 0, 4) == "vpc_") || (substr($key, 0, 5) == "user_"))) {
                    $stringHashData .= $key . "=" . $value . "&";
                }
            }
            $stringHashData = rtrim($stringHashData, "&");
            $stringHashData = urldecode($stringHashData);
            Log::debug($stringHashData);
            $checkedHash = strtoupper(hash_hmac('SHA256', $stringHashData, pack('H*', env('PAYMENT_ONEPAY_FEE_SECRET'))));
            if (hash_equals($hash, $checkedHash)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get payment page of Onepay
     *
     * @return ServiceResponse $response
     */
    private function getPaymentPage()
    {
        try {
            $result = $this->createPaymentRequest();
            $signature = $result['signature'];
            $url = $result['result'];
            return new ServiceResponse(true, 0, $url);
        } catch (\Exception $e) {
            return new ServiceResponse(false, 'EXCEPTION', $e);
        }
        return new ServiceResponse(false, "NOT_VALID_RESPONSE");
    }

    /**
     * create payment request query
     * 
     * @return array()
     */
    private function createPaymentRequest()
    {
        $returnUrl = env('APP_URL') . '/payment-return/onepayfee';
        $notifyurl = env('APP_URL') . '/payment-notify/onepayfee';
        $data =  [
            'vpc_Version' => 2,
            'vpc_Currency' => 'VND',
            'vpc_Command' => 'pay',
            'vpc_AccessCode' => env('PAYMENT_ONEPAY_FEE_ACCESSCODE'),
            'vpc_Merchant' => env('PAYMENT_ONEPAY_FEE_MERCHANT'),
            'vpc_Locale' => 'vn',
            'vpc_ReturnURL' => $returnUrl,
            'vpc_MerchTxnRef' => $this->orderId . time() . '',
            'vpc_OrderInfo' => strval($this->orderId),
            'vpc_Amount' => strval($this->amount),
            'AgainLink' => $notifyurl,
            'Title' => 'anyLEARN',
            'vpc_TicketNo' => $this->ip,
        ];
        if ($this->existsToken) {
            $data['vpc_TokenNum'] = $this->existsToken;
            $data['vpc_TokenExp'] = $this->existsTokenExp;
            $data['vpc_Customer_Id'] = $this->userId;
        } else if ($this->saveToken) {
            $data['vpc_CreateToken'] = 'true';
            $data['vpc_Customer_Id'] = $this->userId;
        }

        $flatdata = [];
        $hashRawData = [];
        ksort($data);
        foreach ($data as $key => $value) {
            $flatdata[] = urlencode($key) . '=' . urlencode($value);
            if ((strlen($value) > 0) && ((substr($key, 0, 4) == "vpc_") || (substr($key, 0, 5) == "user_"))) {
                $hashRawData[] = $key . "=" . $value;
            }
        }
        $query = implode("&", $flatdata);
        $hashRaw = implode("&", $hashRawData);

        $signature =  strtoupper(hash_hmac('sha256', $hashRaw, pack('H*', env('PAYMENT_ONEPAY_FEE_SECRET'))));

        $query = $this->getServer() . '?' . $query . '&vpc_SecureHash=' . $signature;
        return [
            'result' => $query,
            'signature' => $signature,
        ];
    }

    private function getServer()
    {
        // if (App::environment('production')) {
        return env('PAYMENT_ONEPAY_FEE_SERVER', 'https://mtf.onepay.vn/paygate/vpcpay.op');
        //   } else return 'https://mtf.onepay.vn/paygate/vpcpay.op';
    }

    private function getResponseDescription($responseCode)
    {

        switch ($responseCode) {
            case "0":
                $result = "Giao dịch thành công - Successful Transaction";
                break;
            case "1":
                $result = "Ngân hàng từ chối giao dịch - Bank Declined";
                break;
            case "3":
                $result = "Mã đơn vị không tồn tại - Merchant not exist";
                break;
            case "4":
                $result = "Không đúng access code - Invalid Access Code";
                break;
            case "5":
                $result = "Số tiền không hợp lệ - Invalid Amount";
                break;
            case "6":
                $result = "Mã tiền tệ không tồn tại - Invalid Currency Code";
                break;
            case "7":
                $result = "Lỗi không xác định - Unspecified Failure";
                break;
            case "8":
                $result = "Số thẻ không đúng - Invalid Card Number";
                break;
            case "9":
                $result = "Tên chủ thẻ không đúng - Invalid Card Name";
                break;
            case "10":
                $result = "Thẻ hết hạn/Thẻ bị khóa - Expired Card";
                break;
            case "11":
                $result = "Thẻ chưa đăng ký sử dụng dịch vụ - Card Not Registed Service (Internet Banking)";
                break;
            case "12":
                $result = "Ngày phát hành/Hết hạn không đúng - Invalid card date";
                break;
            case "13":
                $result = "Vượt quá hạn mức thanh toán - Exist Amount";
                break;
            case "21":
                $result = "Số tiền không đủ để thanh toán - Insufficient Fund";
                break;
            case "24":
                $result = "Thông tin thẻ không đúng - Invalid Card Info";
                break;
            case "25":
                $result = "OTP không đúng - Invalid OTP";
                break;
            case "253":
                $result = "Quá thời gian thanh toán - Transaction Time out";
                break;
            case "99":
                $result = "Người sủ dụng hủy giao dịch - User cancel";
                break;
            default:
                $result = "Giao dịch thất bại - Failured";
        }
        return $result;
    }
}

    // 'vpc_SHIP_Street01' => '',
    // 'vpc_SHIP_Provice' => '',
    // 'vpc_SHIP_City' => '',
    // 'vpc_SHIP_Country' => '',
    // 'vpc_Customer_Phone' => '',
    // 'vpc_Customer_Email' => '',
    // 'vpc_Customer_Id' => '',