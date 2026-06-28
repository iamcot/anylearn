<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\User;
use App\Services\OtpServices;
use App\Services\SmsServices;
use App\Services\ZaloServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class OTPResetPasswordController  extends Controller
{
    public function showOtpRequestForm(Request $request)
    {
        if ($request->get('phone')) {
            $phone = $request->get('phone');
            $service = env('OTP_SERVICE', OtpServices::SERVIVCE_ZALO);
            $otpService = new OtpServices($service);
            try {
                $genOtp = $otpService->genOtp($phone);
            } catch (\Exception $e) {
                Log::error($e);
                return redirect()->back()->withErrors([
                    'phone' => 'Không thể gửi OTP tới số điện thoại bạn vừa cung cấp. Xin hãy thử lại'
                ]);
            }
            
            $result = $otpService->sendOTP($phone, $genOtp);
            
            if (!$result['result']) {
                Notification::find($genOtp['notification_id'])->update([
                    'is_send' => 0,
                    'extra_content' => json_encode($result['data'])
                ]);
                return redirect()->back()->withErrors([
                    'phone' => 'Không thể gửi OTP tới số điện thoại bạn vừa cung cấp. Xin hãy thử lại'
                ]);
            } else {
                Notification::find($genOtp['notification_id'])->update([
                    'is_send' => 1,
                    'send' =>  date('Y-m-d H:i:s'),
                    'extra_content' => $result['data']
                ]);
                return redirect()->route('password.resetotp')->withInput(['phone' => $phone]);
            }
        }
        return view('auth.passwords.otp');
    }

    public function sendOtp(Request $request)
    {
        return view('auth.passwords.otp_reset');
    }

    public function updatePassword(Request $request)
    {
        $phone = $request->get('phone');
        $otp = $request->get('otp');
        $password = $request->get('password');
        $passwordConfirm = $request->get('password_confirmation');
        if ($password != $passwordConfirm) {
            return redirect()->back()->withInput()->withErrors([
                'password' => 'Vui lòng nhập lại mật khẩu'
            ]);
        }
        $service = env('OTP_SERVICE', OtpServices::SERVIVCE_ZALO);
        $otpService = new OtpServices($service);
        try {
            $result = $otpService->verifyOTP($phone, $otp);
            if ($result) {
                User::where('phone', $phone)->update([
                    'password' => Hash::make($password)
                ]);
                return redirect()->to('login')->with('notify', 'Mật khẩu đã được cập nhật, Vui lòng đăng nhập.');
            }
        } catch (\Exception $ex) {
            return redirect()->back()->withInput()->withErrors([
                'phone' => $ex->getMessage()
            ]);
        }
        return redirect()->back()->withInput()->withErrors([
            'phone' => 'Có lỗi xảy ra và không thể cập nhật mật khẩu, Vui lòng thử lại'
        ]);
    }
}
