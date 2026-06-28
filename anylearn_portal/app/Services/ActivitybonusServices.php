<?php

namespace App\Services;

use App\Constants\ActivitybonusConstants;
use App\Constants\ConfigConstants;
use App\Constants\UserConstants;
use App\Models\Activitybonus;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class ActivitybonusServices
{
    public function updateWalletC($userid, $key, $content, $itemid = null, $allowDuplicate = false, $approve = 0)
    {
        $user = User::find($userid);
        $activitybonus = new Activitybonus();
        if ($itemid != null) {
            $check = Transaction::where('user_id', $user->id)->where('pay_info', $key)->where('ref_id',$itemid)->first();
            if ($check == null || $allowDuplicate) {
                
                $result = Transaction::create([
                    'user_id' => $user->id,
                    'type' => ActivitybonusConstants::Activitybonus_Bonus,
                    'amount' => $activitybonus->get($key) ? $activitybonus->get($key) : 0,
                    'pay_method' => UserConstants::WALLET_C,
                    // 'pay_info' => $key,
                    'content' => $content,
                    'status' => $approve ? ConfigConstants::TRANSACTION_STATUS_DONE : ConfigConstants::TRANSACTION_STATUS_PENDING,
                    'order_id' => null,
                    'ref_id' => $itemid
                ]);
                if ($approve) {
                    $user->update([
                        'wallet_c' => $user->wallet_c + $activitybonus->get($key)
                    ]);
                }
                return $result;
            } else {
                return null;
            }
        } else {
            $check = Transaction::where('user_id', $user->id)->where('pay_info', $key)->first();
            if ($check == null || $allowDuplicate) {
               
                $result = Transaction::create([
                    'user_id' => $user->id,
                    'type' => ActivitybonusConstants::Activitybonus_Bonus,
                    'amount' => $activitybonus->get($key),
                    'pay_method' => UserConstants::WALLET_C,
                    // 'pay_info' => $key,
                    'content' => $content,
                    'status' => $approve ? ConfigConstants::TRANSACTION_STATUS_DONE : ConfigConstants::TRANSACTION_STATUS_PENDING,
                    'order_id' => null,
                    'ref_id' => null
                ]);
                if ($approve) {
                    $user->update([
                        'wallet_c' => $user->wallet_c + $activitybonus->get($key)
                    ]);
                }
                return $result;
            } else {
                return null;
            }
        }
        return null;
    }
}
