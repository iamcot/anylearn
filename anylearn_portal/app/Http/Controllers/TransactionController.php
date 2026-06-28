<?php

namespace App\Http\Controllers;

use App\Constants\ActivitybonusConstants;
use App\Constants\ConfigConstants;
use App\Constants\FileConstants;
use App\Constants\NotifConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\DataObjects\ServiceResponse;
use App\DigitalSupport\Monkey;
use App\DigitalSupport\OrderCreationProcessor;
use App\Models\Configuration;
use App\Models\Item;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\OrderItemExtra;
use App\Models\Schedule;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserBank;
use App\Models\Voucher;
use App\Models\VoucherGroup;
use App\Models\VoucherUsed;
use App\PaymentGateway\OnepayLocal;
use App\PaymentGateway\Processor;
use App\PaymentGateway\Vnpay;
use App\Services\FileServices;
use App\Services\ItemServices;
use App\Services\QRServices;
use App\Services\TransactionService;
use App\Services\UserServices;
use Aws\Api\Parser\Crc32ValidatingParser;
use Exception;
use Hamcrest\Type\IsNumeric;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Response;

class TransactionController extends Controller
{
    public function transaction(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $this->data['transaction'] = Transaction::orderby('id', 'desc')
            ->with('user');
        if ($request->get('t')) {
            if ($request->get('t') == 'type') {
                $this->data['transaction'] = $this->data['transaction']->where('type', $request->get('s'));
            }
            if ($request->get('t') == 'status') {
                $this->data['transaction'] = $this->data['transaction']->where('status', $request->get('s'));
            }
        }
        $this->data['transaction'] = $this->data['transaction']->paginate(20);
        $this->data['navText'] = __('Quản lý Giao dịch');
        return view('transaction.list', $this->data);
    }

    public function orderOpen(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $this->data['orders'] = DB::table('orders')
            ->join('users', 'users.id', '=', 'orders.user_id')
            ->where('orders.status', OrderConstants::STATUS_PAY_PENDING)
            ->select(
                'orders.*',
                'users.name',
                'users.phone',
                DB::raw("(SELECT GROUP_CONCAT(items.title SEPARATOR ',' ) as classes FROM order_details AS os JOIN items ON items.id = os.item_id WHERE os.order_id = orders.id) as classes")
            )->orderby('orders.id', 'desc')
            ->paginate();
        $this->data['navText'] = __('Đơn hàng chờ xác nhận');
        return view('transaction.order_open', $this->data);
    }

    public function allOrder(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'order.all')) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        if ($request->input('action') == 'clear') {
            return redirect()->route('order.all');
        }
        $orders = DB::table('orders')
            ->join('users', 'users.id', '=', 'orders.user_id');

        if (Auth::user()->role == UserConstants::ROLE_SALE) {
            $orders = $orders->where('orders.sale_id', $user->id);
        }

        if ($request->input('id_f') > 0) {
            if ($request->input('id_t') > 0) {
                $orders = $orders->where('orders.id', '>=', $request->input('id_f'))->where('orders.id', '<=', $request->input('id_t'));
            } else {
                $orders = $orders->where('orders.id', $request->input('id_f'));
            }
        }
        if ($request->input('name')) {
            $orders = $orders->where('users.name', 'like', '%' . $request->input('name') . '%');
        }
        if ($request->input('classes')) {
            $orders = $orders->join('order_details', 'order_details.order_id', '=', 'orders.id')
                ->join('items', 'items.id', '=', 'order_details.item_id')
                ->where('items.title', 'like', '%' . $request->input('classes') . '%');
        }
        if ($request->input('phone')) {
            $orders = $orders->where('users.phone', $request->input('phone'));
        }

        if ($request->input('status')) {
            if ($request->input('status') != 'all') {
                $orders = $orders->where('orders.status', $request->input('status'));
            }
        } else {
            $orders = $orders->where('orders.status', '!=', 'new');
        }
        if ($request->input('payment')) {
            $orders = $orders->where('orders.payment', $request->input('payment'));
        }
        if ($request->input('date')) {
            $orders = $orders->whereDate('orders.created_at', '>=', $request->input('date'));
        }

        if ($request->input('datet')) {
            $orders = $orders->whereDate('orders.created_at', '<=', $request->input('datet'));
        }
        $exOrder = new Order();
        if ($request->input('action') == 'file') {
            $order = $exOrder->searchOrders($request, true);
            if (!$order) {
                return redirect()->route('transaction.order_all');
            }
            $headers = [
                // "Content-Encoding" => "UTF-8",
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=anylearn_order_" . now() . ".csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];
            $callback = function () use ($order) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
                fputcsv($file, array_keys($order[0]));
                foreach ($order as $row) {
                    mb_convert_encoding($row, 'UTF-16LE', 'UTF-8');
                    fputcsv($file, $row);
                }
                fclose($file);
            };
            // dd($callback);
            return response()->stream($callback, 200, $headers);
            // return response()->download($callback, 200, $headers);
        }
        $this->data['orders'] = $orders->leftJoin('vouchers_used', 'vouchers_used.order_id', '=', 'orders.id')
            ->leftJoin('vouchers', 'vouchers_used.voucher_id', '=', 'vouchers.id')
            ->leftJoin('transactions', function ($query) {
                $query->on('transactions.order_id', '=', 'orders.id')
                    ->where('transactions.type', '=', ConfigConstants::TRANSACTION_EXCHANGE);
            })
            ->select(
                'orders.*',
                'users.name',
                'users.phone',
                'users.address',
                'vouchers.voucher',
                'vouchers.value AS voucher_value',
                'transactions.amount AS anypoint',
                DB::raw("(SELECT GROUP_CONCAT(
                    CASE WHEN item_schedule_plans.title IS NOT NULL THEN 
                        CONCAT(items.title, '(Lịch học: ', COALESCE(item_schedule_plans.title, ''), ')')
                    ELSE
                        items.title
                    END SEPARATOR ';' ) as classes FROM order_details AS os 
                JOIN items ON items.id = os.item_id 
                LEFT JOIN item_schedule_plans ON os.item_schedule_plan_id = item_schedule_plans.id
                WHERE os.order_id = orders.id
                ) as classes")
            )->orderby('orders.id', 'desc')
            ->paginate();
        $this->data['navText'] = __('Đơn hàng đã đặt');
        return view('transaction.order_all', $this->data);
    }

    public function approveOrder($orderId)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $order = Order::find($orderId);
        if ($order->status != OrderConstants::STATUS_PAY_PENDING) {
            return redirect()->back()->with('notify', 'Status đơn hàng không đúng');
        }
        $transService = new TransactionService();
        $transService->approveRegistrationAfterWebPayment($orderId, OrderConstants::PAYMENT_ATM);

        return redirect()->back()->with('notify', 'Đã xác nhận thành công.');
    }

    public function deliveredOrders()
    {
        $orders = DB::table('orders')
            ->join('order_details as od', 'od.order_id', '=', 'orders.id')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->where('orders.user_id', Auth::id())
            ->whereIn('orders.status', [
                OrderConstants::STATUS_DELIVERED,
                OrderConstants::STATUS_RETURN_BUYER_PENDING,
                OrderConstants::STATUS_RETURN_SYSTEM,
                OrderConstants::STATUS_REFUND,
            ])
            ->selectRaw("orders.*, group_concat(items.title SEPARATOR ', ') as classes")
            ->groupBy('od.order_id')
            ->orderBy('orders.id', 'desc')
            ->paginate(20);

        $this->data['orders'] =  $orders;
        return view(env('TEMPLATE', '') . 'me.order_return', $this->data);
    }

    public function sendReturnRequest($orderId)
    {
        $order = Order::find($orderId);
        if (!$order && $order->status != OrderConstants::STATUS_DELIVERED) {
            return redirect()->back()->with('notify', 'Có lỗi xảy ra vui lòng thử lại!!');
        }

        $transService = new TransactionService();
        $transService->sendReturnRequest($orderId);

        return redirect()->back()->with('notify', 'Yêu cầu hoàn trả đơn hàng của bạn đã được gửi đi!');
    }

    public function returnOrder($orderId, $trigger)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $order = Order::find($orderId);
        if (
            $order->status != OrderConstants::STATUS_DELIVERED
            && $order->status != OrderConstants::STATUS_RETURN_BUYER_PENDING
        ) {
            return redirect()->back()->with('notify', 'Status đơn hàng không đúng');
        }
        $transService = new TransactionService();
        if (!$transService->checkWalletCBeforeReturnOrder($orderId)) {
            return redirect()->back()->with('notify', 'Đơn hàng này không đủ điều kiện để thực hiện hoàn trả!');
        }
        $transService->returnOrder($orderId, OrderConstants::STATUS_RETURN_SYSTEM);
        return redirect()->back()->with('notify', 'Thao tác thành công');
    }

    public function refundOrder($orderId)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $order = Order::find($orderId);
        if (!in_array($order->status, [OrderConstants::STATUS_RETURN_SYSTEM])) {
            return redirect()->back()->with('notify', 'Status đơn hàng không đúng');
        }

        $transService = new TransactionService();
        $transService->refundOrder($orderId);
        return redirect()->back()->with('notify', 'Thao tác thành công');
    }

    public function rejectOrder($orderId)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $order = Order::find($orderId);
        if ($order->status != OrderConstants::STATUS_PAY_PENDING) {
            return redirect()->back()->with('notify', 'Status đơn hàng không đúng');
        }
        $transService = new TransactionService();
        $transService->rejectRegistration($orderId, OrderConstants::STATUS_CANCEL_SYSTEM);
        return redirect()->back()->with('notify', 'Thao tác thành công');
    }

    public function add2cart(Request $request)
    {
        if ($request->get('_user')) {
            $user = $request->get('_user');
            $this->data['api_token'] = $user->api_token;
        } else {
            $user = Auth::user();
            $this->data['api_token'] = null;
        }
        if (!$user) {
            return redirect()->back()->with('notify', __('Bạn cần đăng nhập để làm thao tác này.'));
        }
        if ($request->has('action')) {
            $this->data['checkActiviy'] = $request->input('action');
        } else {
            $this->data['checkActiviy'] = null;
        }
        $userService = new UserServices();
        $itemService = new ItemServices();
        $this->data['user'] = $user;

        if ($request->input('action') == "createChild") {
            $input = $request->all();
            $userChild = new User();
            $userChild->createChild($user, $input);
            $returnObj = ['class' => $request->get('class')];
            if ($this->data['api_token']) {
                $returnObj['api_token'] = $this->data['api_token'];
            }
            return redirect()->route('add2cart', $returnObj)->with('notify', 'Tạo người học mới thành công');
        }
        $this->detectUserAgent($request);

        if ($request->get('action') == 'saveCart') {
            $transService = new TransactionService();
            $result = $transService->placeOrderOneItem($request, $user, $request->get('class'), true);
            $input = $request->all();
            if ($request->get("activiy_trial") == "on") {
                $input['date'] = $input['trial_date'];
                $input['note'] = $input['trial_note'];
                $itemService->activity($user, "trial", $input, $input['class']);
                $userService->mailActivity($user, "activiy_trial", $request->get('class'), $input['trial_date']);
            }
            if ($request->get("activiy_visit") == "on") {

                $input['date'] = $input['visit_date'];
                $input['note'] = $input['visit_note'];
                $itemService->activity($user, "visit", $input, $input['class']);
                $userService->mailActivity($user, "activiy_visit", $request->get('class'), $input['visit_date']);
            }
            if ($request->get("activiy_test") == "on") {

                $input['date'] = $input['test_date'];
                $input['note'] = $input['test_note'];
                $itemService->activity($user, "test", $input, $input['class']);
                $userService->mailActivity($user, "activiy_test", $request->get('class'), $input['test_date']);
            }
            if ($result === ConfigConstants::TRANSACTION_STATUS_PENDING) {
                if ($this->data['api_token']) {
                    return redirect()->route('cart', ['api_token' => $this->data['api_token']])->with('notify', "Đã thêm khóa học vào giỏ hàng. Vui lòng tiếp tục để hoàn thành bước thanh toán.");
                }
                return redirect()->route('cart')->with('notify', "Đã thêm khóa học vào giỏ hàng. Vui lòng tiếp tục để hoàn thành bước thanh toán.");
            } else if (is_numeric($result)) {
                return redirect()->route('checkout.finish', ['order_id' => $result]);
            } else {
                if ($this->data['api_token']) {
                    return redirect()->route('cart', ['api_token' => $this->data['api_token']])->with('notify', $result);
                } else {
                    return redirect()->back()->with('notify', $result);
                }
            }
        }
        if ($request->get('action') == 'saveActivity') {
            $input = $request->all();
            if ($request->get("activiy_trial") == "on") {
                $input['date'] = $input['trial_date'];
                $input['note'] = $input['trial_note'];
                $itemService->activity($user, "trial", $input, $input['class']);
                $userService->mailActivity($user, "activiy_trial", $request->get('class'), $input['trial_date']);
            }
            if ($request->get("activiy_visit") == "on") {
                $input['date'] = $input['visit_date'];
                $input['note'] = $input['visit_note'];
                $itemService->activity($user, "visit", $input, $input['class']);
                $userService->mailActivity($user, "activiy_visit", $request->get('class'), $input['trial_date']);
            }
            if ($request->get("activiy_test") == "on") {
                $input['date'] = $input['test_date'];
                $input['note'] = $input['test_note'];
                $itemService->activity($user, "test", $input, $input['class']);
                $userService->mailActivity($user, "activiy_test", $request->get('class'), $input['trial_date']);
            }
            $item = Item::find($request->get('class'));
            $returnObj = [
                'itemId' => $request->get('class'),
                'url' => $item->title
            ];
            if ($this->data['api_token']) {
                $returnObj['api_token'] = $this->data['api_token'];
            }
            return redirect()->route('page.pdp', $returnObj)->with('notify', 'Các Hoạt Động Học Thử/Thăm Quan/Thi Đầu Vào Đã đăng ký thành công!');
        }
        if ($request->get('action') == 'activiy_trial' | $request->get('action') == 'activiy_visit' | $request->get('action') == 'activiy_test') {
            $this->data['activiy'] = $request->get('action');
        }
        $class = $itemService->pdpData($request, $request->get('class'), $user);
        if (!$class) {
            return redirect()->back()->with('notify', _('Khóa học không tồn tại'));
        }
        $children = [];
        if ($user) {
            $children = User::where('user_id', $user->id)->where('is_child', 1)->get();
        }
        $schedule = DB::table('schedules')->where('item_id', $request->get('class'))->get();
        $extras = DB::table('item_extras')->where('item_id', $request->get('class'))->get();
        $this->data['extras'] = $extras;
        $this->data['schedule'] = $schedule;
        $this->data['user'] = $user;
        $this->data['children'] = $children;
        $this->data['classId'] = $request->get('class');
        return view(env('TEMPLATE', '') . 'checkout.add2cart', $class, $this->data);
    }

    public function commission(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();

        $transaction = DB::table('transactions')
            ->orderby('transactions.id', 'desc')
            ->leftjoin('users', 'transactions.user_id', '=', 'users.id')
            ->leftjoin('order_details', 'transactions.order_id', '=', 'order_details.id')
            ->select(['transactions.*', 'users.name', 'users.phone', 'users.email', 'order_details.item_id']);
        // dd($transaction->get());
        if ($request->input('action') == 'clear') {
            return redirect()->route('transaction.commission');
        }
        if ($request->input('id_f') > 0) {
            if ($request->input('id_t') > 0) {
                $transaction = $transaction->where('transactions.id', '>=', $request->input('id_f'))->where('transactions.id', '<=', $request->input('id_t'));
            } else {
                $transaction = $transaction->where('transactions.id', $request->input('id_f'));
            }
        }
        if ($request->input('type')) {
            $transaction = $transaction->where('transactions.type', $request->input('type'));
        }
        if ($request->input('name')) {
            $transaction->where('users.name', 'like', '%' . $request->input('name') . '%');
        }
        if ($request->input('phone')) {
            $transaction->where('users.phone', 'like', '%' . $request->input('phone') . '%');
        }
        if ($request->input('date')) {
            $transaction = $transaction->whereDate('transactions.created_at', '>=', $request->input('date'));
        }
        if ($request->input('datet')) {
            $transaction = $transaction->whereDate('transactions.created_at', '<=', $request->input('datet'));
        }
        if ($request->input('action') == 'file') {
            $transaction = $transaction->get();
            if ($transaction == "[]") {
                return redirect()->route('transaction.commission');
            }
            $transaction = json_decode(json_encode($transaction->toArray()), true);

            $headers = [
                // "Content-Encoding" => "UTF-8",
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=anylearn_tnx_" . now() . ".csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];
            $callback = function () use ($transaction) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
                fputcsv($file, array_keys($transaction[0]));
                foreach ($transaction as $row) {
                    mb_convert_encoding($row, 'UTF-16LE', 'UTF-8');
                    fputcsv($file, $row);
                }
                fclose($file);
            };
            return response()->stream($callback, 200, $headers);
        }
        if (!$userService->haveAccess($user->role, 'transaction.commission')) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $this->data['transaction'] = $transaction->paginate();
        $this->data['navText'] = __('Lịch sử nhận hoa hồng');
        return view('transaction.commission', $this->data);
    }

    public function status(Request $request, $id, $status)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $transaction = Transaction::find($id);
        if (!$transaction) {
            return redirect()->back()->with('notify', 'Giao dịch không tồn tại');
        }
        if ($transaction->status != ConfigConstants::TRANSACTION_STATUS_PENDING) {
            return redirect()->back()->with('notify', 'Thao tác không hợp lệ');
        }
        $transService = new TransactionService();
        $notifServ = new Notification();

        if ($status == ConfigConstants::TRANSACTION_STATUS_DONE) {
            Transaction::find($id)->update([
                'status' => $status
            ]);

            if ($transaction->type == ConfigConstants::TRANSACTION_DEPOSIT) {
                User::find($transaction->user_id)->update([
                    'wallet_m' => DB::raw('wallet_m + ' . $transaction->amount),
                ]);
                $transService->approveRegistrationAfterDeposit($transaction->user_id);
                $notifServ->createNotif(NotifConstants::TRANS_DEPOSIT_APPROVED, $transaction->user_id, []);
            } else {
                $userup = User::find($transaction->user_id);
                $userup->update([
                    'wallet_c' => $userup->wallet_c + $transaction->amount
                ]);
                $notifServ->createNotif(NotifConstants::TRANS_COMMISSION_RECEIVED, $transaction->user_id, []);
            }
        } elseif ($status == ConfigConstants::TRANSACTION_STATUS_REJECT) {
            Transaction::find($id)->update([
                'status' => $status
            ]);
        }
        return redirect()->back()->with('notify', 'Cập nhật thành công');
    }

    public function remove2cart(Request $request, $orderDetailsId)
    {
        $user = $request->get('_user') ?? Auth::user();

        $orderDetail = OrderDetail::find($orderDetailsId);
        if (!$orderDetail) {
            return redirect()->back()->with('notify', 'Dữ liệu không đúng');
        }
        $order = Order::find($orderDetail->order_id);
        if ($user->id != $order->user_id) {
            return redirect()->back()->with('notify', 'Dữ liệu không đúng');
        }
        $transService = new TransactionService();
        $result = $transService->remove2Cart($orderDetail, $order, $user);
        if ($result) {
            return redirect()->back()->with('notify', 'Cập nhật thành công');
        }
        return redirect()->back()->with('notify', 'Có lỗi xảy ra, vui lòng thử lại.');
    }

    public function cart(Request $request)
    {
        if ($request->get('_user')) {
            $user = $request->get('_user');
            $this->data['api_token'] = $user->api_token;
        } else {
            $user = Auth::user();
            $this->data['api_token'] = null;
        }
        $this->data['user'] = $user;

        $this->detectUserAgent($request);

        if (!$user) {
            return redirect()->back()->with('notify', __('Bạn cần đăng nhập để làm thao tác này.'));
        }
        $openOrder = Order::where('status', OrderConstants::STATUS_NEW)
            ->where('user_id', $user->id)
            ->orderBy('id', 'desc')
            ->first();
        if ($openOrder) {
            $transService = new TransactionService();
            $orderDetails = $transService->orderDetailsToDisplay($openOrder->id);

            $this->data['order'] = $openOrder;
            $this->data['detail'] = $orderDetails;
            $pointUsed = Transaction::where('type', ConfigConstants::TRANSACTION_EXCHANGE)
                ->where('order_id', $openOrder->id)->first();
            if ($pointUsed) {
                $this->data['pointUsed'] = $pointUsed;
            } else {
                $voucherUsed = DB::table('vouchers_used')
                    ->join('vouchers', 'vouchers.id', '=', 'vouchers_used.voucher_id')
                    ->select('vouchers_used.id', 'vouchers.voucher')
                    ->where('order_id', $openOrder->id)->first();
                if ($voucherUsed) {
                    $this->data['voucherUsed'] = $voucherUsed;
                }
            }
        } else {
            $this->data['order'] = null;
            $this->data['detail'] = null;
        }

        $this->data['term'] = "Chính sách thanh toán.";
        $paymentConfigs = config('payment');
        $envPayments = explode(",", env('PAYMENT_METHOD'));
        $this->data['payments'] = [];
        foreach ($envPayments as $k) {
            if (!empty($paymentConfigs[$k])) {
                $this->data['payments'][$k] = $paymentConfigs[$k];
            }
        }
        $configM = new Configuration();
        $doc = $configM->getDoc(ConfigConstants::GUIDE_PAYMENT_TERM);
        $this->data['bonusRate'] = $configM->get(ConfigConstants::CONFIG_BONUS_RATE);
        if ($doc) {
            $this->data['term'] = $doc->value;
        }
        $saveBanks = UserBank::where('user_id', $user->id)->where('status', 1)->get();
        $this->data['saveBanks'] = [];
        foreach ($saveBanks as $bank) {
            $config = config('bankinfo.' . $bank->card_type);
            if (empty($config)) {
                $config = [
                    'name' => 'ATM',
                    'logo' => 'https://mtf.onepay.vn/paygate/assets/img/atm_logo.png',
                ];
            }
            $this->data['saveBanks'][] = [
                'id' => $bank->id,
                'tokenNum' => $bank->token_num,
                'tokenExp' => $bank->token_exp,
                'type' => $bank->card_type,
                'name' => $config['name'],
                'logo' => $config['logo'],
            ];
        }

        $this->data['pending'] = DB::table('orders')
            ->where('orders.status', OrderConstants::STATUS_PAY_PENDING)
            ->where('orders.user_id', $user->id)
            ->select(
                'orders.*',
                DB::raw("(SELECT GROUP_CONCAT(items.title SEPARATOR ',' ) as classes FROM order_details AS os JOIN items ON items.id = os.item_id WHERE os.order_id = orders.id) as classes")
            )
            ->take(5)->get();

        $this->data['momoStatus'] = env('PAYMENT_MOMO_PARTNER', '') != '' ? 1 :  0;

        return view(env('TEMPLATE', '') . 'checkout.cart', $this->data);
    }

    public function exchangePoint(Request $request)
    {
        if ($request->get('_user')) {
            $user = $request->get('_user');
            $this->data['api_token'] = $user->api_token;
        } else {
            $user = Auth::user();
            $this->data['api_token'] = null;
        }
        $orderId = $request->get('order_id');
        $order = Order::find($orderId);
        if (empty($order)) {
            return redirect()->back()->with('notify', 'Đơn hàng không hợp lệ.');
        }

        if ($request->get('cart_action') == 'exchangePoint') {
            $point = $request->get('payment_point');

            $configM = new Configuration();
            $bonusRate = $configM->get(ConfigConstants::CONFIG_BONUS_RATE);
            $pointRequired = $order->amount / $bonusRate;
            $pointRequired = $pointRequired > 1 ? $pointRequired : 1;
            if (!$point || $point < 0 || $pointRequired < $point) {
                return redirect()->back()->with('notify', 'Số anyPoint không phù hợp.');
            }
            try {
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => ConfigConstants::TRANSACTION_EXCHANGE,
                    'amount' => (-1 * $point),
                    'ref_amount' => (-1 * $point),
                    'pay_method' => UserConstants::WALLET_C,
                    'pay_info' => '',
                    'content' => 'Đổi ' . $point . ' cho đơn #' . $order->id,
                    'status' => ConfigConstants::TRANSACTION_STATUS_DONE,
                    'order_id' => $order->id
                ]);
                User::find($user->id)->update([
                    'wallet_c' => ($user->wallet_c - $point)
                ]);
            } catch (Exception $ex) {
                return redirect()->back()->with('notify', $ex->getMessage());
            }

            $transService = new TransactionService();
            $res = $transService->recalculateOrderAmountWithAnyPoint($orderId, $point, $bonusRate);
            if (!$res) {
                return redirect()->back()->with('notify', 'Có lỗi khi sử dụng anyPoint. Vui vòng thử lại hoặc liên hệ bộ phận hỗ trợ.');
            }

            return redirect()->back()->with('notify', 'Sử dụng anyPoint thành công.');
        } else if ($request->get('cart_action') == 'remove_point') {
            $tnx = Transaction::find($request->get('point_used_id'));
            User::find($user->id)->update([
                'wallet_c' => ($user->wallet_c + abs($tnx->amount))
            ]);
            $tnx->delete();
            $transService = new TransactionService();
            $res = $transService->recalculateOrderAmount($orderId);
            return redirect()->back()->with('notify', 'Đã huỷ đổi điểm.');
        }
    }

    public function applyVoucher(Request $request)
    {
        if ($request->get('_user')) {
            $user = $request->get('_user');
            $this->data['api_token'] = $user->api_token;
        } else {
            $user = Auth::user();
            $this->data['api_token'] = null;
        }
        $orderId = $request->get('order_id');
        $order = Order::find($orderId);
        if (empty($order)) {
            return redirect()->back()->with('notify', 'Đơn hàng hoặc mã khuyến mãi không hợp lệ.');
        }
        $voucher = $request->get('payment_voucher');
        if ($request->get('cart_action') == 'apply_voucher') {

            $voucherM = new Voucher();
            try {
                $dbVoucher = $voucherM->getVoucherData($user->id, $voucher);
                $voucherM->useVoucherPayment($user->id, $orderId, $dbVoucher);
            } catch (Exception $ex) {
                return redirect()->back()->with('notify', $ex->getMessage());
            }

            $voucherDB = DB::table('vouchers')
                ->join('voucher_groups AS vg', 'vg.id', '=', 'vouchers.voucher_group_id')
                ->where('vouchers.voucher', $voucher)
                ->first();

            $transService = new TransactionService();
            $res = $transService->recalculateOrderAmountWithVoucher($orderId, $transService->calculateVoucherValue($voucherDB, $order->amount));
            if (!$res) {
                return redirect()->back()->with('notify', 'Mã khuyến mãi không hợp lệ.');
            }

            // handle commission vouchers
            $transService->addTransactionsForCommissionVouchers($dbVoucher->id, $orderId);
            return redirect()->back()->with('notify', 'Áp dụng voucher thành công.');
        } else if ($request->get('cart_action') == 'remove_voucher') {
            $transService = new TransactionService();
            $transService->removeTransactionsForCommissionVouchers(
                $request->get('voucher_userd_id'),
            );
            VoucherUsed::find($request->get('voucher_userd_id'))->delete();
            $res = $transService->recalculateOrderAmount($orderId);
            return redirect()->back()->with('notify', 'Đã huỷ voucher.');
        }
    }

    public function payment(Request $request)
    {
        if ($request->get('_user')) {
            $user = $request->get('_user');
            $this->data['api_token'] = $user->api_token;
        } else {
            $user = Auth::user();
            $this->data['api_token'] = null;
        }
        $payment = $request->get('payment');
        $orderId = $request->input('order_id');
        $saveCard = $request->get('save_card') == 'on' ? true : false;
        $tokenNum = false;
        $tokenExp = false;
        $transService = new TransactionService();

        $res = $transService->verifyVoucherInOrderBeforePayment($orderId);
        if (!$res) {
            return redirect()->back()->with('notify', 'Mã voucher trong đơn hàng không còn hợp lệ .');
        }

        if ($payment == 'free') {
            $transService = new TransactionService();
            $transService->approveRegistrationAfterWebPayment($orderId, OrderConstants::PAYMENT_FREE);
            return redirect()->route('checkout.finish', ['order_id' => $orderId]);
        }

        if ($payment == 'atm') {
            $transService->paymentPending($orderId);
            $qrservice = new QRServices();
            return redirect()->route('checkout.paymenthelp', ['order_id' => $orderId]);
        }
        //if use saved card
        if (!in_array($payment, explode(",", env('PAYMENT_METHOD', 'atm,vnpay,onepayfee,onepaytg,momo')))) {
            $existsBank = UserBank::where('id', $payment)->where('user_id', $user->id)->first();
            if (!$existsBank) {
                return redirect()->back()->with('notify', 'Phương thức thanh toán không tồn tại');
            }
            $payment = 'onepayfee';
            $saveCard = false;
            $tokenNum = $existsBank->token_num;
            $tokenExp = $existsBank->token_exp;
        }
        $processor = Processor::getProcessor($payment);
        if ($processor === null) {
            return redirect()->back()->with('notify', 'Phương thức thanh toán không hợp lệ');
        }
        $openOrder = Order::where('status', OrderConstants::STATUS_NEW)
            ->where('user_id', $user->id)
            ->first();
        if (!$openOrder) {
            return redirect()->back()->with('notify', __('Bạn không có đơn hàng nào, hãy thử tìm một khoá học và đăng ký trước nhé.'));
        }

        $input = [
            'amount' => $openOrder->amount,
            //'orderid' => $openOrder->id,
            'orderid' => $payment == 'momo' ? Processor::generatePaymentToken($openOrder->id) : $openOrder->id,
            'ip' => $request->ip(),
            'save_card' => $saveCard,
            'token_num' => $tokenNum,
            'token_exp' => $tokenExp,
            'user_id' => $user->id,
        ];

        $validate = $processor->validate($input);
        if (true !== $validate) {
            return redirect()->back()->with('notify', 'Phương thức thanh toán không hợp lệ');
        }
        try {
            $response = $processor->processPayment();
        } catch (\Exception $e) {
            $response = new ServiceResponse(false, 'EXCEPTION', $e);
        }

        if ($response->status) {
            Log::info('Payment Redirect', ['url' => $response->data]);
            $openOrder->update([
                'payment' => $payment,
                'status' => OrderConstants::STATUS_PAY_PENDING
            ]);
            return redirect()->to($response->data);
        } else {
            Log::error('Make payment error,', ['data' => $response]);
            return redirect()->back()->with('notify', 'Có lỗi khi thanh toán, vui lòng thử lại');
        }
    }

    public function finish(Request $request)
    {
        $this->detectUserAgent($request);

        $orderId = $request->get('order_id');
        if (!$orderId) {
            return redirect('/')->with('notify', 'Yêu cầu không hợp lệ');
        }
        $order = Order::find($orderId);
        if (!$order) {
            return redirect('/')->with('notify', __('Bạn không có đơn hàng nào, hãy thử tìm một khoá học và đăng ký trước nhé.'));
        }

        if ($request->get('_user')) {
            $user = $request->get('_user');
            $this->data['api_token'] = $user->api_token;
        } else {
            $user = Auth::user();
            $this->data['api_token'] = null;
        }
        $this->data['user'] = $user;
        $transService = new TransactionService();
        $orderDetails = $transService->orderDetailsToDisplay($orderId);

        $this->data['order'] = $order;
        $this->data['detail'] = $orderDetails;
        return view(env('TEMPLATE', '') . 'checkout.finish', $this->data);
    }

    public function paymentResult(Request $request, $payment = 'onepaylocal')
    {
        $result = $request->all();
        Log::info('Payment Result, ', ['data' => $request->fullUrl()]);

        if (!isset($result['orderId'])) {
            return redirect('/')->with('notify', 'Yêu cầu không hợp lệ');
        }
        $orderId = $payment == 'momo'
            ? Processor::getOrderIdFromPaymentToken($result['orderId'])
            : $result['orderId'];

        $order = Order::find($orderId);
        $user = User::find($order->user_id);

        if (!isset($result['status'])) {
            return redirect()->route('cart', ['api_token' => $user->api_token]);
        }

        if ($result['status'] == 1) {
            if ($payment != Vnpay::NAME) { //VNPAY chỉ xác nhận qua notify url.
                $transService = new TransactionService();
                $transService->approveRegistrationAfterWebPayment($orderId, $payment);

                if (!empty($result['newTokenNum'])) {
                    $newToken = $result['newTokenNum'];
                    $newTokenExp = !empty($result['newTokenExp']) ? $result['newTokenExp'] : '';
                    $newCardType = !empty($result['newCardType']) ? $result['newCardType'] : '';
                    $newCardUid = !empty($result['newCardUid']) ? $result['newCardUid'] : '';
                    $exists = UserBank::where('card_uid', $newCardUid)->where('user_id', $user->id)->count();
                    if ($exists == 0) {
                        UserBank::create([
                            'user_id' => $user->id,
                            'token_num' => $newToken,
                            'token_exp' => $newTokenExp,
                            'card_type' => $newCardType,
                            'card_uid' => $newCardUid,
                        ]);
                    } else {
                        UserBank::where('card_uid', $newCardUid)->where('user_id', $user->id)->update([
                            'token_num' => $newToken,
                            'token_exp' => $newTokenExp,
                        ]);
                    }
                }
            }

            return redirect()->route('checkout.finish', ['order_id' => $orderId]);
        } else {
            $order->update([
                'status' => OrderConstants::STATUS_NEW
            ]);
        }

        $this->detectUserAgent($request);
        if ($this->data['isApp']) {
            return redirect()->route('cart', ['api_token' => $user->api_token])->with('notify', isset($result['message']) ? $result['message'] : 'Có lỗi xảy ra. vui lòng thử lại!');
        }
        return redirect()->route('cart')->with('notify', isset($result['message']) ? $result['message'] : 'Có lỗi xảy ra. vui lòng thử lại!');
    }

    public function paymentHelp(Request $request)
    {
        $this->detectUserAgent($request);
        $orderId = $request->get('order_id');
        $order = Order::find($orderId);
        if (!$this->data['isApp']) {
            $user = Auth::user();
            if ($order->user_id != $user->id) {
                return redirect("/");
            }
        }

        $this->data['banks'] = config('bank');
        $this->data['orderAmount'] = $order->amount;
        $this->data['orderId'] = $order->id;
        $this->data['order'] = $order;
        return view(env('TEMPLATE', '') . 'checkout.paymenthelp', $this->data);
    }

    public function notify(Request $request, $payment)
    {
        $processor = Processor::getProcessor($payment);
        if ($processor == null) {
            return;
        }
        try {
            if ($payment == Vnpay::NAME) {
                $whiteLists = explode(",", env(
                    'VNPAY_IP_WHITELIST',
                    '113.160.92.202,113.52.45.78,116.97.245.130,42.118.107.252,113.20.97.250,203.171.19.146,103.220.87.4,103.220.86.4'
                ));
                if (!empty($whiteLists) && !in_array($request->ip(), $whiteLists)) {
                    Log::debug("IP " . $request->ip() . " NOT IN WHITELIST");
                    return response("IP " . $request->ip() . " NOT IN WHITELIST", 403);
                }
            }
            Log::debug("[NOTIFY $payment IP]: " . $request->ip());
            if ($payment == 'momo') {
                Log::debug("[NOTIFY MOMO DATA]:", ['data' => $request->all()]);
                $query = $request->all();
            } else {
                Log::debug("[NOTIFY $payment DATA]:", ['data' => $request->fullUrl()]);
                $query = $request->getQueryString();
            }
            $result = $processor->processFeedbackData($query, "notify");
            $orderId = $payment == 'momo'
                ? Processor::getOrderIdFromPaymentToken($result['orderId'])
                : $result['orderId'];

            if ($result['status'] == 1) {
                $transService = new TransactionService();
                $rs = $transService->approveRegistrationAfterWebPayment($orderId, $payment);
                Log::info("[NOTIFY PAYMENT RESULT]:", ['order' => $orderId, 'result' => $rs]);
            }

            $data = $processor->prepareNotifyResponse($query, $result);

            if (is_array($data)) {
                return response()->json($data);
            } else {
                Log::info("[NOTIFY PAYMENT NO DATA]:", ['request' => $request]);
                echo $data;
            }
        } catch (\Exception $e) {
            Log::error("[NOTIFY PAYMENT ERROR]:", ['e' => $e->getMessage()]);
            echo $e;
        }
    }

    public function return(Request $request, $payment)
    {
        Log::info("[RETURN RESULT]:", ['data' => $request->fullUrl()]);
        $processor = Processor::getProcessor($payment);
        if ($processor == null) {
            return redirect(env('CALLBACK_SERVER'));
        }

        try {
            $query = $request->getQueryString();
            $url = $processor->processReturnData($query);
            if (!empty($url)) {
                return redirect($url);
            }
        } catch (\Exception $e) {
            echo $e;
        }
        return redirect(env('CALLBACK_SERVER'));
    }

    public function finExpenditures(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $transM = new Transaction();
        if ($request->get('action') == 'saveFinExpend') {
            $expend = $request->get('expend');

            $obj = [
                'user_id' => $user->id,
                'content' => $expend['title'],
                'type' => $expend['type'],
                'amount' => $expend['amount'],
                'ref_user_id' => $expend['ref_user_id'],
                'pay_method' => $expend['pay_method'],
                'pay_info' => $expend['comment'],
                'created_at' => $expend['date'],
                'updated_at' => $expend['date'],
                'status' => 1,
            ];
            // Transaction::create($obj);
            // dd($obj);
            if (empty($request->get('expendid'))) {
                Transaction::create($obj);
            } else {
                Transaction::find($request->get('expendid'))->update($obj);
            }
            return redirect()->back()->with(['notify' => 1]);
        }
        $this->data['mods'] = User::whereIn('role', UserConstants::$modRoles)->get();

        if ($request->input('action') == 'clear') {
            return redirect()->route('fin.expenditures');
        }
        if ($request->input('action') == 'file') {
            $data = $transM->search($request, true);

            if (!$data) {
                return redirect()->route('fin.expenditures');
            }
            $headers = [
                // "Content-Encoding" => "UTF-8",
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=anylearn_expenditures_" . now() . ".csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];

            $callback = function () use ($data) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
                fputcsv($file, array_keys($data[0]));


                foreach ($data as $row) {

                    mb_convert_encoding($row, 'UTF-16LE', 'UTF-8');

                    fputcsv($file, $row);
                }
                fclose($file);
            };


            return response()->stream($callback, 200, $headers);
        } else {
            $data = $transM->search($request);
        }
        $amount = $data->sum('amount');
        $this->data['totalv'] = $data->count();
        $this->data['amount'] = $amount;
        $this->data['transaction'] = $data->paginate(20);
        //  dd($tamp[1]->);
        $this->data['navText'] = __('Quản lý Chi tiền');
        return view('transaction.expenditures', $this->data);
    }

    public function finSaleReport(Request $request)
    {
        $from = $request->get('from') ? date('Y-m-d 00:00:00', strtotime($request->get('from'))) : date('Y-m-d 00:00:00', strtotime("-30 days"));
        $to = $request->get('to') ? date('Y-m-d 23:59:59', strtotime($request->get('to'))) : date('Y-m-d H:i:s');
        $partner = $request->get('partner');
        $transService = new TransactionService();
        $this->data['grossRevenue'] = $transService->grossRevenue($from, $to, $partner);
        $this->data['netRevenue'] = $transService->netRevenue($from, $to, $partner);
        $this->data['grossProfit'] = $transService->grossProfit($from, $to, $partner);
        $this->data['netProfit'] = $transService->netProfit($from, $to, $partner);
        $this->data['transaction'] = Transaction::where('transactions.created_at', '>', $from)
            ->where('transactions.created_at', '<', $to)
            ->where('transactions.status', '', ConfigConstants::TRANSACTION_STATUS_DONE)
            ->where('transactions.content', '!=', 'Thanh toán trực tuyến');
        if ($partner) {
            $this->data['transaction'] = $this->data['transaction']
                ->join('order_details', 'order_details.id', '=', 'transactions.order_id')
                ->join('items', 'items.id', '=', 'order_details.item_id')
                ->where('items.user_id', $partner);
        }
        $this->data['transaction'] = $this->data['transaction']
            ->select('transactions.*')
            ->orderby('transactions.id', 'desc')
            ->paginate();
        $this->data['partners'] = User::whereIn('role', [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])
            ->orderby('first_name')
            ->get();
        $this->data['navText'] = __('Báo cáo doanh thu');
        return view('transaction.salereport', $this->data);
    }
}
