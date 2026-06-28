<?php namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OtpServices
{
    const SERVIVCE_ZALO = 'zalo';
    const SERVIVCE_SMS = 'sms';
    const NOTIFICATION_TITLE = 'otp';

    private $service;

    function __construct($service = self::SERVIVCE_ZALO) {
        $this->service = $service;
    }

    public function genOtp($phone)
    {
        $otp = mt_rand(100000, 999999);
        $user = User::where('phone', $phone)->first();
        if (!$user) {
            throw new \Exception("User không tồn tại.");
        }
        $data = [
            'type' => $this->service,
            'title' => self::NOTIFICATION_TITLE,
            'user_id' => $user->id,
            'content' => $otp,
            'route' => $otp,
        ];
        // $data['send'] = date('Y-m-d H:i:s');
        Notification::where('user_id', $user->id)
            ->where('type', $this->service)
            ->where('title', self::NOTIFICATION_TITLE)
            ->whereNull('read')
            ->update([
                'read' => DB::raw('NOW()')
            ]);
        $newNotif = Notification::create($data);
        return [
            'notification_id' => $newNotif->id,
            'otp' => $otp
        ];
    }

    public function sendOTP($phone, $otp) {
        try {
            if ($this->service == self::SERVIVCE_ZALO) {
                $zaloService = new ZaloServices(true);
                $znsResult = $zaloService->sendZNS(ZaloServices::ZNS_OTP, $phone, $otp);
                $result = [
                    'result' => $znsResult['result'],
                    'data' => $znsResult['result'] ? $znsResult['data'] : $znsResult['error']
                ];
                return $result;
            } else if ($this->service == self::SERVIVCE_SMS) {
                $smsService = new SpeedSMSAPI();
                $content = "Ma OTP cua ban tren anyLEARN la " . $otp['otp']; 
                $smsResult = $smsService->sendSMS([$phone], $content, SpeedSMSAPI::SMS_TYPE_NOTIFY, "Verify");
                Log::debug($smsResult);
                $result = [
                    'result' => $smsResult['status'] == 'success' ? true : false,
                    'data' => json_encode($smsResult),
                ];
            } 
        } catch(\Exception $e) {
            Log::error($e);
        }
       
        return [
            'result' => false,
            'data' => 'CANNOT_SEND_OTP'
        ];
    }

    public function verifyOTP($phone, $otp, $setRead = true)
    {
        $user = User::where('phone', $phone)->first();
        if (!$user) {
            throw new \Exception("User không tồn tại.");
        }
        $haveNotif = Notification::where('type', $this->service)
            ->where('user_id', $user->id)
            ->whereNull('read')
            ->where('title', self::NOTIFICATION_TITLE)
            ->where('route', $otp)
            ->orderby('id', 'desc')
            ->first();
        if (!$haveNotif) {
            Log::debug($phone . "@" . $otp . "@" .$user->id);
            throw new \Exception("OTP không đúng");
        }
        if ($setRead) {
            Notification::find($haveNotif->id)->update([
                'read' => DB::raw('NOW()')
            ]);
        }

        return true;
    }
}
