<?php

namespace App\Services;

use App\Constants\ConfigConstants;
use App\Models\Configuration;
use App\Models\Notification;
use App\Models\ZNSContent;
use Illuminate\Support\Facades\Log;
use Zalo\Zalo;

class ZaloServices
{
    const ZALO_APP_ID = "2002287060275958653";
    const ZALO_APP_SECRET = "WEB5s6cmh3hj6cIDOJLx";

    const ZNS_ORDER_RETURN = 'ZNS_ORDER_RETURN';
    const TEMPLATE_ORDER_RETURN_ID = '281162';

    const ZNS_ORDER_REFUND = 'ZNS_ORDER_REFUND';
    const TEMPLATE_ORDER_REFUND_ID = '281184';
    const REFUND_POLICY = 7;

    const ZNS_ORDER_CONFIRMED = 'ZNS_ORDER_CONFIRMED';
    const TEMPLATE_ORDER_CONFIRMED_ID = '277980';

    const ZNS_OTP = 'ZNS_OTP';
    const TEMPLATE_OTP_ID = '275670';

    const ZALO_OAUTH = 'https://oauth.zaloapp.com/v4/oa/access_token';
    const ZNS_ENDPOINT = 'https://business.openapi.zalo.me/message/template';
    const OA_STATE = 'anylearn';
    const OA_CHALLENGE = 'vwIliF0AjbWFu4lV4g0fciDAI8OUie7tx2nM06_jdd8';
    const OA_CALLBACK = 'https://anylearn.vn/zalo';

    const GRANT_TYPE_CODE = 'authorization_code';
    const GRANT_TYPE_REFRESH = 'refresh_token';

    private $access_token;

    private $isTest;

    function __construct($getToken = false, $isTest = false)
    {
        if ($getToken) {
            $configM = new Configuration();
            $token = $configM->get(ConfigConstants::ZALO_TOKEN);
            $refresh = $configM->get(ConfigConstants::ZALO_REFRESH);
            $tokenExp = $configM->get(ConfigConstants::ZALO_TOKEN_EXP);

            if ($tokenExp < time()) {
                $code = $configM->get(ConfigConstants::ZALO_CODE);
                $tokenObj = $this->getToken($code, self::GRANT_TYPE_REFRESH, $refresh);

                if (!empty($tokenObj['access_token']) 
                && !empty($tokenObj['refresh_token'])
                && !empty($tokenObj['expires_in'])) {
                    $this->access_token = $tokenObj['access_token'];
                    $configM->createOrUpdate(ConfigConstants::ZALO_TOKEN, $tokenObj['access_token'], ConfigConstants::TYPE_ZALO, true);
                    $configM->createOrUpdate(ConfigConstants::ZALO_REFRESH, $tokenObj['refresh_token'], ConfigConstants::TYPE_ZALO, true);
                    $configM->createOrUpdate(ConfigConstants::ZALO_TOKEN_EXP, ($tokenObj['expires_in'] + time()), ConfigConstants::TYPE_ZALO, true);
                }
            } else {
                $this->access_token = $token;
            }
        }

        $this->isTest = $isTest;
    }

    public function generateUrl()
    {
        $config = array(
            'app_id' => self::ZALO_APP_ID,
            'app_secret' => self::ZALO_APP_SECRET
        );
        $zalo = new Zalo($config);
        $helper = $zalo->getRedirectLoginHelper();
        $callbackUrl = self::OA_CALLBACK;
        $codeChallenge = self::OA_CHALLENGE;
        $state = self::OA_STATE;
        $loginUrl = $helper->getLoginUrlByOA($callbackUrl, $codeChallenge, $state);
        return $loginUrl;
    }

    public function getToken($code, $type, $refreshToken = "")
    {
        try {
            $data = [
                'app_id' => self::ZALO_APP_ID,
                'grant_type' => $type,
            ];
            if ($type == self::GRANT_TYPE_CODE) {
                $data['code'] = $code;
                $data['code_verifier'] = self::OA_STATE;
            } else {
                $data['refresh_token'] = $refreshToken;
            }
            $response = $this->_postUrlEncode(self::ZALO_OAUTH, $data);
            return json_decode($response, true);
        } catch (\Exception $e) {
            Log::error($e);
        }
        return [
            'access_token' => '',
            'refresh_token' => '',
            'expires_in' => 0,
        ];
    }


    public function sendZNS($type, $phone,  $data)
    {
        if (empty($this->access_token)) {
            return [
                'result' => false,
                'error' => "NO_TOKEN"
            ];
        }
        try {
            $body = $this->buildBody($type, $phone, $data);
            $response = $this->_post(self::ZNS_ENDPOINT, $body);
            Log::debug("ZNS send $phone ==>");
            Log::debug($body);
            if (!empty($body)) {
                $content = json_decode($body, true);
                ZNSContent::create([
                    'phone' => $phone,
                    'template_data' => json_encode($data),
                    'template_id' => $content['template_id'],
                    'tracking_id' => $content['tracking_id'],
                ]);
            }
            $result = json_decode($response, true);
            Log::debug("ZNS response <==");
            Log::debug($result);
            if (isset($result['error']) && $result['error'] == 0) {
                return [
                    'result' => true,
                    'data' => isset($result['data']['msg_id']) ? $result['data']['msg_id'] : ""
                ];
            } else {
                return [
                    'result' => false,
                    'error' => $result['error'],
                ];
            }
        } catch (\Exception $e) {
            Log::error($e);
            return [
                'result' => false,
                'error' => $e->getMessage(),
            ];
        }
        return [
            'result' => false,
            'error' => "UNKNOW_REASON"
        ];
    }

    private function buildBody($type, $phone, $data)
    {
        if ($type == self::ZNS_ORDER_CONFIRMED) {
            return $this->orderConfirmedBody($phone, $data);
        } else if ($type == self::ZNS_OTP) {
            return $this->otpBody($phone, $data);
        } else if ($type == self::ZNS_ORDER_RETURN) {
            return $this->orderReturnBody($phone, $data);
        } else if ($type == self::ZNS_ORDER_REFUND) {
            return $this->orderRefundBody($phone, $data);
        }
        return false;
    }

    private function orderReturnBody($phone, $data)
    {
        if ($phone == "" || empty($orderData)) {
            throw new \Exception("Chưa có phone hoặc nội dung.");
        }
        $body = [
            'phone' => $this->correctPhone($phone),
            'template_id' => self::TEMPLATE_ORDER_RETURN_ID,
            'template_data' => [
                "date" => date("h:i:s d/m/Y", strtotime($data['created_at'])),
                "price" => $data['price'],
                "name" => $data['name'],
                "class" => $data['class'],
                "id" => $data['id'], # use order_detail_id
            ],
            'tracking_id' => md5(time()),
        ];
        if ($this->isTest) {
            $body['mode'] = 'development';
        }

        return json_encode($body);
    }

    private function orderRefundBody($phone, $data)
    {
        if ($phone == "" || empty($data)) {
            throw new \Exception("Chưa có phone hoặc nội dung.");
        }
        $body = [
            'phone' => $this->correctPhone($phone),
            'template_id' => self::TEMPLATE_ORDER_REFUND_ID,
            'template_data' => [
                "policy" => self::REFUND_POLICY,   
                "amount" => $data['amount'],
                "order_id" => $data['id'],
                "name" => $data['name'],    
            ],
            'tracking_id' => md5(time()),
        ];
        if ($this->isTest) {
            $body['mode'] = 'development';
        }

        return json_encode($body);
    }

    private function orderConfirmedBody($phone, $orderData)
    {
        if ($phone == "" || empty($orderData)) {
            throw new \Exception("Chưa có phone hoặc nội dung.");
        }
        $body = [
            'phone' => $this->correctPhone($phone),
            'template_id' => self::TEMPLATE_ORDER_CONFIRMED_ID,
            'template_data' => [
                "date" => date("h:i:s d/m/Y", strtotime($orderData['created_at'])),
                "student" => $orderData['student'],
                "price" => $orderData['price'],
                "name" => $orderData['name'],
                "phone_number" => $phone,
                "class" => $orderData['class'],
                "order_id" => $orderData['id']
            ],
            'tracking_id' => md5(time()),
        ];
        if ($this->isTest) {
            $body['mode'] = 'development';
        }

        return json_encode($body);
    }

    private function otpBody($phone, $data)
    {
        if ($phone == "" || empty($data['otp'])) {
            throw new \Exception("Chưa có phone hoặc nội dung.");
        }
        $body = [
            'phone' => $this->correctPhone($phone),
            'template_id' => self::TEMPLATE_OTP_ID,
            'template_data' => [
                'otp' => $data['otp'],
            ],
            'tracking_id' => md5(time()),
        ];
        if ($this->isTest) {
            $body['mode'] = 'development';
        }

        return json_encode($body);
    }

    private function correctPhone($phone)
    {
        return preg_replace('/^(?:\+?84|0)?/', '84', $phone);
    }

    private function _post($url, $data)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt(
            $ch,
            CURLOPT_HTTPHEADER,
            array(
                'access_token: ' . $this->access_token,
                'Content-Type: application/json',
                'Content-Length: ' . strlen($data)
            )
        );
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

        $result = curl_exec($ch);

        curl_close($ch);
        return $result;
    }

    private function _postUrlEncode($url, $data)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt(
            $ch,
            CURLOPT_HTTPHEADER,
            array(
                'Content-Type: application/x-www-form-urlencoded',
                'secret_key:' . self::ZALO_APP_SECRET
                // 'Content-Length: ' . strlen($data)
            )
        );
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

        $result = curl_exec($ch);

        curl_close($ch);
        return $result;
    }       
}
