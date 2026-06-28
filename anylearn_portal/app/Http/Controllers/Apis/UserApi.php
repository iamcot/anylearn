<?php

namespace App\Http\Controllers\Apis;

use App\Constants\ConfigConstants;
use App\Constants\ItemConstants;
use App\Constants\NotifConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Http\Controllers\Controller;
use App\Models\Configuration;
use App\Models\Contract;
use App\Models\Item;
use App\Models\ItemUserAction;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Participation;
use App\Models\Schedule;
use App\Models\Transaction;
use App\Models\User;
use App\Models\UserDocument;
use App\Services\FileServices;
use App\Services\ItemServices;
use App\Services\OtpServices;
use App\Services\SmsServices;
use App\Services\TransactionService;
use App\Services\UserServices;
use App\Services\ZaloServices;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cookie;

class UserApi extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->only('phone', 'password');
        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            if (!$user->status) {
                return response('Tài khoản của bạn đã bị khóa.', 403);
            }
            //TODO to allow login on multi devices or not.
            if (empty($user->api_token)) {
                $saveToken = User::find($user->id)->update(
                    ['api_token' => hash('sha256', Str::random(60))]
                );
                if (!$saveToken) {
                    return response('Không thể hoàn tất xác thực', 500);
                }
            }
            if ($request->get('notif_token')) {
                if (empty($user->notif_token)) {
                    $notifM = new Notification();
                    $notifM->resendUnsentMessage($user->id, $request->get('notif_token'));
                }
                User::find($user->id)->update([
                    'notif_token' => $request->get('notif_token')
                ]);
            }
            $userDB = User::find($user->id)->makeVisible(['api_token']);
            return response()->json($userDB, 200);
        }
        return response('Thông tin xác thực không hợp lệ', 401);
    }

    public function loginFacebook(Request $request)
    {
        $input = $request->all();
        Log::debug($input);
        $existsUser = User::where('3rd_id', $input['id'])->first();
        if (!$existsUser) {
            $data = [
                'name' => $input['name'],
                'email' => $input['email'],
                'phone' => $input['id'],
                'role' => UserConstants::ROLE_MEMBER,
                'password' => $input['email'],
            ];
            $userModel = new User();
            $existsUser = $userModel->createNewMember($data);
        }
        if ($existsUser) {
            User::find($existsUser->id)->update([
                '3rd_id' => $input['id'],
                '3rd_type' => User::LOGIN_3RD_FACEBOOK,
                '3rd_token' => null,
                'image' => $input['picture'],
            ]);
        }
        if (!$existsUser->status) {
            return response('Tài khoản của bạn đã bị khóa.', 403);
        }
        if (empty($existsUser->api_token)) {
            $saveToken = User::find($existsUser->id)->update(
                ['api_token' => hash('sha256', Str::random(60))]
            );
            if (!$saveToken) {
                return response('Không thể hoàn tất xác thực', 500);
            }
        }
        if ($request->get('notify_token')) {
            if (empty($existsUser->notif_token)) {
                $notifM = new Notification();
                $notifM->resendUnsentMessage($existsUser->id, $request->get('notify_token'));
            }
            User::find($existsUser->id)->update([
                'notif_token' => $request->get('notify_token')
            ]);
        }
        $userDB = User::find($existsUser->id)->makeVisible(['api_token']);
        return response()->json($userDB, 200);
    }

    public function loginApple(Request $request)
    {
        $input = $request->all();
        Log::debug($input);
        $existsUser = User::where('3rd_id', $input['id'])->first();
        if (!$existsUser) {
            $data = [
                'name' => $input['name'],
                'email' => $input['email'],
                'phone' => $input['id'],
                'role' => UserConstants::ROLE_MEMBER,
                'password' => $input['email'],
            ];
            $userModel = new User();
            $existsUser = $userModel->createNewMember($data);
        }
        if ($existsUser) {
            User::find($existsUser->id)->update([
                '3rd_id' => $input['id'],
                '3rd_type' => User::LOGIN_3RD_APPLE,
                '3rd_token' => null,
                'image' => $input['picture'],
            ]);
        }
        if (!$existsUser->status) {
            return response('Tài khoản của bạn đã bị khóa.', 403);
        }
        if (empty($existsUser->api_token)) {
            $saveToken = User::find($existsUser->id)->update(
                ['api_token' => hash('sha256', Str::random(60))]
            );
            if (!$saveToken) {
                return response('Không thể hoàn tất xác thực', 500);
            }
        }
        if ($request->get('notify_token')) {
            if (empty($existsUser->notif_token)) {
                $notifM = new Notification();
                $notifM->resendUnsentMessage($existsUser->id, $request->get('notify_token'));
            }
            User::find($existsUser->id)->update([
                'notif_token' => $request->get('notify_token')
            ]);
        }
        $userDB = User::find($existsUser->id)->makeVisible(['api_token']);
        return response()->json($userDB, 200);
    }

    public function logout(Request $request)
    {
        $user  = $this->isAuthedApi($request);
        // Auth::logout();
        if (!($user instanceof User)) {
            return $user;
        }
        User::find($user->id)->update([
            'notif_token' => '',
        ]);

        return response('OK', 200);
    }

    public function edit(Request $request)
    {
        $user  = $request->get('_user');

        $inputs = $request->all();
        $userModel = new User();
        $validateExists = $userModel->validateUpdate($user->id, $inputs);
        if ($validateExists != "") {
            return response($validateExists, 400);
        }

        $rs = User::find($user->id)->update($inputs);
        if ($rs) {
            return response('{"result": true}', 200);
        }
        return response("Cập nhật thông tin thất bại, vui lòng thử lại", 500);
    }

    public function userInfoLess(Request $request)
    {
        $user  = $request->get('_user');
        $user->makeVisible(['api_token']);
        $user->reflink = "https://anylearn.vn/ref/" . $user->refcode;

        $configM = new Configuration();
        $user->ios_transaction = $configM->enableIOSTrans($request);
        $user->disable_anypoint = (int)$configM->get(ConfigConstants::CONFIG_DISABLE_ANYPOINT);
        $user->children = User::where('user_id', $user->id)
            ->where('is_child', 1)
            ->get();

        $userServ = new UserServices();
        $user->cartcount = $userServ->countItemInCart($user->id);
        $transServ = new TransactionService();
        $user->hasPendingOrder = $transServ->hasPendingOrders($user->id);

        return response()->json($user, 200);
    }

    public function userInfo(Request $request)
    {
        $user  = $request->get('_user');
        $user->makeVisible(['api_token', 'full_content']);
        $user->reflink = "https://anylearn.vn/ref/" . $user->refcode;
        $user->children = User::where('user_id', $user->id)
            ->where('is_child', 1)
            ->get();
        return response()->json($user, 200);
    }

    public function register(Request $request)
    {
        $inputs = $request->all();
        $userM = new User();
        if (!isset($inputs['password_confirmation'])) {
            $inputs['password_confirmation'] = $inputs['password'];
        }
        $validator = $userM->validateMember($inputs);
        if ($validator->fails()) {
            return response($validator->errors()->first(), 400);
        }
        try {
            // $inputs['api_token'] = hash('sha256', Str::random(60));
            $newUser = $userM->createNewMember($inputs);
            return response()->json($newUser, 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response($e->__toString(), 500);
        }
    }

    public function simpleRegister(Request $request)
    {
        $inputs = $request->all();
        if (empty($inputs['ref']) || empty($inputs['phone']) || empty($inputs['name'])) {
            return response("ref, phone, name is required params", 400);
        }
        $inputs['password'] = $inputs['phone'];
        $inputs['role'] = UserConstants::ROLE_MEMBER;

        $userM = new User();
        if (!isset($inputs['password_confirmation'])) {
            $inputs['password_confirmation'] = $inputs['password'];
        }
        $validator = $userM->validateMember($inputs);
        if ($validator->fails()) {
            return response($validator->errors()->first(), 400);
        }
        try {
            $newUser = $userM->createNewMember($inputs);
            return response('success', 200);
        } catch (\Exception $e) {
            Log::error($e);
            return response($e->__toString(), 500);
        }
    }

    public function uploadImage(Request $request, $type)
    {
        $user = $request->get('_user');

        $fileService = new FileServices();
        $fileuploaded = $fileService->doUploadImage($request, 'image');
        if ($fileuploaded === false) {
            return response('Upload file không thành công.', 500);
        }
        $oldImageUrl = $user->$type;
        $fileService->deleteUserOldImageOnS3($oldImageUrl);

        User::find($user->id)->update([
            $type => $fileuploaded['url']
        ]);
        return response($fileuploaded['url'], 200);
    }

    public function friends(Request $request, $userId)
    {
        $user = $request->get('_user');
        if (!$userId) {
            return response('Yêu cầu không đúng', 400);
        }
        $friendsOfUser = User::find($userId);
        if (!$friendsOfUser) {
            return response('Yêu cầu không đúng', 400);
        }
        $friends = User::where('user_id', $userId)
            ->where('is_child', 0)
            ->where('status', 1)
            ->orderby('first_name')
            ->select(
                'id',
                'name',
                'role',
                'image',
                'banner',
                'introduce',
                'title',
                'num_friends'
            )
            ->get();
        return response()->json([
            'user' => $friendsOfUser,
            'friends' => $friends,
        ], 200);
    }

    public function usersList(Request $request, $role)
    {
        if (!in_array($role, [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])) {
            return response('Yêu cầu không đúng', 400);
        }
        $pageSize = $request->get('pageSize', 9999);
        $configM = new Configuration();
        $isEnableIosTrans = $configM->enableIOSTrans($request);
        $list = DB::table('users')->where('role', $role)
            ->whereNotIn("id",  $isEnableIosTrans == 0 ? explode(',', env('APP_REVIEW_DIGITAL_SELLERS', '')) : [])
            ->where('update_doc', UserConstants::STATUS_ACTIVE)
            ->where('status', UserConstants::STATUS_ACTIVE)
            ->where('is_test', 0)
            ->where('is_signed', UserConstants::CONTRACT_APPROVED)
            ->orderby('is_hot', 'desc')
            ->orderby('boost_score', 'desc')
            ->orderby('first_name')
            ->select(
                'id',
                'name',
                'role',
                'image',
                'banner',
                'introduce',
                'title',
                'num_friends',
                DB::raw("(select avg(iua.value) from item_user_actions AS iua WHERE type = 'rating' AND iua.item_id in (select items.id from items where items.user_id = users.id) ) AS rating")
            )
            ->paginate($pageSize);

        $banner = $configM->get($role == UserConstants::ROLE_TEACHER ? ConfigConstants::CONFIG_TEACHER_BANNER : ConfigConstants::CONFIG_SCHOOL_BANNER);
        return response()->json([
            'banner' => $banner,
            'list' => $list,
        ], 200);
    }

    public function myCalendar(Request $request)
    {
        $user = $request->get('_user');

        $orderDetailM = new OrderDetail();
        return response()->json($orderDetailM->userRegistered($user->id));
    }

    public function confirmJoinCourse(Request $request, $scheduleId)
    {
        $user = $request->get('_user');
        $childId = $request->get('child');
        $joinedUserId = !empty($childId) ? $childId : $user->id;

        $itemServ = new ItemServices();
        try {
            $itemServ->comfirmJoinCourse($request, $joinedUserId, $scheduleId);
        } catch (\Exception $ex) {
            return response($ex->getMessage(), 400);
        }

        return response()->json(['result' => 1]);
    }

    public function courseRegisteredUsers(Request $request, $itemId)
    {
        $user = $request->get('_user');

        $item = Item::find($itemId);
        if (!$item) {
            return response("Khóa  học không tồn tại", 404);
        }

        $list = DB::table('order_details as od')
            ->join('orders', 'orders.id', '=', 'od.order_id')
            ->join('users', 'users.id', '=', 'od.user_id')
            ->join('users AS childs', 'childs.id', '=', 'orders.user_id')
            ->where('orders.status', OrderConstants::STATUS_DELIVERED)
            ->where('od.item_id', $itemId)
            ->select('users.id', 'users.name', 'users.phone', 'users.image', 'childs.name AS child')
            ->get();
        return response()->json($list);
    }

    public function profile($userId)
    {
        $user = User::where('id', $userId)
            ->select('id', 'title', 'name', 'image', 'role', 'introduce', 'banner', 'full_content')
            ->first()->makeVisible(['full_content']);
        if (!$user) {
            return response("User không tồn tại", 404);
        }
        $user->docs = UserDocument::where('user_id', $user->id)->get();
        $user->registered = DB::table('order_details AS od')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->where('od.user_id', $userId)
            ->select('items.title', 'items.image', 'items.short_content', 'items.id')
            ->take(10)
            ->get();
        $user->faved = DB::table('item_user_actions AS iua')
            ->join('items', 'items.id', '=', 'iua.item_id')
            ->where('iua.type', ItemUserAction::TYPE_FAV)
            ->where('iua.user_id', $userId)
            ->where('iua.value', 1)
            ->select('items.title', 'items.image', 'items.short_content', 'items.id')
            ->take(10)
            ->get();
        $user->rated = DB::table('item_user_actions AS iua')
            ->join('items', 'items.id', '=', 'iua.item_id')
            ->where('iua.type', ItemUserAction::TYPE_RATING)
            ->where('iua.user_id', $userId)
            ->select('items.title', 'items.image', 'items.short_content', 'iua.value', 'items.id')
            ->take(10)
            ->get();


        return response()->json($user);
    }

    public function getDocs(Request $request)
    {
        $user = $request->get('_user');
        $docs = UserDocument::where('user_id', $user->id)->get();
        return response()->json($docs);
    }

    public function addDoc(Request $request)
    {
        $user = $request->get('_user');
        $fileService = new FileServices();
        $fileuploaded = $fileService->doUploadImage($request, 'image');
        if ($fileuploaded === false) {
            return response('Upload file không thành công.', 500);
        }
        $userDocM = new UserDocument();
        $userDocM->addDocWeb($fileuploaded, $user);

        $docs = UserDocument::where('user_id', $user->id)->get();
        return response()->json($docs);
    }

    public function removeDoc(Request $request, $fileId)
    {
        $user = $request->get('_user');

        $file = UserDocument::find($fileId);
        if (!$file) {
            return response("Tài liệu không có", 404);
        }
        if ($file->user_id != $user->id) {
            return response("Bạn không có quyền", 400);
        }
        $fileService = new FileServices();
        $oldImageUrl = $file->data;
        $fileService->deleteUserOldImageOnS3($oldImageUrl);

        $rs = UserDocument::find($fileId)->delete();
        $docs = UserDocument::where('user_id', $user->id)->get();
        if (count($docs) == 0) {
            User::find($user->id)->update(['update_doc' => 0]);
        }
        return response()->json($docs);
    }

    public function notification(Request $request)
    {
        $user = $request->get('_user');
        $notif = Notification::where('user_id', $user->id)
            ->where('type', '!=', SmsServices::SMS)
            ->orderby('id', 'desc')
            ->paginate(Notification::PAGESIZE);
        return response()->json($notif);
    }

    public function notifRead(Request $request, $id)
    {
        $user = $request->get('_user');
        $notif = Notification::find($id)->update([
            'read' => DB::raw('now()')
        ]);
        return response('OK', 200);
    }

    public function allFriends(Request $request)
    {
        $user = $request->get('_user');
        $userServ = new UserServices();
        $data = $userServ->allFriends($user->id);
        return response()->json($data);
    }

    public function getContract(Request $request, $contractId = 0)
    {
        $user = $request->get('_user');
        if ($contractId == -1) {
            $lastContract = Contract::where('user_id', $user->id)
                ->where('status', 99)
                ->orderby('id', 'desc')->first();
        } else if ($contractId == 0) {
            $lastContract = Contract::where('user_id', $user->id)
                ->where('status', '!=', 0)
                ->orderby('id', 'desc')->first();
        } else {
            $lastContract = Contract::find($contractId);
        }

        $configM = new Configuration();
        if ($lastContract->type == UserConstants::ROLE_TEACHER) {
            $key = ConfigConstants::CONTRACT_TEACHER;
            $template = $configM->get($key);
            $lastContract->template = Contract::makeContent($template, $user, $lastContract);
        } else {
            $key = ConfigConstants::CONTRACT_SCHOOL;
            $template = $configM->get($key);
            $lastContract->template = Contract::makeContent($template, $user, $lastContract);
        }

        return response()->json($lastContract);
    }

    public function saveContract(Request $request)
    {
        $user = $request->get('_user');
        $contractJson = $request->get('contract');
        $contract = json_decode($contractJson, true);
        if (empty($contract)) {
            return response("Không có thông tin hợp đồng.", 400);
        }
        $userServ = new UserServices();
        $result = $userServ->saveContract($user, $contract);

        if ($result === true) {
            return response()->json([
                'result' => true,
            ]);
        } else {
            return response($result, 400);
        }
    }
    public function saveContractV3(Request $request)
    {
        $user = $request->get('_user');
        $inputs = $request->all();
        $userServ = new UserServices();
        $result = $userServ->saveContract($user, $inputs);
        if ($result === true) {
            return response()->json([
                'result' => true,
            ]);
        } else {
            return response($result, 400);
        }
    }
    public function signContract(Request $request, $contractId)
    {
        $user = $request->get('_user');
        $userServ = new UserServices();
        $result = $userServ->signContract($user, $contractId);
        if ($result === true) {
            return response()->json(['result' => true]);
        } else {
            return response($result, 400);
        }
    }

    public function listChildren(Request $request)
    {
        $user = $request->get('_user');
        $children = User::where('user_id', $user->id)
            ->where('is_child', 1)
            ->get();
        return response()->json($children);
    }

    public function saveChildren(Request $request)
    {
        $user = $request->get('_user');
        $id = $request->get('id');
        $name = $request->get('name');
        $child = null;
        if ($id == 0) {
            $phoneByTime = $user->phone . time();
            $child = User::create([
                'is_child' => 1,
                'user_id' => $user->id,
                'name' => $name,
                'phone' => $phoneByTime,
                'refcode' => $phoneByTime,
                'password' => Hash::make($user->phone),
                'role' => UserConstants::ROLE_MEMBER,
                'status' => UserConstants::STATUS_ACTIVE,
            ]);
        } else {
            $child = User::find($id);
            if ($child->is_child == 1 && $child->user_id == $user->id) {
                $child->update([
                    'name' => $name,
                ]);
            }
        }
        return response()->json([
            'result' => true
        ]);
    }

    public function saveChildrenV2(Request $request)
    {
        $user = $request->get('_user');
        $id = $request->get('id');
        $name = $request->get('name');
        $dob = $request->get('dob', null);
        $child = null;
        if ($id == 0) {
            $phoneByTime = $user->phone . time();
            $child = User::create([
                'is_child' => 1,
                'user_id' => $user->id,
                'name' => $name,
                'dob' => $dob,
                'phone' => $phoneByTime,
                'refcode' => $phoneByTime,
                'password' => Hash::make($user->phone),
                'role' => UserConstants::ROLE_MEMBER,
                'status' => UserConstants::STATUS_ACTIVE,
            ]);
        } else {
            $child = User::find($id);
            if ($child->is_child == 1 && $child->user_id == $user->id) {
                $child->update([
                    'name' => $name,
                    'dob' => $dob,
                ]);
            }
        }
        return response()->json([
            'result' => $child != null ? $child->id : 0
        ]);
    }

    public function changePass(Request $request)
    {
        $user = $request->get('_user')->makeVisible(['password']);
        $checkPass = Hash::check($request->get('oldpass'), $user->password);
        if ($checkPass) {
            User::find($user->id)->update([
                'password' => Hash::make($request->get('newpass'))
            ]);
            return response()->json(['result' => true]);
        }
        return response('Mật khẩu không đúng', 400);
    }

    public function sentOtpResetPass(Request $request)
    {
        Log::debug("OTP REQUEST COMMING...");
        Log::debug($request);
        $phone = $request->get('phone');
        $service = env('OTP_SERVICE', OtpServices::SERVIVCE_ZALO);
        $otpService = new OtpServices($service);
        try {
            $genOtp = $otpService->genOtp($phone);
        } catch (\Exception $e) {
            Log::error($e);
            return response('Không thể gửi OTP tới số điện thoại bạn vừa cung cấp. Xin hãy thử lại', 400);
        }

        $result = $otpService->sendOTP($phone, $genOtp);

        if (!$result['result']) {
            Notification::find($genOtp['notification_id'])->update([
                'is_send' => 0,
                'extra_content' => json_encode($result['error'])
            ]);
            return response('Không thể gửi OTP tới số điện thoại bạn vừa cung cấp. Xin hãy thử lại', 400);
        } else {
            Notification::find($genOtp['notification_id'])->update([
                'is_send' => 1,
                'send' =>  date('Y-m-d H:i:s'),
                'extra_content' => $result['data']
            ]);
            return response()->json([
                'result' => true,
                'phone' => $phone,
            ]);
        }
    }

    public function otpCheck(Request $request)
    {
        $phone = $request->get('phone');
        $otp = $request->get('otp');
        $service = env('OTP_SERVICE', OtpServices::SERVIVCE_ZALO);
        $otpService = new OtpServices($service);
        try {
            $result = $otpService->verifyOTP($phone, $otp, false);
            if ($result) {
                return response()->json([
                    'result' => true,
                ]);
            }
        } catch (\Exception $ex) {
            Log::error($ex);
        }
        return response("Không thể xác thực OTP", 400);
    }

    public function resetPassOtp(Request $request)
    {
        $phone = $request->get('phone');
        $otp = $request->get('otp');
        $password = $request->get('password');
        $passwordConfirm = $request->get('password_confirmation');
        if ($password != $passwordConfirm) {
            return response('Vui lòng nhập lại mật khẩu', 400);
        }
        $service = env('OTP_SERVICE', OtpServices::SERVIVCE_ZALO);
        $otpService = new OtpServices($service);

        try {
            $result = $otpService->verifyOTP($phone, $otp);
            if ($result) {
                User::where('phone', $phone)->update([
                    'password' => Hash::make($password)
                ]);
                return response()->json([
                    'result' => true,
                ]);
            }
        } catch (\Exception $ex) {
            return response($ex->getMessage(), 400);
        }
        return response('Có lỗi xảy ra và không thể cập nhật mật khẩu, Vui lòng thử lại', 400);
    }

    public function deleteAccount(Request $request)
    {
        $user = $request->get('_user');
        $userServ = new UserServices();
        try {
            $rs = $userServ->deleteAccount($user->phone);
        } catch (Exception $ex) {
            Log::error($ex);
            return response('Không thể xử lí yêu cầu. Vui lòng liên hệ với hotline để hỗ trợ.', 400);
        }
        return response()->json([
            'result' => true,
        ]);
    }

    public function pendingOrders(Request $request)
    {
        $user = $request->get('_user');
        $orders = DB::table('orders')
            ->where('orders.user_id', $user->id)
            ->where('orders.status', OrderConstants::STATUS_PAY_PENDING)
            ->select(
                'orders.*',
                DB::raw("(SELECT GROUP_CONCAT(items.title SEPARATOR ',' ) as classes FROM order_details AS os JOIN items ON items.id = os.item_id WHERE os.order_id = orders.id) as classes")
            )->orderby('orders.id', 'desc')
            ->get();
        return response()->json($orders);
    }

    public function pointBox(Request $request)
    {
        $classes = DB::table('orders')
            ->join('order_details as od', 'od.order_id', 'orders.id')
            ->join('participations as pa', 'pa.schedule_id', 'od.id')
            ->join('items', 'items.id', 'od.item_id')
            ->where('orders.user_id', $request->get('_user')->id);

        $gClass = $classes->orderby('pa.created_at', 'desc')->first();
        $rClass = $classes->join(
            'item_user_actions as iua',
            function ($join) {
                $join->on('iua.user_id', 'orders.user_id');
                $join->on('iua.item_id', 'od.item_id');
            }
        )
            ->where('iua.type', 'rating')
            ->orderby('iua.created_at', 'desc')
            ->first();

        $data['anypoint'] = $request->get('_user')->wallet_c;
        $data['goingClass'] = $gClass ? $gClass->title : '';
        $data['ratingClass'] = $rClass ? $rClass->title : '';

        return response()->json($data);
    }
}
