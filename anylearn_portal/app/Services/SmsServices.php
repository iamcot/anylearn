<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SmsServices
{
    const SMS = 'sms';
    const SMS_OTP = 'sms_otp';

    private $template = [
        self::SMS_OTP => [
            'title' => self::SMS_OTP,
            'template' => 'Ma xac thuc cua ban la {code}',
        ],
    ];

    protected $getUrl = 'http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_get';
    protected $postUrl = 'http://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json';
    protected $method;
    /**
     * Required
     */
    protected $Phone;
    /**
     * Required
     */
    protected $Content;
    /**
     * Required
     */
    protected $ApiKey;
    /**
     * Required
     */
    protected $SecretKey;
    /**
     * Required
     * SmsType = 2: brandname
     * SmsType = 8: fixed number
     * SmsType = 24: priority Zalo
     * SmsType = 25: normal Zalo
     */
    protected $SmsType;
    /**
     * Required when SmsType = 2
     */
    protected $Brandname;
    /**
     * Optional
     * 0: real
     * 1: test
     */
    protected $Sandbox;
    /**
     * Optional - schedule time to send sms
     * eg 2020/09/02 13:00:00
     */
    protected $SendDate;
    /**
     * Optional
     */
    protected $CallbackUr;

    function __construct($method = "get")
    {
        $this->method = $method;
        $this->ApiKey = env('SMS_APIKEY', '');
        $this->SecretKey = env('SMS_SECRETKEY', '');
        $this->CallbackUr = env('SMS_CALLBACK', '');
        $this->SmsType = 2; //it is required now
        $this->Brandname = env('SMS_BRANDNAME', 'anyLEARN');
        $this->Sandbox = env('SMS_SANDBOX', 0);
    }

    /**
     * Use SMS as a notif tool. Require table notifications
     */
    public function smsNotif($phone, $content, $smsType, $route = "")
    {
        if (!class_exists("App\Models\Notification")) {
            throw new \Exception("Hiện tại chưa hỗ trợ tính năng này.");
        }
        $user = User::where('phone', $phone)->first();
        if (!$user) {
            throw new \Exception("User không tồn tại.");
        }
        $data = [
            'type' => self::SMS,
            'title' => $smsType,
            'user_id' => $user->id,
            'content' => $content,
            'route' => $route,
        ];
        $sentSms = $this->to($phone)->content($content)->send();
        if ($sentSms['result']) {
            $data['is_send'] = 1;
            $data['send'] = date('Y-m-d H:i:s');
            $data['extra_content'] = $sentSms['data'];
            Notification::where('user_id', $user->id)
                ->where('type', self::SMS)
                ->where('title', self::SMS_OTP)
                ->whereNull('read')
                ->update([
                    'read' => DB::raw('NOW()')
                ]);
            Notification::create($data);
            return true;
        } else {
            $data['is_send'] = 0;
            $data['extra_content'] = $sentSms['error'];
            Notification::create($data);
            return false;
        }
        return false;
    }

    /**
     * Generate and send OTP to a phone number
     * @return boolean
     */
    public function smsOTP($phone)
    {
        //@TODO: prevent resend sameday
        $otp = mt_rand(100000, 999999); //substr(str_shuffle(MD5(microtime())), 0, 6);
        try {
            $config = $this->template[self::SMS_OTP];
            $result = $this->smsNotif($phone, $this->_buildContent($config['template'], [
                'code' => $otp,
            ]), self::SMS_OTP, $otp);
            // return $result;
        } catch (\Exception $e) {
            Log::error($e);
            // return false;
        }
        return true;
    }

    public function verifyOTP($phone, $otp, $setRead = true)
    {
        if (!class_exists("App\Models\Notification")) {
            throw new \Exception("Hiện tại chưa hỗ trợ tính năng này.");
        }
        $user = User::where('phone', $phone)->first();
        if (!$user) {
            throw new \Exception("User không tồn tại.");
        }
        $haveNotif = Notification::where('type', self::SMS)
            ->where('user_id', $user->id)
            ->whereNull('read')
            ->where('title', self::SMS_OTP)
            ->where('route', $otp)
            ->orderby('id', 'desc')
            ->first();
        if (!$haveNotif) {
            throw new \Exception("OTP không đúng");
        }
        if ($setRead) {
            Notification::find($haveNotif->id)->update([
                'read' => DB::raw('NOW()')
            ]);
        }

        return true;
    }

    public function isTest()
    {
        $this->Sandbox = 1;
        return $this;
    }

    public function isReal()
    {
        $this->Sandbox = 0;
        return $this;
    }

    public function to($receivePhone)
    {
        $this->Phone = $receivePhone;
        return $this;
    }

    public function content($content)
    {
        $this->Content = $content;
        return $this;
    }

    public function withBrand($brandname)
    {
        $this->SmsType = 2;
        $this->Brandname = $brandname;
        return $this;
    }

    public function send()
    {
        try {
            if ($this->method == 'post') {
                $response = $this->_post($this->postUrl, $this->_postJsonData());
            } else {
                $response = $this->_get($this->getUrl, $this->_getQueryData());
            }

            $result = json_decode($response, true);
            Log::debug($result);
            if (isset($result['CodeResult']) && $result['CodeResult'] == 100) {
                return [
                    'result' => true,
                    'data' => isset($result['SMSID']) ? $result['SMSID'] : ""
                ];
            } else {
                return [
                    'result' => false,
                    'error' => $result['ErrorMessage']
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

    private function _postJsonData()
    {
        if ($this->Phone == "" || $this->Content == "") {
            throw new \Exception("Chưa có phone hoặc nội dung.");
        }
        $body = [
            'ApiKey' => $this->ApiKey,
            'SecretKey' => $this->SecretKey,
            'Phone' => $this->Phone,
            'Content' => $this->Content,
            'SmsType' => $this->SmsType,
            'CallbackUrl' => $this->CallbackUr,
            'Sandbox' => $this->Sandbox,
        ];
        if ($this->SmsType == 2) {
            $body['Brandname'] = $this->Brandname;
        }
        return json_encode($body);
    }

    private function _getQueryData()
    {
        if ($this->Phone == "" || $this->Content == "") {
            throw new \Exception("Chưa có phone hoặc nội dung.");
        }
        $body = [
            'ApiKey' => $this->ApiKey,
            'SecretKey' => $this->SecretKey,
            'Phone' => $this->Phone,
            'Content' => $this->Content,
            'SmsType' => $this->SmsType,
            'CallbackUrl' => $this->CallbackUr,
            'Sandbox' => $this->Sandbox,
        ];
        if ($this->SmsType == 2) {
            $body['Brandname'] = $this->Brandname;
        }
        return http_build_query($body, '', '&', PHP_QUERY_RFC3986);
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

    private function _get($url, $query)
    {
        $url = $url . "?" . $query;
        Log::debug($url);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);

        curl_close($ch);
        return $result;
    }

    private function _buildContent($template, $data)
    {
        $keys = [];
        foreach (array_keys($data) as $key) {
            $keys[] = '{' . $key . '}';
        }

        return str_replace(
            $keys,
            array_values($data),
            $template
        );
    }
}
