<?php

namespace App\Http\Controllers\APIs;

use App\Constants\ConfigConstants;
use App\Constants\UserConstants;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Configuration;
use App\Models\Item;
use App\Models\Spm;
use App\Models\User;
use App\Services\ItemServices;
use App\Services\TransactionService;
use App\Services\UserServices;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class OpenApi extends Controller
{
    public function classList(Request $request)
    {
        $params = $request->input();
        $spmM = new Spm();
        $spmM->addSpmApi($request, 'openApiClassList');
        $config = new Configuration();
        $idConfig = $config->get(ConfigConstants::CONFIG_OPENAPI_PRODUCTS);
        if (empty($idConfig)) {
            $items = Item::where('is_hot', 1)
                ->where('status', 1)
                ->where('user_status', 1)
                ->select('id', 'title', 'price', 'org_price', 'image', 'subtype', 'short_content', 'content')
                ->orderby('id', 'desc')
                ->take(20)
                ->get();
            // ->makeVisible(['content']);
        } else {
            $Ids = explode(",", $idConfig);
            $items = Item::whereIn('id', $Ids)
                ->where('status', 1)
                ->where('user_status', 1)
                ->select('id', 'title', 'price', 'org_price', 'image', 'subtype', 'short_content', 'content')
                ->orderby('id', 'desc')
                ->take(20)
                ->get();
            //->makeVisible(['content']);
        }

        return $this->responseWrapper(1, $items);
    }

    public function orderPurchased(Request $request)
    {
        $key = env('OPENAPI_HASH', 'anyLEARN2024');
        $string = $key . $request->get('transId') . $request->get('createdAt');
        $spmM = new Spm();
        $validator = Validator::make($request->all(), [
            'partner'  => ['required', Rule::in(explode(",", env('OPENAPI_PARTNERS')))],
            'classId' => ['required', function ($attribute, $value, $fail) {
                $allowClass = Item::find($value);
                if (!$allowClass) {
                    $fail('Mã lớp học ' . $attribute . ' không tồn tại');
                }
                if ($allowClass->status == 0 || $allowClass->user_status == 0) {
                    $fail('Lớp học ' . $attribute . ' đang không mở đăng ký, vui lòng liên hệ lại với anylEARN.');
                }
            },],
            'transId' => ['required'],
            'customerName'  => ['required'],
            'customerPhone'  => ['required'],
            'createdAt'  => ['required', 'date'],
            'hash'  => ['required', function ($attribute, $value, $fail) use ($string) {
                // echo hash('sha256',$string);
                if ($value != hash('sha256', $string)) {
                    $fail('Hash chưa đúng.');
                }
            },],
        ], [
            'required' => 'Thiếu trường :attribute.',
            'date' => 'Định dạng ngày không đúng.',
            'in' => 'Tên đối tác :attribute chưa hỗ trợ.',
        ]);
        if ($validator->fails()) {
            $spmM->addSpmApi($request, 'openApiOrderPurchased', json_encode([
                'input' => $request->input(),
                'output' => $validator->errors()->first()
            ]));
            return $this->responseWrapper(false, null, $validator->errors()->first());
        }
        $newUser = 0;
        $user = User::where('phone', $request->get('customerPhone'))
            ->first();
        if (!$user) {
            $userM = new User();
            $user = $userM->createNewMember([
                'phone' => $request->get('customerPhone'),
                'name' => $request->get('customerName'),
                'email' => $request->get('customerEmail'),
                'role' => UserConstants::ROLE_MEMBER,
                'password' => $request->get('customerPhone'),
            ]);
            $newUser = 1;
        }
        $tranServ = new TransactionService();
        $result = $tranServ->placeOrderOneItem($request, $user, $request->get('classId'), false, true, $request->get('partners'));
        $spmM->addSpmApi($request, 'openApiOrderPurchased', json_encode([
            'input' => $request->input(),
            'output' => $result
        ]));

        if (is_numeric($result)) {
            return $this->responseWrapper(true, [
                'orderId' => $result,
                'type' => $newUser == 1 ? 'NEW_USER' : 'EXIST_USER',
                'guide' => $newUser == 1 ? "Đơn hàng đã được tạo với Tài khoản MỚI trên anylearn.vn với username và mật khẩu " . $request->get('customerPhone')
                    : "Đơn hàng đã được tạo với tài khoản đã tồn tại trên anyLEARN với username " .  $request->get('customerPhone')
            ],);
        } else if ($result === ConfigConstants::TRANSACTION_STATUS_PENDING) {
            return $this->responseWrapper(false, null, "Không thể xác nhận thanh toán cho đơn hàng, Vui lòng liên hệ với anyLEARN.");
        } else {
            return $this->responseWrapper(false, null, $result);
        }
    }

    protected function responseWrapper($status = true, $data = null, $message = "")
    {
        $data = [
            'resultCode' => (int)$status, //1: success; 0: false
            'message' => $message, //error message if resultCode = 0
            'data' => $data,
        ];
        return response()->json($data);
    }
}
