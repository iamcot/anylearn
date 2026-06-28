<?php

namespace App\Services;

use App\Constants\ConfigConstants;
use App\Constants\ItemConstants;
use App\Constants\NotifConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Constants\UserDocConstants;
use App\DataObjects\ServiceResponse;
use App\DigitalSupport\OrderProcessor;
use App\Models\ItemCode;
use App\Mail\ReturnRequest;
use App\Models\Configuration;
use App\Models\Contract;
use App\Models\Item;
use App\Models\ItemExtra;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\OrderItemExtra;
use App\Models\SocialPost;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherEvent;
use App\Models\VoucherEventLog;
use App\Models\VoucherGroup;
use App\Models\VoucherUsed;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Notifications\Notification as NotificationsNotification;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use PSpell\Config;

class TransactionService
{
    public $returnRefundStatus = [
        OrderConstants::STATUS_REFUND,
        OrderConstants::STATUS_RETURN_BUYER,
        OrderConstants::STATUS_RETURN_SELLER,
        OrderConstants::STATUS_RETURN_SYSTEM,
    ];

    public function statusOperation($id, $oldStatus)
    {
        if ($oldStatus == ConfigConstants::TRANSACTION_STATUS_PENDING) {
            return '<a class="btn btn-sm btn-success" href="' . route('transaction.status.touch', ['id' => $id, 'status' => ConfigConstants::TRANSACTION_STATUS_DONE]) . '"><i class="fas fa-lock"></i> Duyệt</a>
            <a class="btn btn-sm btn-danger" href="' . route('transaction.status.touch', ['id' => $id, 'status' => ConfigConstants::TRANSACTION_STATUS_REJECT]) . '"><i class="fas fa-lock"></i> Từ chối</a>
            ';
        } else {
            return '<span class="text-' . $this->statusColor($oldStatus) . '">' . $this->statusText($oldStatus) . '</span>';
        }
    }
    public function extraFee($orderdetailid)
    {
        $rs = DB::table('order_item_extras')->where('order_detail_id', $orderdetailid)->get();
        return $rs;
    }
    public function sumextraFee($orderdetailid)
    {
        $rs = DB::table('order_item_extras')->where('order_detail_id', $orderdetailid)->sum('price');
        return $rs;
    }
    public function hasPendingOrders($userId)
    {
        $count = Order::where('user_id', $userId)
            ->where('status', OrderConstants::STATUS_PAY_PENDING)
            ->count();
        return $count;
    }
    public function hasPendingWithDraw()
    {
        $count = Transaction::where('type', ConfigConstants::TRANSACTION_WITHDRAW)
            ->where('status', 0)
            ->count();
        return $count;
    }
    public function statusWithDraw($userId)
    {
        $count = Transaction::where('type', ConfigConstants::TRANSACTION_WITHDRAW)
            ->where('user_id', $userId)
            ->count();
        return $count;
    }
    public function approveWalletcTransaction($id)
    {
        // update transaction
        $trans = Transaction::find($id);
        if ($trans->status === ConfigConstants::TRANSACTION_STATUS_PENDING) {
            $trans->update([
                'status' => ConfigConstants::TRANSACTION_STATUS_DONE,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
            // update c wallet
            User::find($trans->user_id)->update([
                'wallet_c' => DB::raw('wallet_c + ' . $trans->amount),
            ]);
            // send notif
            $notifServ = new Notification();
            $notifServ->createNotif(NotifConstants::TRANSACTIONN_UPDATE, $trans->user_id, [
                'content' => $trans->content
            ]);
            return true;
        } else {
            return false;
        }
    }

    public function approveWalletmTransaction($id)
    {
        $trans = Transaction::find($id);

        $trans->update([
            'status' => ConfigConstants::TRANSACTION_STATUS_DONE,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        User::find($trans->user_id)->update([
            'wallet_m' => DB::raw('wallet_m + ' . $trans->amount),
        ]);
        // send notif
        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::TRANSACTIONN_UPDATE, $trans->user_id, [
            'content' => $trans->content
        ]);
        return true;
    }

    public function statusText($status)
    {
        switch ($status) {
            case ConfigConstants::TRANSACTION_STATUS_PENDING:
                return 'ĐANG CHỜ';
            case ConfigConstants::TRANSACTION_STATUS_DONE:
                return 'ĐÃ DUYỆT';
            case ConfigConstants::TRANSACTION_STATUS_REJECT:
                return 'ĐÃ TỪ CHỐI';
            default:
                return '';
        }
    }

    public function statusColor($status)
    {
        switch ($status) {
            case ConfigConstants::TRANSACTION_STATUS_PENDING:
                return 'warning';
            case ConfigConstants::TRANSACTION_STATUS_DONE:
                return 'success';
            case ConfigConstants::TRANSACTION_STATUS_REJECT:
                return 'danger';
            default:
                return '';
        }
    }

    /**
     * Changed from Aug 13: If order not paid, new item will be added to open order
     */
    public function placeOrderOneItem(Request $request, $user, $itemId, $allowNoMoney = false, $autoApprove = false, $autoApproveChannel = 'VNPAY')
    {
        $childUser = $request->get('child', '');
        $input = $request->all();
        $item = Item::find($itemId);
        if (!$item) {
            return 'Trang không tồn tại';
        }
        if ($item->status != ItemConstants::STATUS_ACTIVE || $item->user_status != ItemConstants::USERSTATUS_ACTIVE) {
            return 'Khoá học không cho phép đăng ký lúc này.';
        }

        $alreadyRegister = DB::table('order_details as od')
            ->join('orders', 'orders.id', '=', 'od.order_id')
            ->whereIn('orders.status', [OrderConstants::STATUS_DELIVERED, OrderConstants::STATUS_NEW, OrderConstants::STATUS_PAY_PENDING])
            ->where('od.user_id', ($childUser > 0 ? $childUser : $user->id))
            ->where('od.item_id', $itemId)
            ->count();

        if ($alreadyRegister > 0 && $item->allow_re_register == 0) {
            return 'Bạn đã đăng ký khóa học này hoặc khóa học đang chờ thanh toán.';
        }

        $voucher = $request->get('voucher', '');
        $result = DB::transaction(function () use ($user, $item, $voucher, $childUser, $input, $allowNoMoney, $autoApprove, $autoApproveChannel) {
            $notifServ = new Notification();
            $openOrder = null;
            $status = OrderConstants::STATUS_DELIVERED;
            $amount = $item->price;
            $childUserDB = $childUser > 0 ? User::find($childUser) : null;

            $saleId = $this->findSaleIdFromBuyerOrItem($user->id, $item->id);

            if (!$openOrder) {
                $openOrder = Order::where('user_id', $user->id)
                    ->where('status', OrderConstants::STATUS_NEW)
                    ->orderBy('id', 'desc')
                    ->first();
                if ($openOrder) {
                    $status = OrderConstants::STATUS_NEW;
                    $transStatus = ConfigConstants::TRANSACTION_STATUS_PENDING;
                    Order::find($openOrder->id)->update([
                        'amount' => DB::raw('amount + ' . $amount),
                        'quantity' => DB::raw('quantity + 1'),
                    ]);
                } else {
                    // $status = $user->wallet_m >= $amount ? OrderConstants::STATUS_DELIVERED : OrderConstants::STATUS_NEW;
                    $status = OrderConstants::STATUS_NEW;
                    $transStatus = ConfigConstants::TRANSACTION_STATUS_PENDING;

                    $openOrder = Order::create([
                        'user_id' => $user->id,
                        'amount' => $amount,
                        'quantity' => 1,
                        'status' => $status,
                        'payment' => UserConstants::WALLET_M,
                        'sale_id' => $saleId,
                    ]);
                }

                User::find($user->id)->update([
                    'wallet_m' => DB::raw('wallet_m - ' . $amount),
                ]);
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => ConfigConstants::TRANSACTION_ORDER,
                    'amount' => (0 - $amount),
                    'pay_method' => UserConstants::WALLET_M,
                    'pay_info' => '',
                    'content' => 'Thanh toán đơn hàng #' . $openOrder->id,
                    'status' => $transStatus,
                    'order_id' => $openOrder->id
                ]);
            }
            if ($openOrder == null) {
                return "Không tạo được đơn hàng.";
            }
            //save order details
            $orderDetail = OrderDetail::create([
                'order_id' => $openOrder->id,
                'user_id' => ($childUser > 0 ? $childUser : $user->id),
                'item_id' => $item->id,
                'unit_price' => $item->price,
                'paid_price' => $item->price,
                'status' => $status,
                'item_schedule_plan_id' => !empty($input['plan']) ? $input['plan'] : null,
            ]);
            if (!empty($input['extrafee'])) {
                foreach ($input['extrafee'] as $key) {
                    $extrafee = ItemExtra::find($key);
                    $orderextra = OrderItemExtra::create([
                        'order_detail_id' => $orderDetail->id,
                        'item_id' => $item->id,
                        'title' => $extrafee->title,
                        'price' => $extrafee->price,
                    ]);
                    Order::find($openOrder->id)->update([
                        'amount' => DB::raw('amount + ' . $orderextra->price),
                    ]);
                }
            }

            $this->recalculateOrderAmount($openOrder->id);
            $usingVoucher = VoucherUsed::where('order_id', $openOrder->id)->first();
            if ($usingVoucher) {
                $this->removeTransactionsForCommissionVouchers($usingVoucher->id);
                VoucherUsed::find($usingVoucher->id)->delete();
            }

            // voucher event
            if ($status == OrderConstants::STATUS_DELIVERED) {
                $voucherEvent = new VoucherEventLog();
                $voucherEvent->useEvent(VoucherEvent::TYPE_CLASS, $user->id, $item->id);
            }

            $author = User::find($item->user_id);

            //cal commission direct, update direct user wallet M + wallet C, save transaction log
            $configM = new Configuration();
            $configs = $configM->gets([
                ConfigConstants::CONFIG_BONUS_RATE,
                ConfigConstants::CONFIG_DISCOUNT,
                ConfigConstants::CONFIG_COMMISSION,
                ConfigConstants::CONFIG_FRIEND_TREE,
                ConfigConstants::CONFIG_COMMISSION_FOUNDATION,
                ConfigConstants::CONFIG_COMMISSION_REF_SELLER,
            ]);

            if ($item->company_commission != null) {
                $overrideConfigs = json_decode($item->company_commission, true);
                foreach ($overrideConfigs as $key => $value) {
                    if ($value != null) {
                        $configs[$key] = $value;
                    }
                }
            }
            $userService = new UserServices();

            if ($item->commission_rate == -1) {
                $commissionRate = 0;
            } else {
                $commissionRate = $item->commission_rate > 0 ? $item->commission_rate : $author->commission_rate;
            }

            // pay author
            $authorCommission = floor($amount * $commissionRate / $configs[ConfigConstants::CONFIG_BONUS_RATE]);
            Transaction::create([
                'user_id' => $author->id,
                'type' => ConfigConstants::TRANSACTION_PARTNER,
                'amount' => $authorCommission,
                'ref_amount' => $amount,
                'pay_method' => UserConstants::WALLET_C,
                'pay_info' => '',
                'content' => 'Doanh thu từ bán khóa học: ' . $item->title,
                'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                'order_id' => $orderDetail->id, //TODO user order detail instead order id to know item
            ]);

            $directCommission = $userService->calcCommission(
                $amount,
                $commissionRate,
                $configs[ConfigConstants::CONFIG_DISCOUNT],
                $configs[ConfigConstants::CONFIG_BONUS_RATE],
            );

            // User::find($user->id)->update([
            //     'wallet_c' => DB::raw('wallet_c + ' . $directCommission),
            // ]);

            Transaction::create([
                'user_id' => $user->id,
                'type' => ConfigConstants::TRANSACTION_COMMISSION,
                'amount' => $directCommission,
                'ref_amount' => $amount,
                'pay_method' => UserConstants::WALLET_C,
                'pay_info' => '',
                'content' => 'Nhận điểm từ khóa học đã mua: ' . $item->title . ($childUserDB != null ? ' [' . $childUserDB->name . ']' : ''),
                'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                'order_id' => $orderDetail->id
            ]);

            //save commission indirect + transaction log in PENDING status
            $indirectCommission = $userService->calcCommission(
                $amount,
                $commissionRate,
                $configs[ConfigConstants::CONFIG_COMMISSION],
                $configs[ConfigConstants::CONFIG_BONUS_RATE]
            );

            $currentUserId = $user->user_id;
            for ($i = 1; $i < $configs[ConfigConstants::CONFIG_FRIEND_TREE]; $i++) {
                $refUser = User::find($currentUserId);
                if ($refUser) {
                    Transaction::create([
                        'user_id' => $refUser->id,
                        'type' => ConfigConstants::TRANSACTION_COMMISSION,
                        'amount' => $indirectCommission,
                        'pay_method' => UserConstants::WALLET_C,
                        'pay_info' => '',
                        'content' => 'Nhận điểm từ ' . $user->name . ' mua khóa học: ' . $item->title . ($childUserDB != null ? ' [' . $childUserDB->name . ']' : ''),
                        'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                        'ref_user_id' => $user->id,
                        'ref_amount' => $amount,
                        'order_id' => $orderDetail->id
                    ]);

                    $currentUserId = $refUser->user_id;
                } else {
                    break;
                }
            }

            // ref_seller
            $refSeller = User::find($author->user_id);
            if ($refSeller && $refSeller->get_ref_seller == 1) {

                $refSellerCommission = $userService->calcCommission(
                    $amount,
                    $commissionRate,
                    $configs[ConfigConstants::CONFIG_COMMISSION_REF_SELLER],
                    $configs[ConfigConstants::CONFIG_BONUS_RATE],
                );

                Transaction::create([
                    'user_id' => $refSeller->id,
                    'ref_user_id' => $author->id,
                    'type' => ConfigConstants::TRANSACTION_COMMISSION,
                    'amount' => $refSellerCommission,
                    'ref_amount' => $amount,
                    'pay_method' => UserConstants::WALLET_C,
                    'pay_info' => '',
                    'content' => 'Nhận điểm từ ' . $author->name . ' bán khoá học: ' . $item->title,
                    'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                    'order_id' => $orderDetail->id,
                ]);
            }

            // foundation
            $foundation = 0;
            if (!$item->is_test) {
                $foundation = $userService->calcCommission(
                    $amount,
                    $commissionRate,
                    $configs[ConfigConstants::CONFIG_COMMISSION_FOUNDATION],
                    1
                );
                Transaction::create([
                    'user_id' => 0,
                    'type' => ConfigConstants::TRANSACTION_FOUNDATION,
                    'amount' => $foundation,
                    'pay_method' => UserConstants::WALLET_M,
                    'pay_info' => '',
                    'content' => 'Nhận quỹ từ ' . $user->name . ' mua khóa học: ' . $item->title . ($childUserDB != null ? ' [' . $childUserDB->name . ']' : ''),
                    'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                    'ref_user_id' => $user->id,
                    'ref_amount' => $amount,
                    'order_id' => $orderDetail->id
                ]);
            }

            DB::commit();
            if ($status == OrderConstants::STATUS_DELIVERED) {
                $notifServ->createNotif(NotifConstants::COURSE_REGISTERED, $user->id, [
                    'course' => $item->title,
                ]);
                $notifServ->createNotif(NotifConstants::COURSE_HAS_REGISTERED, $author->id, [
                    'username' => $author->name,
                    'course' => $item->title,
                ]);
            }

            if ($autoApprove) {
                $this->approveRegistrationAfterWebPayment($openOrder->id, $autoApproveChannel);
            }

            return $transStatus == ConfigConstants::TRANSACTION_STATUS_DONE || $autoApprove
                ? $openOrder->id
                : ConfigConstants::TRANSACTION_STATUS_PENDING;
        });

        return $result;
    }

    public function addTransactionsForCommissionVouchers($voucherID, $orderID)
    {
        $currentOrder = Order::find($orderID);
        $usingVoucher = DB::table('vouchers')
            ->join('vouchers_used as vu', 'vu.voucher_id', '=', 'vouchers.id')
            ->where('vu.voucher_id', $voucherID)
            ->where('vu.order_id', $orderID)
            ->first();

        if (!$usingVoucher || !$currentOrder) {
            return 'Thông tin đơn hàng hoặc voucher không chính xác!';
        }

        $usingEvent = VoucherEvent::whereRaw('FIND_IN_SET(?, targets) > 0', [$usingVoucher->voucher_group_id])
            ->whereNotNull('ref_user_id')
            ->orderByDesc('id')
            ->first();

        if ($usingEvent && User::find($usingEvent->ref_user_id)) {
            $buyer  = User::find($currentOrder->user_id);
            $orders = OrderDetail::where('order_id', $currentOrder->id)->get();

            $configM = new Configuration();
            $defaultConfigs = $configM->gets([
                ConfigConstants::CONFIG_BONUS_RATE,
                ConfigConstants::CONFIG_COMMISSION_REF_VOUCHER,
            ]);

            foreach ($orders as $orderItem) {
                $item = Item::find($orderItem->item_id);
                $partner = User::find($item->user_id);

                $configs = $defaultConfigs;
                if ($item->company_commission != null) {
                    $overrideConfigs = json_decode($item->company_commission, true);
                    foreach ($overrideConfigs as $key => $value) {
                        if ($value != null) {
                            $configs[$key] = $value;
                        }
                    }
                }

                if ($item->commission_rate == -1) {
                    $partnerCommissionRate = 0;
                } else {
                    $partnerCommissionRate = $item->commission_rate > 0
                        ? $item->commission_rate
                        : $partner->commission_rate;
                }

                $voucherCommissionRate = $usingEvent->commission_rate
                    ? $usingEvent->commission_rate
                    : $configs[ConfigConstants::CONFIG_COMMISSION_REF_VOUCHER];

                $userServ = new UserServices();
                $voucherCommission = $userServ->calcCommission(
                    $item->price,
                    $partnerCommissionRate,
                    $voucherCommissionRate,
                    $configs[ConfigConstants::CONFIG_BONUS_RATE],
                );

                Transaction::create([
                    'type' => ConfigConstants::TRANSACTION_COMMISSION,
                    'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                    'pay_method' => UserConstants::WALLET_C,
                    'user_id' => $usingEvent->ref_user_id,
                    'amount' => $voucherCommission,
                    'ref_amount' => $item->price,
                    'content' => 'Nhận điểm từ ' . $buyer->name . ' sử dụng voucher từ sự kiện: ' . $usingEvent->title,
                    'order_id' => $orderItem->id,
                ]);
            }

            return true;
        }
    }

    public function removeTransactionsForCommissionVouchers($usedVoucherID)
    {
        $usingVoucher = DB::table('vouchers')
            ->join('vouchers_used as vu', 'vu.voucher_id', '=', 'vouchers.id')
            ->where('vu.id', $usedVoucherID)
            ->first();

        if (!$usingVoucher) {
            return 'Thông tin voucher không chính xác, không thể xóa!';
        }

        $usingEvent = VoucherEvent::whereRaw('FIND_IN_SET(?, targets) > 0', [$usingVoucher->voucher_group_id])
            ->whereNotNull('ref_user_id')
            ->orderByDesc('id')
            ->first();

        if ($usingEvent) {
            $transactions = DB::table('transactions')
                ->join('order_details as od', 'od.id', '=', 'transactions.order_id')
                ->join('orders', 'orders.id', '=', 'od.order_id')
                ->where('orders.id', $usingVoucher->order_id)
                ->where('transactions.type', ConfigConstants::TRANSACTION_COMMISSION)
                ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_PENDING)
                ->where('transactions.pay_method', UserConstants::WALLET_C)
                ->where('transactions.user_id', $usingEvent->ref_user_id)
                ->select('transactions.*')
                ->get();

            foreach ($transactions as $tran) {
                Transaction::find($tran->id)->delete();
            }
        }

        return true;
    }

    public function findSaleIdFromBuyerOrItem($buyerId, $itemId)
    {
        $buyer = User::find($buyerId);
        if ($buyer->sale_id) {
            return $buyer->sale_id;
        }
        $item = Item::find($itemId);
        if ($item->sale_id) {
            return $item->sale_id;
        }
        $author = User::find($item->user_id);
        if ($author->sale_id) {
            return $author->sale_id;
        }
        return null;
    }

    public function remove2Cart($od, $order, $user)
    {
        if ($od->status != OrderConstants::STATUS_NEW) {
            return false;
        }
        DB::transaction(function () use ($od, $order, $user) {

            Transaction::where('order_id', $od->id)->delete();
            OrderDetail::find($od->id)->delete();
            OrderItemExtra::Where('order_detail_id', $od->id)->where('item_id', $od->item_id)->delete();
            User::find($user->id)->update(
                ['wallet_m' => DB::raw('wallet_m + ' . $od->paid_price),]
            );
            Order::find($order->id)->update([
                'amount' => DB::raw('amount - ' . $od->paid_price),
                'quantity' => DB::raw('quantity - 1'),
            ]);

            $this->removeExchangePoint($user->id, $order->id);
            if ($order->quantity == 1) {
                Transaction::where('order_id', $order->id)->delete();
                VoucherUsed::where('order_id', $order->id)->delete();
                Order::find($order->id)->delete();
            } else {
                $usingVoucher = VoucherUsed::where('order_id', $order->id)->first();
                if ($usingVoucher) {
                    VoucherUsed::find($usingVoucher->id)->delete();
                }
                $this->recalculateOrderAmount($order->id);
            }
        });
        return true;
    }

    public function removeExchangePoint($userId, $orderId)
    {
        try {
            $tnx = Transaction::where('type', ConfigConstants::TRANSACTION_EXCHANGE)
                ->where('order_id', $orderId)
                ->where('user_id', $userId)
                ->first();

            // dd($userId, $orderId, $tnx);
            if (!$tnx) {
                return false;
            }
            User::find($userId)->update([
                'wallet_c' => DB::raw('wallet_c + ' . abs($tnx->amount)),
            ]);
            Transaction::find($tnx->id)->delete();
        } catch (\Exception $ex) {
            return false;
        }
        return true;
    }

    public function recalculateOrderAmount($orderId)
    {
        $orderDetails = OrderDetail::where('order_id', $orderId)->get();
        $amount = 0;
        foreach ($orderDetails as $item) {
            $amount += $item->paid_price;
            $amount += $this->sumextraFee($item->id);
        }
        Order::find($orderId)->update(
            ['amount' => $amount],
        );
        return true;
    }

    public function verifyVoucherInOrderBeforePayment($orderId)
    {
        $voucherInOrder = VoucherUsed::where('order_id', $orderId)->first();
        if (!$voucherInOrder) {
            return true;
        }
        $voucherDb = DB::table('vouchers')
            ->join('voucher_groups AS vg', 'vg.id', '=', 'vouchers.voucher_group_id')
            ->where('vouchers.id', $voucherInOrder->voucher_id)
            ->where('vouchers.status', 1)
            ->where('vg.status', 1)
            ->select('vg.type', 'vg.ext', 'vouchers.id', 'vouchers.amount', 'vg.value')
            ->first();
        if (!$voucherDb) {
            VoucherUsed::find($voucherInOrder->id)->delete();
            $this->recalculateOrderAmount($orderId);
            return false;
        }
        return true;
    }

    public function calculateVoucherValue($voucherDb, $orderAmount)
    {
        if ($voucherDb->rule_max > 0) {
            if ($orderAmount >= $voucherDb->rule_max) {
                return $voucherDb->value;
            } else {
                $ratio = $orderAmount / $voucherDb->rule_max;
                return round(($voucherDb->value * $ratio), 0);
            }
        }

        return $voucherDb->value;
    }

    public function recalculateOrderAmountWithVoucher($orderId, $value)
    {
        $order = Order::find($orderId);
        $value = floatval($value);
        $amount = false;
        if ($value >= 1000) {
            $amount =  ($value > $order->amount) ? 0 : ($order->amount - $value);
        } else if ($value > 0 && $value < 1) {
            $amount = $order->amount - ($order->amount * $value);
        }
        if ($amount === false) {
            return false;
        }

        Order::find($orderId)->update(
            ['amount' => $amount],
        );
        return true;
    }

    public function recalculateOrderAmountWithAnyPoint($orderId, $pointAmount, $bonusRate)
    {
        $order = Order::find($orderId);

        $amount = false;
        $amount = $order->amount - ($pointAmount * ($bonusRate ?? 0));
        $amount = $amount > 0 ? $amount : 0;

        Order::find($orderId)->update(
            ['amount' => $amount],
        );
        return true;
    }

    //@DEPRECATED
    public function approveRegistrationAfterDeposit($userId)
    {

        $children = User::where('user_id', $userId)
            ->where('is_child', 1)
            ->get();
        $ids = [$userId];
        if (count($children) > 0) {
            foreach ($children as $child) {
                $ids[] = $child->id;
            }
        }
        Log::debug("Approve register for Ids ", ["ids" => $ids]);

        $allUserNewOrders = Order::whereIn('user_id', $ids)
            ->where('status', OrderConstants::STATUS_NEW)
            ->get();
        if (count($allUserNewOrders) > 0) {
            $notifServ = new Notification();

            foreach ($allUserNewOrders as $order) {
                $userDB = User::find($userId);
                Log::debug("User", ["userId" => $userDB->id, "wallet_m" => $userDB->wallet_m]);
                if ($userDB->wallet_m >= $order->amount) {
                    $userDB->update([
                        'wallet_m' => DB::raw('wallet_m - ' . $order->amount)
                    ]);
                    OrderDetail::where('order_id', $order->id)->update([
                        'status' => OrderConstants::STATUS_DELIVERED
                    ]);
                    Order::find($order->id)->update([
                        'status' => OrderConstants::STATUS_DELIVERED
                    ]);
                    Transaction::where('type', ConfigConstants::TRANSACTION_ORDER)
                        ->where('order_id', $order->id)
                        ->update([
                            'status' => ConfigConstants::TRANSACTION_STATUS_DONE,
                        ]);

                    $orderDetails = OrderDetail::where('order_id', $order->id)->get();
                    $voucherEvent = new VoucherEventLog();
                    foreach ($orderDetails as $item) {
                        $voucherEvent->useEvent(VoucherEvent::TYPE_CLASS, $userId->id, $item->id);
                    }

                    Log::debug("Update all transaction & orders", ["orderId" => $order->id]);
                    $notifServ->createNotif(NotifConstants::COURSE_REGISTER_APPROVE, $userId, []);
                }
            }
        }
    }

    public function sendReturnRequest($orderId)
    {

        $order = Order::find($orderId);
        if (!$order && $order->status != OrderConstants::STATUS_DELIVERED) {
            return false;
        }

        $order->update(['status' => OrderConstants::STATUS_RETURN_BUYER_PENDING]);
        Mail::to(env('MAIL_FROM_ADDRESS'))
            ->bcc(env('MAIL_ADMIN_BCC', 'info.anylearn@gmail.com'))
            ->send(
                new ReturnRequest(['orderId' => $orderId, 'name' => Auth::user()->name])
            );
    }

    public function returnOrder($orderID, $trigger)
    {
        $openOrder = Order::find($orderID);
        if (!$openOrder || (
            $openOrder->status != OrderConstants::STATUS_DELIVERED &&
            $openOrder->status != OrderConstants::STATUS_RETURN_BUYER_PENDING
        )) {
            return false;
        }

        $transServ = new TransactionService();
        $zaloService = new ZaloServices(true);

        $user = User::find($openOrder->user_id);
        $orderDetails = OrderDetail::where('order_id', $openOrder->id)->get();

        // Return: anypoints are added from commissions  
        foreach ($orderDetails as $od) {
            $commissionReceivers = DB::table('transactions')
                ->join('users', 'users.id', '=', 'transactions.user_id')
                ->whereIn('transactions.type', [
                    ConfigConstants::TRANSACTION_COMMISSION,
                    ConfigConstants::TRANSACTION_PARTNER
                ])
                ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_DONE)
                ->where('transactions.pay_method', UserConstants::WALLET_C)
                ->where('transactions.order_id', $od->id)
                ->select('users.*', 'transactions.amount')
                ->get();

            foreach ($commissionReceivers as $cr) {
                $trans = Transaction::create([
                    'type' => ConfigConstants::TRANSACTION_EXCHANGE,
                    'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                    'pay_method' =>  UserConstants::WALLET_C,
                    'content' => 'Thu hồi ' . $cr->amount . ' anypoints vì đơn hàng #' .
                        $openOrder->id . ' được trả lại.',
                    'user_id' => $cr->id,
                    'amount' => -$cr->amount,
                    'order_id' => $od->id,
                ]);

                if ($trans) {
                    $transServ->approveWalletcTransaction($trans->id);
                }
            }

            $zaloService->sendZNS(ZaloServices::ZNS_ORDER_RETURN, $user->phone, [
                "date" => $od->created_at,
                "price" => $od->price,
                "name" => $user->name,
                "class" => Item::find($od->item_id)->title,
                "id" => $od->id,
            ]);
        }

        $allTrans = Transaction::where('order_id', $openOrder->id)
            ->whereIn(
                'type',
                [
                    ConfigConstants::TRANSACTION_ORDER,
                    ConfigConstants::TRANSACTION_EXCHANGE
                ]
            )
            ->where('status', ConfigConstants::TRANSACTION_STATUS_DONE)
            ->get();

        foreach ($allTrans as $tnx) {
            if ($tnx->type == ConfigConstants::TRANSACTION_ORDER) {
                Transaction::find($tnx->id)->update([
                    'status' => ConfigConstants::TRANSACTION_STATUS_REJECT,
                ]);
            }

            // Return: anypoints are used for the order
            if ($tnx->type == ConfigConstants::TRANSACTION_EXCHANGE) {
                $trans = Transaction::create([
                    'type' => ConfigConstants::TRANSACTION_EXCHANGE,
                    'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                    'pay_method' => UserConstants::WALLET_C,
                    'content' => 'Hoàn trả ' . $tnx->amount . ' anypoints vì đơn hàng #' .
                        $openOrder->id . ' được trả lại.',
                    'user_id' => $user->id,
                    'amount' => abs($tnx->amount),
                    'order_id' => $tnx->order_id
                ]);

                if ($trans) {
                    $transServ->approveWalletcTransaction($trans->id);
                }
            }
        }

        OrderDetail::where('order_id', $openOrder->id)->update([
            'status' => $trigger
        ]);

        Order::find($openOrder->id)->update([
            'status' => $trigger,
        ]);

        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::COURSE_RETURN, $openOrder->user_id, []);
        Log::debug("System return transaction & orders", ["orderId" => $openOrder->id]);

        return true;
    }

    public function refundOrder($orderId)
    {
        $openOrder = Order::find($orderId);
        if ($openOrder->status != OrderConstants::STATUS_RETURN_SYSTEM) {
            return false;
        }

        $openOrder->update([
            'status' => OrderConstants::STATUS_REFUND
        ]);

        OrderDetail::where('order_id', $orderId)->update([
            'status' => OrderConstants::STATUS_REFUND
        ]);

        $user = User::find($openOrder->user_id);

        $zaloService = new ZaloServices(true);
        $zaloService->sendZNS(ZaloServices::ZNS_ORDER_REFUND, $user->phone, [
            'name' => $user->name,
            'amount' => $openOrder->amount,
            "id" => $openOrder->id,
        ]);

        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::COURSE_REFUND, $openOrder->user_id, []);
        Log::debug("Refund orders", ["orderId" => $openOrder->id]);

        return true;
    }

    public function rejectRegistration($orderId, $trigger)
    {
        $openOrder = Order::find($orderId);
        if ($openOrder->status != OrderConstants::STATUS_NEW && $openOrder->status != OrderConstants::STATUS_PAY_PENDING) {
            return false;
        }
        $orderDetails = OrderDetail::where('order_id', $openOrder->id)->get();
        foreach ($orderDetails as $od) {
            $anypoint = Transaction::where('order_id', $od->id)->where('type', 'exchange')->first();
            if ($anypoint) {
                $user = User::where('id', $anypoint->user_id)->first();
                if ($user) {
                    $user->update([
                        'wallet_c' => $user->wallet_c + $anypoint->amount,
                    ]);
                    Transaction::create([
                        'user_id' => $user->id,
                        'type' => ConfigConstants::TRANSACTION_COMMISSION,
                        'amount' => $anypoint->amount,
                        'pay_method' => UserConstants::WALLET_C,
                        'pay_info' => '',
                        'content' => 'Hoàn điểm vì đơn hàng bị hủy',
                        'status' => ConfigConstants::TRANSACTION_STATUS_DONE,
                        'order_id' => $anypoint->order_id
                    ]);
                }
            }
        }

        // $user = User::find($openOrder->user_id);
        $notifServ = new Notification();
        OrderDetail::where('order_id', $openOrder->id)->update([
            'status' => $trigger
        ]);
        Order::find($openOrder->id)->update([
            'status' => $trigger,
        ]);
        Transaction::where('order_id', $openOrder->id)
            ->update([
                'status' => ConfigConstants::TRANSACTION_STATUS_REJECT,
            ]);

        Log::debug("Seller cancel transaction & orders", ["orderId" => $openOrder->id]);
        $notifServ->createNotif(NotifConstants::COURSE_REGISTER_REJECT, $openOrder->user_id, []);
        return true;
    }

    public function checkWalletCBeforeReturnOrder($orderID)
    {
        $openOrder = Order::find($orderID);
        if (!$openOrder || (
            $openOrder->status != OrderConstants::STATUS_DELIVERED &&
            $openOrder->status != OrderConstants::STATUS_RETURN_BUYER_PENDING
        )) {
            return false;
        }

        $orderDetails = OrderDetail::where('order_id', $orderID)->get();
        foreach ($orderDetails as $od) {
            $conditions = DB::table('transactions')
                ->join('users', 'users.id', '=', 'transactions.user_id')
                ->where('transactions.type', ConfigConstants::TRANSACTION_COMMISSION)
                ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_DONE)
                ->where('transactions.pay_method', UserConstants::WALLET_C)
                ->where('transactions.order_id', $od->id)
                ->selectRaw('
                    count(*) as total, 
                    sum(if(users.wallet_c >= transactions.amount, 1, 0)) as matching
                ')
                ->first();

            if ($conditions->total != $conditions->matching) {
                return false;
            }
        }

        return true;
    }

    public function approveRegistrationAfterWebPayment($orderId, $payment = OrderConstants::PAYMENT_ONEPAY)
    {
        $userService = new UserServices();
        $openOrder = Order::find($orderId);
        if ($openOrder->status != OrderConstants::STATUS_NEW && $openOrder->status != OrderConstants::STATUS_PAY_PENDING) {
            return "NOT_VALID_ORDER_STATUS";
        }

        try {
            $user = User::find($openOrder->user_id);
            Log::debug("ApproveRegistrationAfterWebPayment ", ["orderid" => $orderId, "payment" => $payment]);

            OrderDetail::where('order_id', $openOrder->id)->update([
                'status' => OrderConstants::STATUS_DELIVERED,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
            Order::find($openOrder->id)->update([
                'status' => OrderConstants::STATUS_DELIVERED,
                'payment' => $payment,
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            Transaction::where('type', ConfigConstants::TRANSACTION_ORDER)
                ->where('order_id', $openOrder->id)
                ->update([
                    'status' => ConfigConstants::TRANSACTION_STATUS_DONE,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);

            $orderDetails = OrderDetail::where('order_id', $openOrder->id)->get();
            $voucherEvent = new VoucherEventLog();

            foreach ($orderDetails as $orderItem) {
                $voucherEvent->useEvent(VoucherEvent::TYPE_CLASS, $user->id, $orderItem->item_id);

                $item = Item::find($orderItem->item_id);
                $author = User::find($item->user_id);

                if (($item->subtype == ItemConstants::SUBTYPE_DIGITAL
                        || $item->subtype == ItemConstants::SUBTYPE_VIDEO)
                    && env('CONFIG_TRANSACTION_APPROVE_MANUAL', 0) == 0
                ) {
                    $this->approveTransactionsAfterPayment($orderItem->id);
                }

                $notifServ = new Notification();
                $dataOrder = $this->orderDetailToDisplay($orderItem->id);

                $tnxPartner = Transaction::where('order_id', $orderItem->id)
                    ->where('type', ConfigConstants::TRANSACTION_PARTNER)
                    ->where('pay_method', UserConstants::WALLET_C)
                    ->first();
                $userService->MailToPartnerRegisterNew($item, $user->id, $author, $tnxPartner);

                $notifServ->createNotif(NotifConstants::COURSE_REGISTER_APPROVE, $openOrder->user_id, [
                    'username' => $user->name,
                    'className' => $dataOrder->title,
                    'orderData' => $dataOrder,
                    'extraFee' => $this->extraFee($orderItem->id),
                    'partner' => $author,
                ]);

                $notifServ->createNotif(NotifConstants::COURSE_HAS_REGISTERED, $author->id, [
                    'username' => $author->name,
                    'course' => $item->title,
                    'orderid' => $openOrder->id,
                ]);


                //ZALO to buyer
                $zaloService = new ZaloServices(true);
                $zaloService->sendZNS(ZaloServices::ZNS_ORDER_CONFIRMED, $user->phone, [
                    'id' => $dataOrder->id,
                    'created_at' => $dataOrder->created_at,
                    'student' => $dataOrder->childName,
                    'price' => $dataOrder->unit_price,
                    'name' => $user->name,
                    'class' => $dataOrder->title,
                ]);

                //@TODO Zalo to partner

                SocialPost::create([
                    'type' => SocialPost::TYPE_CLASS_REGISTER,
                    'user_id' => $user->id,
                    'ref_id' => $orderItem->item_id,
                    'image' => $item->image,
                    'day' => date('Y-m-d'),
                ]);

                if (ItemConstants::SUBTYPE_DIGITAL == $item->subtype) {
                    $this->supportDigitalItems($item, $user, $orderItem->id, $notifServ);
                }
            }
            Log::debug("Update all transaction & orders", ["orderId" => $openOrder->id]);
        } catch (\Exception $e) {
            Log::error($e);
            return $e->getMessage();
        }

        return true;
    }

    public function approveTransactionsAfterPayment($orderItemID)
    {
        $transOrder = DB::table('transactions')
            ->join('order_details as od', 'od.id', '=', 'transactions.order_id')
            ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_PENDING)
            ->where('od.status', OrderConstants::STATUS_DELIVERED)
            ->where('od.id', $orderItemID)
            ->select('transactions.*')
            ->get();

        if (!$transOrder) {
            return 'Thông tin đơn hàng không chính xác!';
        }

        foreach ($transOrder as $trans) {
            // Seller   
            if ($trans->type == ConfigConstants::TRANSACTION_PARTNER) {
                $this->approveWalletcTransaction($trans->id);
                continue;
            }

            // Commissions
            if ($trans->type == ConfigConstants::TRANSACTION_COMMISSION) {
                $this->approveWalletcTransaction($trans->id);
                continue;
            }

            // Foundation
            if ($trans->type == ConfigConstants::TRANSACTION_FOUNDATION) {
                Transaction::find($trans->id)->update([
                    'status' => ConfigConstants::TRANSACTION_STATUS_DONE,
                ]);
            }
        }

        return true;
    }

    public function supportDigitalItems($item, $user, $orderItemID, $notifServ)
    {
        try {
            $activationInfo = [];
            if (ItemConstants::ACTIVATION_SUPPORT_API == $item->activation_support) {
                $activationInfo = $this->getActivationInfoByAPI($item, $orderItemID);
                Log::debug("GOT activationInfo");
                Log::debug($activationInfo);
                ItemCode::create([
                    'code' => json_encode($activationInfo),
                    'item_id' => $item->id,
                    'user_id' => $user->id,
                    'order_detail_id' => $orderItemID,
                ]);
            } else {
                $itemCode = ItemCode::where('item_id', $item->id)->whereNull('user_id')->first();
                if (empty($itemCode)) {
                    throw new Exception("Activation code is not available for this course [$item->id]");
                }
                $itemCode->update(['user_id' => $user->id, 'order_detail_id' => $orderItemID,]);
                $activationInfo['code'] = $itemCode->code;
            }
            $activationInfo['course'] = $item->title;
            $activationInfo['method'] = $item->activation_support;
            $activationInfo['user'] = $user->name;
            $activationInfo['path'] = route('page.pdp', ['itemId' => $item->id, 'url' => $item->seo_url]);
        } catch (Exception $error) {
            Log::error('Unexpected error in supportDigitalItems', ['exception' => $error]);
            return false;
        }
        // dd($activationInfo);
        $notifServ->notifActivation($item->id, $user->id, $activationInfo);
        return true;
    }

    public function getActivationInfoByAPI($item, $orderItemID)
    {
        if (!$item || empty($item->product_id)) {
            throw new Exception('Invaild data to get activation info!');
        }
        $orderData = [
            'product_id' => $item->product_id,
            'transaction_id' => $orderItemID,
        ];
        $response = OrderProcessor::orderItemFromPartnerAPI($orderData, $item->user_id);
        if (!$response instanceof ServiceResponse || false === $response->status) {
            throw new Exception($response->errorCode);
        }
        return $response->data;
    }

    public function orderDetailsToDisplay($orderId)
    {
        return DB::table('order_details AS od')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->join('users AS u2', 'u2.id', '=', 'od.user_id')
            ->leftJoin('item_schedule_plans AS isp', 'isp.id', '=', 'od.item_schedule_plan_id')
            ->leftJoin('user_locations AS ul', 'ul.id', '=', 'isp.user_location_id')
            ->where('od.order_id', $orderId)
            ->select(
                'od.*',
                'items.title',
                'items.image',
                'items.date_start',
                'items.is_paymentfee',
                'items.subtype',
                'u2.name as childName',
                'u2.id as childId',
                'isp.title AS plan_title',
                'isp.weekdays AS plan_weekdays',
                'isp.date_start AS plan_date_start',
                'ul.title AS plan_location_name'
            )
            ->get();
    }

    public function orderDetailToDisplay($odId)
    {
        return DB::table('order_details AS od')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->join('users AS u2', 'u2.id', '=', 'od.user_id')
            ->leftJoin('item_schedule_plans AS isp', 'isp.id', '=', 'od.item_schedule_plan_id')
            ->leftJoin('user_locations AS ul', 'ul.id', '=', 'isp.user_location_id')
            ->where('od.id', $odId)
            ->select(
                'od.*',
                'items.title',
                'items.image',
                'items.date_start',
                'items.is_paymentfee',
                'u2.name as childName',
                'u2.id as childId',
                'isp.title AS plan_title',
                'isp.weekdays AS plan_weekdays',
                'isp.date_start AS plan_date_start',
                'isp.info AS plan_info',
                'ul.title AS plan_location_name',

            )
            ->first();
    }

    public function paymentPending($orderId)
    {
        $openOrder = Order::find($orderId);
        if ($openOrder->status != OrderConstants::STATUS_NEW) {
            return false;
        }
        OrderDetail::where('order_id', $openOrder->id)->update([
            'status' => OrderConstants::STATUS_PAY_PENDING,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        Order::find($openOrder->id)->update([
            'status' => OrderConstants::STATUS_PAY_PENDING,
            'payment' => OrderConstants::PAYMENT_ATM,
            'created_at' => date('Y-m-d H:i:s'),
        ]);
        Log::debug("Update order to pending", ["orderId" => $openOrder->id]);
        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::COURSE_REGISTER_PENDING, $openOrder->user_id, [
            'name' => '',
            'class' => '',
            'school' => '',
            'orderId' => $openOrder->id
        ]);
        return true;
    }

    public function grossRevenue($from = null, $to = null, $partner = null, $isAll = true)
    {
        $from = $from ? date('Y-m-d 00:00:00', strtotime($from)) : date('Y-m-d 00:00:00', strtotime("-30 days"));
        $to = $to ? date('Y-m-d 23:59:59', strtotime($to)) : date('Y-m-d H:i:s');
        $value = DB::table('order_details')
            ->where('order_details.created_at', '>', $from)
            ->where('order_details.created_at', '<', $to)
            ->whereIn('order_details.status', [OrderConstants::STATUS_DELIVERED]);
        if ($partner) {
            $value = $value->join('items', 'items.id', '=', 'order_details.item_id')
                ->where('items.user_id', $partner);
        }
        $value = $value->sum('order_details.paid_price');
        return abs($value);
    }

    public function netRevenue($from = null, $to = null, $partner = null, $isAll = true)
    {
        $from = $from ? date('Y-m-d 00:00:00', strtotime($from)) : date('Y-m-d 00:00:00', strtotime("-30 days"));
        $to = $to ? date('Y-m-d 23:59:59', strtotime($to)) : date('Y-m-d H:i:s');
        $grossRevenue = $this->grossRevenue($from, $to, $partner, $isAll);
        $sellerComm = DB::table('transactions')
            ->where('transactions.created_at', '>', $from)
            ->where('transactions.created_at', '<', $to)
            ->where('transactions.type', 'commission')
            ->where('transactions.content', 'like', '%bán khóa học%')
            ->where('transactions.status', '=', ConfigConstants::TRANSACTION_STATUS_DONE);
        if ($partner) {
            $sellerComm = $sellerComm
                ->join('order_details', 'order_details.id', '=', 'transactions.order_id')
                ->join('items', 'items.id', '=', 'order_details.item_id')
                ->where('items.user_id', $partner);
        }
        $sellerComm =  $sellerComm->sum('transactions.amount');
        return $grossRevenue - ($sellerComm * 1000);
    }

    public function grossProfit($from = null, $to = null, $partner = null, $isAll = true)
    {
        $from = $from ? date('Y-m-d 00:00:00', strtotime($from)) : date('Y-m-d 00:00:00', strtotime("-30 days"));
        $to = $to ? date('Y-m-d 23:59:59', strtotime($to)) : date('Y-m-d H:i:s');
        $netRevenue = $this->netRevenue($from, $to, $partner, $isAll);
        $otherCommission = DB::table('transactions')
            ->where('transactions.created_at', '>', $from)
            ->where('transactions.created_at', '<', $to)
            ->where('transactions.type', 'commission')
            ->where('transactions.content', 'not like', '%bán khóa học%')
            ->where('transactions.status', '=', ConfigConstants::TRANSACTION_STATUS_DONE);
        if ($partner) {
            $otherCommission = $otherCommission
                ->join('order_details', 'order_details.id', '=', 'transactions.order_id')
                ->join('items', 'items.id', '=', 'order_details.item_id')
                ->where('items.user_id', $partner);
        }
        $otherCommission = $otherCommission->sum('amount');
        // echo 'otherComm=' . $otherCommission;
        $foundation = DB::table('transactions')
            ->where('transactions.created_at', '>', $from)
            ->where('transactions.created_at', '<', $to)
            ->where('transactions.type', 'foundation')
            ->where('transactions.status', '<', 99);
        if ($partner) {
            $foundation = $foundation
                ->join('order_details', 'order_details.id', '=', 'transactions.order_id')
                ->join('items', 'items.id', '=', 'order_details.item_id')
                ->where('items.user_id', $partner);
        }
        $foundation = $foundation->sum('transactions.amount');
        // echo '@foundation='.$foundation;
        return $netRevenue - $foundation - ($otherCommission * 1000);
    }

    public function netProfit($from = null, $to = null, $partner = null, $isAll = true)
    {
        $from = $from ? date('Y-m-d 00:00:00', strtotime($from)) : date('Y-m-d 00:00:00', strtotime("-30 days"));
        $to = $to ? date('Y-m-d 23:59:59', strtotime($to)) : date('Y-m-d H:i:s');
        $grossProfit = $this->grossProfit($from, $to, $partner, $isAll);
        $expend = DB::table('transactions')
            ->where('created_at', '>', $from)
            ->where('created_at', '<', $to)
            ->whereIn('type', [
                'fin_salary',
                'fin_fixed_fee',
                'fin_variable_fee',
                'fin_marketing',
                'fin_event',
                'fin_assets',
                'fin_others'
            ])
            ->where('status', '<', 99)
            ->sum('amount');
        return $grossProfit - $expend;
    }

    public function calRequiredPoint($orderAmount, $wallet, $rate)
    {
        $pointForOrder = $orderAmount / $rate;
        $pointForOrder = $pointForOrder > 1 ? $pointForOrder : 1;
        return ceil($wallet > $pointForOrder ? $pointForOrder : $wallet);
    }

    public function colorStatus($status)
    {
        if ($status == OrderConstants::STATUS_PAY_PENDING) {
            return 'warning';
        }
        if ($status == OrderConstants::STATUS_DELIVERED) {
            return 'success';
        }
        if ($status == OrderConstants::STATUS_RETURN_BUYER_PENDING) {
            return 'warning';
        }
        if (in_array($status, $this->returnRefundStatus)) {
            return 'danger';
        }
        return 'secondary';
    }


    public function actionStatus($status, $orderData)
    {
        if ($status == OrderConstants::STATUS_PAY_PENDING) {
            return "<a data-orderid='$orderData->id' data-orderamount='$orderData->amount' href=" . route('order.approve', ['orderId' => $orderData->id]) . " class='btn btn-success btn-sm admin-approve col-10 btn-need-confirm'>Approve</a>
            <a href=" . route('order.reject', ['orderId' => $orderData->id]) . " class='btn btn-danger btn-sm mt-1 col-10 btn-need-confirm'>Cancel</a>";
        }
        if ($status == OrderConstants::STATUS_DELIVERED || $status == OrderConstants::STATUS_RETURN_BUYER_PENDING) {
            return "<a data-orderid='$orderData->id' data-orderamount='$orderData->amount' href=" . route('order.return', ['orderId' => $orderData->id, 'trigger' => OrderConstants::STATUS_RETURN_SYSTEM]) . " class='btn btn-danger btn-sm admin-approve col-10 btn-need-confirm'>Return</a>";
        }
        if (in_array($status, $this->returnRefundStatus) && $status != OrderConstants::STATUS_REFUND) {
            return "<a data-orderid='$orderData->id' data-orderamount='$orderData->amount' href=" . route('order.refund', ['orderId' => $orderData->id]) . " class='btn btn-danger btn-sm admin-approve col-10 btn-need-confirm'>Refund</a>";
        }
    }

    public function withdraw($anypoint)
    {
        $userServ = new UserServices();
        $bank = $userServ->bankaccount(auth()->user()->id);
        $creted = Transaction::create([
            'user_id' => auth()->user()->id,
            'type' => ConfigConstants::TRANSACTION_WITHDRAW,
            'amount' => ($anypoint * 1000),
            'pay_method' => UserConstants::WALLET_M,
            'pay_info' => '',
            'content' => 'Rút anyPoint từ tài khoản ' . auth()->user()->id .
                ' Ngân Hàng: ' . $bank->bank_name .
                ' Số tài khoản: ' . $bank->bank_no .
                ' Người hưởng thụ: ' . $bank->bank_account,
            'status' => 0,
            'order_id' => auth()->user()->id
        ])->id;
        return $creted;
    }
}
