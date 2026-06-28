<?php

namespace App\Http\Controllers\Apis;

use App\Constants\ConfigConstants;
use App\Constants\ItemConstants;
use App\Constants\NotifConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Http\Controllers\Controller;
use App\Models\Configuration;
use App\Models\Item;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherEvent;
use App\Models\VoucherEventLog;
use App\Services\TransactionService;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransactionApi extends Controller
{
    public function saveDeposit(Request $request)
    {
        $user = $request->get('_user');

        $paymentInput = $request->get('pay_method');
        $amountInput = $request->get('amount');
        $refAmount = 0;
        $status = 0;

        $usedVoucher = '';
        if ($paymentInput == 'voucher') {
            try {
                $voucherM = new Voucher();
                $amount = $voucherM->useVoucher($user->id, $amountInput);
                $usedVoucher = " bằng voucher " . $amountInput;
                $status = 1;
            } catch (\Exception $e) {
                return response($e->getMessage(), 400);
            }
        } else {
            $amount = $amountInput;
        }

        $rs = Transaction::create([
            'user_id' => $user->id,
            'type' => ConfigConstants::TRANSACTION_DEPOSIT,
            'amount' => $amount,
            'pay_method' => $paymentInput,
            'ref_amount' => $refAmount,
            'content' => 'Nạp tiền vào tài khoản' . $usedVoucher,
            'status' => $status,
        ]);
        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::TRANS_DEPOSIT_SENT, $user->id, [
            'amount' => number_format($rs->amount, 0, ',', '.'),
        ]);

        return response()->json(['result' => $rs != null ? true : false]);
    }

    public function saveExchange(Request $request)
    {
        $user = $request->get('_user');

        $point = $request->get('amount');
        if ($point > $user->wallet_c) {
            return response('Không đủ điểm', 400);
        }
        $configM = new Configuration();
        $rate = $configM->get(ConfigConstants::CONFIG_BONUS_RATE);
        $walletM = $point * $rate;
        $rs = User::find($user->id)->update([
            'wallet_c' => $user->wallet_c - $point,
            'wallet_m' => $user->wallet_m + $walletM,
        ]);
        $rs = Transaction::create([
            'user_id' => $user->id,
            'type' => ConfigConstants::TRANSACTION_EXCHANGE,
            'amount' => -$point,
            'pay_method' => 'wallet_c',
            'ref_amount' => -$point,
            'content' => "Đổi $point điểm sang tài khoản.",
            'status' => 1,
        ]);
        return response()->json(['result' => $rs ? true : false]);
    }

    public function saveWithdraw(Request $request)
    {
        $user = $request->get('_user');

        $point = $request->get('amount');
        if ($point > $user->wallet_c) {
            return response('Không đủ điểm', 400);
        }
        $bankInfoStr = $request->get('pay_info');
        $bankInfo = json_decode($bankInfoStr, true);
        if (empty($bankInfo)) {
            return response('Không có thông tin ngân hàng', 400);
        }

        $configM = new Configuration();
        $rate = $configM->get(ConfigConstants::CONFIG_BONUS_RATE);
        $walletM = $point * $rate;
        $rs = User::find($user->id)->update([
            'wallet_c' => $user->wallet_c - $point,
        ]);
        $rs = Transaction::create([
            'user_id' => $user->id,
            'type' => ConfigConstants::TRANSACTION_WITHDRAW,
            'amount' => -$point,
            'pay_method' => 'wallet_c',
            'pay_info' => $bankInfoStr,
            'ref_amount' => $walletM,
            'content' => "Rút $point điểm về ngân hàng.",
            'status' => 0,
        ]);
        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::TRANS_WITHRAW_APPROVED, $user->id, [
            'amount' => number_format($walletM, 0, ',', '.'),
            'point' => number_format($point, 0, ',', '.'),
        ]);
        return response()->json(['result' => $rs ? true : false]);
    }

    public function history(Request $request)
    {
        $user = $request->get('_user');

        $transM =  new Transaction();
        $walletM = $transM->history($user->id, UserConstants::WALLET_M);
        $walletC = $transM->history($user->id, UserConstants::WALLET_C);
        return response()->json([
            UserConstants::WALLET_M => $walletM,
            UserConstants::WALLET_C => $walletC,
        ]);
    }

    public function placeOrderOneItem(Request $request, $itemId)
    {
        $user = $request->get('_user');

        $transService = new TransactionService();
        $result = $transService->placeOrderOneItem($request, $user, $itemId);
        if ($result === true) {
            return response()->json(['result' => true]);
        }
        return response($result, 400);
    }
}
