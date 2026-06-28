<?php

namespace App\Http\Controllers;

use App\Constants\ActivitybonusConstants;
use App\Constants\ConfigConstants;
use App\Constants\ItemConstants;
use App\Constants\NotifConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Models\ItemCode;
use App\Models\Configuration;
use App\Models\Contract;
use App\Models\Notification;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\User;
use App\Models\Item;
use App\Models\UserDocument;
use App\Models\UserLocation;
use App\Services\FileServices;
use App\Services\SmsServices;
use App\Services\UserServices;
use App\Models\Transaction;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\I18nContent;
use App\Models\ItemSchedulePlan;
use App\Models\SaleActivity;
use App\Services\ActivitybonusServices;
use App\Services\InteractServices;
use App\Services\TransactionService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use PSpell\Config;
use Symfony\Component\VarDumper\Cloner\Data;
use Vanthao03596\HCVN\Models\District;
use Vanthao03596\HCVN\Models\Province;
use Vanthao03596\HCVN\Models\Ward;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class UserController extends Controller
{
    public function updateDoc(Request $request)
    {
        if ($request->hasFile('file')) {
            $fileService = new FileServices();
            $rs = $fileService->doUploadFile($request);
            if ($rs !== false) {
                $userDocM = new UserDocument();
                $rs = $userDocM->addDocLocal($rs);
                if ($rs) {
                    return redirect('/')->with('notify', __('Cập nhật giấy tờ thành công.'));
                }
            }
            return redirect()->back()->with('notify', __('Cập nhật giấy tờ không thành công, vui lòng kiểm tra lại'));
        }
        return view('user.update_doc');
    }

    public function inactivePage()
    {
        return view('user.inactive');
    }

    public function mods(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'user.mods')) {
            return redirect('/')->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $this->data['mods'] = User::whereIn('role', UserConstants::$modRoles)
            ->orderby('role')
            ->paginate(UserConstants::PP);
        $this->data['navText'] = __('Quản lý Quản trị viên');
        return view('user.mods', $this->data);
    }

    public function modAccess(Request $request, $userId)
    {
        $user = Auth::user();
        $userService = new UserServices();

        if (!$userService->haveAccess($user->role, 'user.mods')) {
            return redirect('/')->with('notify', __('Bạn không có quyền cho thao tác này'));
        }

        $mod = User::find($userId);
        if ($request->get('save')) {
            $mod->modules = implode(',', $request->get('modules') ? $request->get('modules') : []);

            if ($mod->save()) {
                return redirect()->back()->with('notify', __('Thao tác thành công'));
            }
        }

        $this->data['mod'] = $mod;
        $this->data['modules'] = config('modules');
        $this->data['hasBack'] = route('user.mods');
        $this->data['navText'] = __('Quản lý Truy cập');
        $this->data['allowed'] = isset($mod->modules) ? explode(',', $mod->modules) : $userService->userModules($mod->role);

        return view('user.mod_access', $this->data);
    }

    public function modspartner(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'user.mods')) {
            return redirect('/')->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $this->data['mods'] = User::whereIn('role', UserConstants::$parterRoles)
            ->orderby('role')
            ->paginate(UserConstants::PP);
        $this->data['navText'] = __('Quản lý Quản trị viên');
        return view('user.modspartner', $this->data);
    }

    private function detectDelimiter($csvFile)
    {
        $delimiters = [";" => 0, "," => 0, "\t" => 0, "|" => 0];

        $handle = fopen($csvFile, "r");
        $firstLine = fgets($handle);
        fclose($handle);
        foreach ($delimiters as $delimiter => &$count) {
            $count = count(str_getcsv($firstLine, $delimiter));
        }

        return array_search(max($delimiters), $delimiters);
    }

    public function members(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'user.members')) {
            return redirect('/')->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $userM = new User();
        if ($request->input('action') == 'clear') {
            return redirect()->route('user.members');
        }

        if ($request->input('action') == 'saleassign') {
            ini_set('max_execution_time', '300');
            if ($request->hasFile('saleassign') && $request->file('saleassign')->isValid()) {
                $csvFile = $request->file('saleassign');

                $delimiter = $this->detectDelimiter($csvFile);

                $fileHandle = fopen($csvFile, 'r');
                $rows = [];
                $header = [];
                while (!feof($fileHandle)) {
                    if (empty($header)) {
                        $header = fgetcsv($fileHandle, 0, $delimiter);
                    } else {
                        $csvRaw = fgetcsv($fileHandle, 0, $delimiter);
                        $rowcsv = [];
                        foreach ($header as $k => $col) {
                            $rowcsv[] = isset($csvRaw[$k]) ? $csvRaw[$k] : "";
                        }
                        $rows[] = $rowcsv;
                    }
                }
                fclose($fileHandle);
                //dd($header, $rows);
                $countUpdate = 0;
                $countCreate = 0;
                foreach ($rows as $row) {
                    if (empty($row[4])) {
                        continue;
                    }
                    try {
                        if ($row[1]) {
                            $row[1] = strlen($row[1]) == 4
                                ? Carbon::parse($row[1])->format('Y-01-01')
                                : Carbon::createFromFormat('d/m/Y', $row[1])->format('Y-m-d');
                        }
                        $exists = User::where('phone', $row[4])->first();
                        if ($exists) {
                            if (!$exists->is_registered) {
                                $data = [
                                    'name' => $row[0],
                                    'dob' => $row[1],
                                    'sex' => $row[2],
                                    'address' => $row[3],
                                    'email' => $row[5],
                                    'source' => $row[8],
                                ];
                                if (isset($row[9]) && in_array($row[9], UserConstants::$memberRoles)) {
                                    $data['role'] = $row[9];
                                }
                            }
                            if (!empty($row[6])) {
                                $data['user_id'] = $row[6];
                            }
                            if (!empty($row[7])) {
                                $data['sale_id'] = $row[7];
                            }
                            $countUpdate += User::where('phone', $row[4])->update($data);
                        } else {
                            // Log::debug($row);
                            User::create([
                                'name' => $row[0],
                                'dob' => $row[1],
                                'sex' => $row[2],
                                'address' => $row[3],
                                'phone' => $row[4],
                                'email' => $row[5],
                                'sale_id' => $row[7],
                                'source' => isset($row[8]) ? $row[8] : '',
                                'is_registered' => 0,
                                'role' => isset($row[9]) && in_array($row[9], UserConstants::$memberRoles)
                                    ? $row[9]
                                    : UserConstants::ROLE_MEMBER,
                                'password' => Hash::make($row[4]),
                                'status' => UserConstants::STATUS_INACTIVE,
                                'refcode' => $row[4],
                            ]);
                            $countCreate++;
                        }
                    } catch (\Exception $ex) {
                        //Log::error($ex);
                        //dd($ex->getMessage());
                    }
                }
                return redirect()->back()->with('notify', 'Cập nhật thành công ' . $countUpdate . ', Tạo mới thành công ' . $countCreate . ' trên tổng số ' . (count($rows) - 1) . '. Chú ý nếu tạo user mới thì chỉ gán cho cột sale_id');
            }
        }

        if ($request->input('action') == 'file') {
            $members = $userM->searchMembers($request, true);
            if (!$members) {
                return redirect()->route('user.members');
            }
            $headers = [
                // "Content-Encoding" => "UTF-8",
                "Content-type" => "text/csv",
                "Content-Disposition" => "attachment; filename=anylearn_member_" . now() . ".csv",
                "Pragma" => "no-cache",
                "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
                "Expires" => "0"
            ];

            $callback = function () use ($members) {
                $file = fopen('php://output', 'w');
                fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
                fputcsv($file, array_keys($members[0]));
                foreach ($members as $row) {
                    mb_convert_encoding($row, 'UTF-16LE', 'UTF-8');
                    fputcsv($file, $row);
                }
                fclose($file);
            };
            return response()->stream($callback, 200, $headers);
        } else {
            $members = $userM->searchMembers($request);
        }
        $this->data['isSale'] = false;
        if ($user->role == UserConstants::ROLE_SALE) {
            $this->data['isSale'] = true;
        }

        $this->data['members'] = $members;
        $this->data['navText'] = __('Quản lý Thành viên');
        
        $this->data['priorityUsers'] = $userService->getUsersByPriority();
        $this->data['priorityLevels'] = UserConstants::$salePriorityLevels;
        $this->data['priorityColors'] = UserConstants::$salePriorityColors;

        return view('user.member_list', $this->data);
    }

    public function addMember(Request $request)
    {
        if ($request->input('action') == 'addMember') {
            $member = $request->except('action', 'note');
            $used   = User::where('phone', $member['phone'])->first();

            if (!empty($used)) {
                return redirect()->back()->withInput($request->all())->withErrors([
                    'phone' => 'Số điện thoại đã được sử dụng!',
                ]);
            }

            $member['refcode'] = $member['phone'];
            $member['sale_id'] = Auth::user()->id;
            $member['password'] = Hash::make($member['phone']);
            $member['status'] = UserConstants::STATUS_INACTIVE;
            $member['is_registered'] = 0;
            $member = User::create($member);

            if (!$member->save()) {
                return redirect()->back()->with('notify', 'Thao tác không thành công!');
            }

            // Save note
            SaleActivity::create([
                'type' => SaleActivity::TYPE_NOTE,
                'sale_id' => Auth::user()->id,
                'member_id' => $member->id,
                'content' => $request->input('note'),
            ]);

            return redirect()->back()->with('notify', 'Thao tác thành công!');
        }

        $this->data['hasBack'] = route('user.members');
        $this->data['navText'] = __('Thêm thành viên');

        return view('user.add_member', $this->data);
    }

    public function meWork(Request $request)
    {
        $data = DB::table('item_activities as ia')
            ->join('items as i', 'i.id', '=', 'ia.item_id')
            ->join('users as u', 'u.id', '=', 'ia.user_id')
            ->where('ia.user_id', auth()->user()->id)
            ->select('ia.*', 'i.title', 'u.name')
            ->get();

        $this->data['data'] = $data;
        return view(env('TEMPLATE', '') . 'me.work', $this->data);
    }
    public function activity(Request $request)
    {
        $data = DB::table('item_activities as ia')
            ->join('items as i', 'i.id', '=', 'ia.item_id')
            ->join('users as u', 'u.id', '=', 'ia.user_id')
            ->select('ia.*', 'i.title', 'u.name')
            ->get();

        $this->data['data'] = $data;
        return view('user.activity', $this->data);
    }
    public function meProfile()
    {
        $user = Auth::user();
        $this->data['user'] = $user;
        if ($user->role == UserConstants::ROLE_SCHOOL) {
            return view(env('TEMPLATE', '') . 'me.profile_school', $this->data);
        }
        return view(env('TEMPLATE', '') . 'me.profile', $this->data);
    }
    public function meEdit(Request $request)
    {
        $editUser = Auth::user();
        $userService = new UserServices();
        if ($request->input('save')) {
            $input = $request->all();

            $input['role'] = $editUser->role;
            $input['user_id'] = $editUser->user_id;
            $input['boost_score'] = $editUser->boost_score;
            $input['commission_rate'] = $editUser->commission_rate;
            $userM = new User();
            $rs = $userM->saveMember($request, $input);
            return redirect()->route('me.profile')->with('notify', $rs);
        }
        $friends = User::where('user_id', $editUser->id)->paginate();
        $editUser = $userService->userInfo($editUser->id);
        $this->data['friends'] = $friends;
        $this->data['user'] = $editUser;
        $this->data['type'] = 'member';
        $this->data['hasBack'] = true;
        if ($editUser->role == UserConstants::ROLE_SCHOOL) {
            $this->data['navText'] = __('Cập nhật thông tin Doanh nghiệp');
            return view(env('TEMPLATE', '') . 'me.user_edit_school', $this->data);
        
        }
        $this->data['navText'] = __('Cập nhật thông tin');
        return view(env('TEMPLATE', '') . 'me.user_edit', $this->data);
    }
    public function meTransHistory()
    {
        return view(env('TEMPLATE', '') . 'me.transactionhistory', $this->data);
    }
    public function meFriend()
    {
        $friends = DB::table('users')->where('user_id', '=', Auth::user()->id)->where('is_child', '=', 0)->get();
        $this->data['friends'] = $friends;
        return view(env('TEMPLATE', '') . 'me.friend', $this->data);
    }
    public function meIntroduce()
    {
        $user = Auth::user();
        $this->data['locations'] = UserLocation::where('user_id', $user->id)->paginate();
        $this->data['user'] = $user;
        return view(env('TEMPLATE', '') . 'me.introduce', $this->data);
    }
    public function meHistory(Request $request)
    {
        $trans = new Transaction();
        // $this->data['anyPoint']= $trans->pendingWalletC(auth()->user()->id);
        $this->data['pointReiceived'] = Transaction::where('user_id', auth()->user()->id)
            ->where('pay_method', UserConstants::WALLET_C)
            ->where('status', ConfigConstants::TRANSACTION_STATUS_DONE)
            ->sum("amount");
        $this->data['pointWait'] = Transaction::where('user_id', auth()->user()->id)
            ->where('pay_method', UserConstants::WALLET_C)
            ->where('status', ConfigConstants::TRANSACTION_STATUS_PENDING)
            ->sum("amount");
        $this->data['WALLETM'] = $trans->history(auth()->user()->id, 'wallet_m');
        $this->data['WALLETC'] = $trans->history(auth()->user()->id, 'wallet_c');
        return  view(env('TEMPLATE', '') . 'me.history', $this->data);
    }
    public function meChild(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        $id = Auth::user()->id;

        $parent = Auth::user();
        if ($request->input('childedit')) {
            $input = $request->all();
            $id = $input['id'];
            $userC = User::find($id);

            $input = $request->all();
            $userC->name = $input['username'];
            $userC->dob = $input['dob'];
            $userC->sex = $input['sex'];
            $userC->introduce = $input['introduce'];
            $userC->save($input);
            return redirect()->route('me.child')->with('notify', 'Cập nhật tài khoản con thành công');
            $this->data['navText'] = __('Quản lý tài khoản con');
        }
        if ($request->input('create')) {
            $input = $request->all();
            $userChild = new User();
            $userChild->createChild($parent, $input);
            return redirect()->route('me.child')->with('notify', 'Tạo tài khoản mới thành công');
        }
        $this->data['orderStats'] = $userService->orderStats($user->id);
        $childuser = User::where('user_id', $id)->where('is_child', 1)->get();
        $this->data['childuser'] = $childuser;
        $this->data['user'] = $user;
        $this->data['navText'] = __('Quản lý tài khoản con');
        return view(env('TEMPLATE', '') . 'me.child', $this->data);
    }
    public function meChildHistory($id)
    {
        $userC = User::find($id);
        $courses = DB::table('order_details')
            ->join('items', 'order_details.item_id', '=', 'items.id')
            ->where('order_details.user_id', $id)
            ->orderBy('order_details.created_at', 'desc')
            ->get();
        $this->data['courses'] = $courses;
        $this->data['userC'] = $userC;
        return view(env('TEMPLATE', '') . 'me.childhistory', $this->data);
    }
    public function mePassword(Request $request)
    {
        $editUser = Auth::user();
        // $validator = Validator::make($request->all(), [

        // ]
        if ($request->input('save')) {
            $input = $request->all();
            $newpass = $request->input('newpassword');
            $oldpass = $request->input('password');
            $input['role'] = $editUser->role;
            $input['user_id'] = $editUser->user_id;
            $input['boost_score'] = $editUser->boost_score;
            $input['commission_rate'] = $editUser->commission_rate;
            $userM = new User();
            if (Hash::check($oldpass, $editUser->password)) {
                if ($request->input('newpassword') != $request->input('repassword')) {
                    return redirect()->back()->with('errormk', 'Mật khẩu không trùng khớp');
                } else {
                    $userM = new User();
                    $rs = $userM->changePassword($request, $input);
                    return redirect()->route('me.dashboard')->with('notify', $rs);
                }
            } else {
                //return redirect()->route('me.resetpassword')->with('notify', 'error');
                return redirect()->back()->with('error', 'Mật Khẩu không chính xác');
            }
        }
        $this->data['user'] = $editUser;
        return view(env('TEMPLATE', '') . 'me.resetpassword', $this->data);
    }

    public function memberEdit(Request $request, $userId)
    {
        $userService = new UserServices();
        $user = Auth::user();

        if ($userId == 1 || !$userService->haveAccess($user->role, 'user.members')) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }

        if ($request->input('moneyFix')) {
            $editUser = User::find($userId);

            $result = $userService->createMoneyFix($editUser, $request->all());
            if ($result === true) {
                return redirect()->back()->with('notify', 'Giao dịch mới đã được cập nhật.');
            } else {
                return redirect()->back()->with('notify', $result);
            }
        }
        if ($request->input('save')) {
            $input = $request->all();
            $userM = new User();
            $rs = $userM->saveMember($request, $input);
            return redirect()->route('user.members')->with('notify', $rs);
        }
        $configM = new Configuration();
        $this->data['configs'] = $configM->gets([ConfigConstants::CONFIG_BONUS_RATE]);
        $userI18n = $userService->userInfo($userId);
        $this->data['user'] = $userI18n;
        $this->data['navText'] = __('Chỉnh sửa Thành viên');
        $this->data['hasBack'] = route('user.members');
        $this->data['type'] = 'member';
        $this->data['priorityLevels'] = UserConstants::$salePriorityLevels;
        return view('user.member_edit', $this->data);
    }
    public function courseConfirm(Request $request)
    {
        $user = Auth::user();
        $userC = DB::table('users')->where('user_id', $user->id)->where('is_child', 1)->orWhere('id', $user->id)->get();
        $userIds = $userC->pluck('id')->toArray();
        $data = DB::table('order_details')
            // ->join('participations', 'participations.schedule_id','=','order_details.id')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->whereNotIn('items.subtype', [ItemConstants::SUBTYPE_DIGITAL, ItemConstants::SUBTYPE_VIDEO])
            ->whereIn('order_details.user_id', $userIds)
            ->select(
                'items.title',
                'items.id as courseId',
                'order_details.id',
                'order_details.user_id',
                'order_details.created_at',
                DB::raw('(SELECT count(*) FROM participations
            WHERE participations.participant_user_id = users.id AND participations.item_id = order_details.item_id AND participations.schedule_id = order_details.id AND participations.participant_confirm > 0
            GROUP BY participations.item_id
            ) AS participant_confirm_count'),
                DB::raw('(SELECT count(*) FROM participations
            WHERE participations.participant_user_id = users.id AND participations.item_id = order_details.item_id AND participations.schedule_id = order_details.id  AND participations.organizer_confirm > 0
            GROUP BY participations.item_id
            ) AS confirm_count')
            )
            ->get();
        $this->data['data'] = $data;
        return view(env('TEMPLATE', '') . 'me.courseconfirm', $this->data);
    }
    public function admitstudent(Request $request)
    {
        if ($request->input('check')) {
            $input = $request->all();
            $id = $input['id'];
            $data = DB::table('order_details')
                ->join('users', 'users.id', '=', 'order_details.user_id')
                ->join('items', 'items.id', '=', 'order_details.item_id')
                ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
                ->where('order_details.id', $id)
                ->where('items.user_id', auth()->user()->id)
                ->select(
                    'items.id as itemId',
                    'items.date_start',
                    'items.price',
                    'items.title',
                    'items.short_content',
                    'items.image as iimage',
                    'users.image as uimage',
                    'users.introduce',
                    'users.name',
                    'users.id as userId',
                    'users.phone',
                    'users.email',
                    'users.address',
                    'users.dob',
                    'order_details.created_at',
                    DB::raw('(SELECT count(*) FROM participations
            WHERE participations.participant_user_id = users.id AND participations.item_id = order_details.item_id
            GROUP BY participations.item_id
            ) AS confirm_count'),
                )
                ->first();
            // dd($data);
            $this->data['data'] = $data;

            return view(env('TEMPLATE', '') . 'me.admitstudent', $this->data);
        }
        $this->data['data'] = null;

        return view(env('TEMPLATE', '') . 'me.admitstudent', $this->data);
    }
    public function modCreate(Request $request)
    {
        if ($request->input('save')) {
            $input = $request->all();
            $userM = new User();
            $rs = $userM->createNewMod($input);
            return redirect()->route('user.mods')->with('notify', $rs);
        }
        $this->data['navText'] = __('Thêm mới quản trị viên');
        $this->data['hasBack'] = true;
        $this->data['type'] = 'mod';
        return view('user.mod_edit', $this->data);
    }

    public function modEdit(Request $request, $userId)
    {
        if ($request->input('save')) {
            $input = $request->all();
            $userM = new User();
            $rs = $userM->saveMod($input);
            return redirect()->route('user.mods')->with('notify', $rs);
        }
        $userService = new UserServices();
        $user = Auth::user();
        if (($userId == 1 && !$request->has('super')) || !$userService->haveAccess($user->role, 'user.mods')) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        } else {
            $this->data['user'] = User::find($userId);
        }
        $this->data['navText'] = __('Chỉnh sửa quản trị viên');
        $this->data['hasBack'] = true;
        $this->data['type'] = 'mod';
        return view('user.mod_edit', $this->data);
    }

    public function statusTouch($userId)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if ($userId == 1 || !$userService->haveAccess($user->role, 'admin')) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $rs = User::find($userId)->update(['status' => DB::raw('1 - status')]);
        return redirect()->back()->with('notify', $rs);
    }

    public function contractList(Request $request)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'user.contract')) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $list = DB::table('contracts')
            ->join('users', 'users.id', '=', 'contracts.user_id');
        if (!empty($request->input('s'))) {
            switch ($request->input('t')) {
                case "phone":
                    $list = $list->where('users.phone', $request->input('s'));
                    break;
                default:
                    $list = $list->where('users.name', 'like', '%' . $request->input('s') . '%');
                    break;
            }
        }
        if ($request->input('ic') == 'on') {
            $list = $list->where('contracts.status', '>=', 0);
        } else {
            $list = $list->where('contracts.status', '>', 0);
        }
        $list = $list->orderBy('contracts.id', 'desc')
            ->select('users.name', 'users.phone', 'contracts.*')
            ->paginate(20);
        $this->data['list'] = $list;
        $this->data['navText'] = __('Các hợp đồng với thành viên');
        return view('user.contract_list', $this->data);
    }

    public function contractInfo(Request $request, $id)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'admin' || $user->role, 'fin')) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $contract = DB::table('contracts')
            ->join('users', 'users.id', '=', 'contracts.user_id')
            ->where('contracts.id', $id)
            ->select('users.name', 'users.phone', 'users.role', 'contracts.*')
            ->first();
        if ($request->get('action') != null) {
            $notifM = new Notification();
            if ($request->get('action') == UserConstants::CONTRACT_APPROVED) {
                Contract::find($id)->update(['status' => UserConstants::CONTRACT_APPROVED]);
                User::find($contract->user_id)->update([
                    'is_signed' => UserConstants::CONTRACT_APPROVED,
                    'commission_rate' => $contract->commission,
                ]);
                $notifM->createNotif(NotifConstants::CONTRACT_APPROVED, $contract->user_id, [
                    'username' => $contract->name,
                ]);
                return redirect()->back()->with('notify', 'Đã duyệt hợp đồng và cập nhật hoa hồng mới');
            } elseif ($request->get('action') == UserConstants::CONTRACT_DELETED) {
                Contract::find($id)->update(['status' => UserConstants::CONTRACT_DELETED]);
                User::find($contract->user_id)->update(['is_signed' => UserConstants::CONTRACT_DELETED]);
                $notifM->createNotif(NotifConstants::CONTRACT_DELETED, $contract->user_id, [
                    'username' => $contract->name,
                ]);
                return redirect()->route('user.contract')->with('notify', 'Đã từ chối hợp đồng với ' . $contract->name);
            }
        }
        $this->data['files'] = UserDocument::where('user_id', $contract->user_id)->get();
        $this->data['contract']  = $contract;
        $this->data['hasBack'] = route('user.contract');
        $this->data['navText'] = __('Hợp đồng với ' . $contract->name);
        return view('user.contract_info', $this->data);
    }

    public function userNoProfile(Request $request)
    {
        $users = DB::table('users')->where('status', 1)
            ->whereNotIn('role', ['admin', 'mod']);
        if (!empty($request->input('s'))) {
            switch ($request->input('t')) {
                case "phone":
                    $users = $users->where('users.phone', $request->input('s'));
                    break;
                default:
                    $users = $users->where('users.name', 'like', '%' . $request->input('s') . '%');
                    break;
            }
        }
        $users = $users->where(function ($q) {
            $q->whereNull('image')
                ->orWhereNull('introduce')
                ->orWhereNull('full_content');
        })
            ->select(DB::raw("users.*, (SELECT notifications.created_at
        FROM notifications WHERE notifications.user_id = users.id AND type = '" . NotifConstants::UPDATE_INFO_REMIND . "'  order by notifications.id desc limit 1) AS last_notif"))
            ->orderBy('users.id', 'desc')
            ->paginate(20);
        $this->data['list'] = $users;
        $this->data['navText'] = __('Nhắc nhở các thành viên chưa cập nhật thông tin');
        return view('user.no_profile', $this->data);
    }

    public function remindProfile($userId)
    {
        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::UPDATE_INFO_REMIND, $userId, []);
        return redirect()->back()->with('notify', 'Đã gửi thông báo');
    }

    public function locationList(Request $request)
    {
        $user = Auth::user();
        $userLocationId = $user->id;
        $userService = new UserServices();
        if ($request->get('user_id')) {
            $userLocationId = $request->get('user_id');
        }
        $this->data['locations'] = UserLocation::where('user_id', $userLocationId)->paginate();
        $this->data['navText'] = __('Quản lý địa điểm/chi nhánh');
        $this->data['layout'] = $userService->isMod() ? 'layout' : 'anylearn.me.layout';
        if ($userService->isMod()) {
            $this->data['partners'] = User::whereIn('role', [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])
                ->where('status', 1)
                ->select('id', 'name')
                ->get();
        }
        return view(env('TEMPLATE', '') . 'me.user_location_list', $this->data);
    }

    public function locationEdit(Request $request, $id)
    {
        $location = UserLocation::find($id);
        $userService = new UserServices();
        if ($request->get('save') == "save") {
            $input = $request->input();
            if ($request->get('user_id')) {
                $input['user_id'] = $request->get('user_id');
            } else {
                $input['user_id'] = Auth::user()->id;
            }

            $geoCode = $userService->getUserLocationGeo($input['address'] . " " . $input['ward_path']);
            if ($geoCode !== false) {
                $input['longitude'] = $geoCode['longitude'];
                $input['latitude'] = $geoCode['latitude'];
            }
            // $input['user_id'] = Auth::user()->id;
            if (isset($input['is_head'])) {
                UserLocation::where('user_id', $input['user_id'])->update(['is_head' => 0]);
                $input['is_head'] =  1;
            } else {
                $input['is_head'] =  0;
            }

            try {
                $new = UserLocation::find($id)->update($input);
            } catch (Exception $e) {
                Log::error($e);
                return redirect()->back()->with('notify',  "Cập nhật chỉ thất bại");
            }
            if ($request->get('user_id')) {
                return redirect()->route('location', ['user_id' => $request->get('user_id')])->with('notify', "Cập nhật địa chỉ thành công");
            }
            return redirect()->route('location')->with('notify', "Cập nhật địa chỉ thành công");
        }
        $this->data['partners'] = User::whereIn('role', [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])
            ->where('status', 1)
            ->select('id', 'name')
            ->get();
        $this->data['location'] = $location;
        $this->data['provinces'] = Province::orderby('name')->get();
        $this->data['districts'] = District::where('parent_code', $location->province_code)->orderBy('name')->get();
        $this->data['wards'] = Ward::where('parent_code', $location->district_code)->orderBy('name')->get();
        $this->data['navText'] = __('Chỉnh sửa địa điểm/chi nhánh');
        $this->data['hasBack'] = true;
        $this->data['layout'] = $userService->isMod() ? 'layout' : 'anylearn.me.layout';
        if ($userService->isMod()) {
            $this->data['partners'] = User::whereIn('role', [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])
                ->where('status', 1)
                ->select('id', 'name')
                ->get();
        }
        return view(env('TEMPLATE', '') . 'me.user_location_form', $this->data);
    }

    public function locationCreate(Request $request)
    {
        $userService = new UserServices();
        if ($request->get('save') == "save") {
            $input = $request->input();
            if ($request->get('user_id')) {
                $input['user_id'] = $request->get('user_id');
            } else {
                $input['user_id'] = Auth::user()->id;
            }

            $geoCode = $userService->getUserLocationGeo($input['address'] . " " . $input['ward_path']);
            if ($geoCode !== false) {
                $input['longitude'] = $geoCode['longitude'];
                $input['latitude'] = $geoCode['latitude'];
            }

            if (isset($input['is_head'])) {
                UserLocation::where('user_id', $input['user_id'])->update(['is_head' => 0]);
                $input['is_head'] =  1;
            } else {
                $input['is_head'] =  0;
            }

            try {
                $new = UserLocation::create($input);
            } catch (Exception $e) {
                Log::error($e);
                return redirect()->back()->with('notify',  "Tạo địa chỉ thất bại");
            }
            if ($request->get('user_id')) {
                return redirect()->route('location', ['user_id' => $request->get('user_id')])->with('notify', "Cập nhật địa chỉ thành công");
            }
            return redirect()->route('location')->with('notify', "Tạo địa chỉ thành công");
        }
        $this->data['provinces'] = Province::orderby('name')->get();
        if ($userService->isMod()) {
            $this->data['partners'] = User::whereIn('role', [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])
                ->where('status', 1)
                ->select('id', 'name')
                ->get();
        }
        $this->data['navText'] = __('Thêm mới địa điểm/chi nhánh');

        $this->data['hasBack'] = true;
        $this->data['layout'] = $userService->isMod() ? 'layout' : 'anylearn.me.layout';
        return view(env('TEMPLATE', '') . 'me.user_location_form', $this->data);
    }

    public function notification(Request $request)
    {
        $user = Auth::user();
        $this->data['navText'] = __('Thông báo');
        $this->data['notifications'] = Notification::where('user_id', $user->id)->where('type', '!=', SmsServices::SMS)->orderby('id', 'desc')->paginate();
        return view(env('TEMPLATE', '') . 'me.notification', $this->data);
    }

    public function pendingOrders(Request $request)
    {
        $user = Auth::user();
        $data = DB::table('orders')
            ->where('orders.status', OrderConstants::STATUS_PAY_PENDING)
            ->where('orders.user_id', $user->id)
            ->select(
                'orders.*',
                DB::raw("(SELECT GROUP_CONCAT(items.title SEPARATOR ',' ) as classes FROM order_details AS os JOIN items ON items.id = os.item_id WHERE os.order_id = orders.id) as classes")
            )
            ->paginate();

        $this->data['orders'] = $data;
        // $this->data['navText'] = __('Khoá học đang chờ bạn thanh toán');
        return view(env('TEMPLATE', '') . 'me.pending_orders', $this->data);
    }

    public function cancelPending(Request $request, $orderId)
    {
        $user = $request->get('_user') ?? Auth::user();
        $order = Order::find($orderId);
        if ($order->user_id != $user->id) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        if ($order->status != OrderConstants::STATUS_PAY_PENDING) {
            return redirect()->back()->with('notify', 'Trạng thái đơn hàng không đúng');
        }
        $transService = new TransactionService();
        $transService->rejectRegistration($orderId, OrderConstants::STATUS_CANCEL_SYSTEM);
        if ($request->get('cb')) {
            return redirect()->to($request->get('cb'))->with('notify', 'Thao tác thành công');
        } else {
            return redirect()->back()->with('notify', 'Thao tác thành công');
        }
    }

    public function orders(Request $request)
    {
        $user = Auth::user();
        $orderDetailM = new OrderDetail();
        $data = $orderDetailM->usersOrders($user->id);
        $this->data['data'] = $data;
        $this->data['navText'] = 'Khoá học đã đăng ký';
        return view(env('TEMPLATE', '') . 'me.user_orders', $this->data);
    }

    public function schedule(Request $request, $orderDetailId)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->back()->with('notify', 'Người dùng không đúng');
        }
        $orderDetail = DB::table('order_details')
            ->join('orders', 'orders.id', '=', 'order_details.order_id')
            ->where('order_details.id', $orderDetailId)
            ->where('orders.user_id', $user->id)
            ->select(
                'order_details.item_id',
            )->first();
        if (!$orderDetail) {
            return redirect()->back()->with('notify', 'Đơn hàng không đúng');
        }
        $item = Item::find($orderDetail->item_id);
        if (!$user) {
            return redirect()->back()->with('notify', 'Không có dữ liệu về khóa học');
        } else { 
            $schedule = ItemSchedulePlan::where('item_id', $item->id)->first();
            if ($schedule) {
                $period = CarbonPeriod::create($schedule->date_start, $schedule->date_end);

                $daylist = [];
                $weekdays = explode(',', $schedule->weekdays);
                foreach ($period as $date) {
                    if (in_array($date->format('w') + 1, $weekdays)) {
                        $daylist[] = $date->format('Y-m-d');
                    }
                }
                $this->data['schedule'] = $schedule;
                $this->data['daylist'] = $daylist;
                $this->data['location'] = UserLocation::where('id', $schedule->user_location_id)->first();
            }
            if ($item->subtype == 'digital') {
                $code = ItemCode::where('item_id', $item->id)->where('order_detail_id', $orderDetailId)->first();
                $this->data['code'] = $code ? $code->code : "";
            }
        }
        $this->data['item'] = $item;
        $this->data['currentDate'] = Carbon::now()->format('Y-m-d');
        $this->data['hasBack'] = true;
        $this->data['navText'] = 'Thông tin khoá học';

        return view(env('TEMPLATE', '') . 'me.user_orders_schedule', $this->data);
    }

    public function contractSign($id)
    {
        $userServ = new UserServices();
        $user = Auth::user();
        $result = $userServ->signContract($user, $id);

        if ($result === true) {
            return redirect()->back()->with('notify', 'Đã ký hợp đồng, vui lòng chờ anyLEARN tiếp nhận và xử lí nhé.');
        } else {
            return redirect()->back()->withInput()->with('notify', $result);
        }
    }

    public function contract(Request $request)
    {
        $user = Auth::user();
        if ($request->get('save') == 'contract') {
            $inputs = $request->input();
            $userServ = new UserServices();
            $result = $userServ->saveContract($user, $inputs);

            if ($result === true) {
                return redirect()->back()->with('notify', 'Cập nhật thông tin doanh nghiêp thành công, vui lòng đọc lại hợp đồng và xác nhận KÝ.');
            } else {
                return redirect()->back()->withInput()->with('notify', $result);
            }
        }
        $contract = Contract::where('user_id', $user->id)
            ->orderby('id', 'desc')->first();
        if (!empty($contract)) {
            $configM = new Configuration();
            if ($contract->type == UserConstants::ROLE_TEACHER) {
                $key = ConfigConstants::CONTRACT_TEACHER;
                $template = $configM->get($key);
                $contract->template = Contract::makeContent($template, $user, $contract);
            } else {
                $key = ConfigConstants::CONTRACT_SCHOOL;
                $template = $configM->get($key);
                $contract->template = Contract::makeContent($template, $user, $contract);
            }
        }
        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            $fileService = new FileServices();
            $fileuploaded = $fileService->doUploadImage($request, 'file');
            if ($fileuploaded === false) {
                return redirect()->back()->with('notify', 'Tải lên chứng chỉ không thành công.');
            }
            $userDocM = new UserDocument();
            $userDocM->addDocWeb($fileuploaded, $user);
            return redirect()->back()->with('notify', 'Tải lên chứng chỉ thành công.');
        }

        $this->data['files'] = UserDocument::where('user_id', $user->id)->get();
        // dd($contract);
        $this->data['contract'] = $contract;
        // $this->data['navText'] = __('Quản lý Hợp Đồng/Chứng Chỉ');
        return view(env('TEMPLATE', '') . 'me.contract', $this->data);
    }

    public function certificate(Request $request)
    {
        $user = Auth::user();
        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            $fileService = new FileServices();
            $fileuploaded = $fileService->doUploadImage($request, 'file');
            if ($fileuploaded === false) {
                return redirect()->back()->with('notify', 'Tải lên chứng chỉ không thành công.');
            }
            $userDocM = new UserDocument();
            $userDocM->addDocWeb($fileuploaded, $user);
            return redirect()->back()->with('notify', 'Tải lên chứng chỉ thành công.');
        }

        $this->data['files'] = UserDocument::where('user_id', $user->id)->get();
        $this->data['navText'] = __('Quản lý Chứng chỉ');
        return view(env('TEMPLATE', '') . 'me.certificate', $this->data);
    }
    public function withdraw(Request $request)
    {
        $user = Auth::user();
        if ($request->input('withdraw')) {
            $input = $request->all();
            if (Hash::check($input['password'], $user->password)) {
                Transaction::create([
                    'user_id' => $user->id,
                    'type' => ConfigConstants::TRANSACTION_WITHDRAW,
                    'amount' => $input['withdraw'],
                    'ref_amount' => $input['withdraw'],
                    'pay_method' => UserConstants::WALLET_C,
                    'pay_info' => '',
                    'content' => 'Rút ' . $input['withdraw'] . ' cho đơn đối tác #' . ($user->id) . ' ' . $user->name,
                    'status' => ConfigConstants::TRANSACTION_STATUS_PENDING,
                    'order_id' => null
                ]);
                return redirect()->back()->with('notify', 'Lệnh rút Tiền đã được gởi đi');
            } else {
                return redirect()->back()->with('notify', 'Mật khẩu không chính xác');
            }
        }
        $history = DB::table('transactions')
        ->where('user_id', $user->id)
        ->where('type', ConfigConstants::TRANSACTION_WITHDRAW)
        ->orderByDesc('created_at')->paginate(20);
        $pending = DB::table('transactions')
        ->where('type', ConfigConstants::TRANSACTION_WITHDRAW)
            ->where('user_id', $user->id)
            ->where('status', ConfigConstants::TRANSACTION_STATUS_PENDING)
            ->sum('amount');
        $contract = Contract::where('user_id', $user->id)->where('status', 99)->first();
        $this->data['history'] = $history;
        $this->data['totalAmount'] = ($user->wallet_c - $pending  ) > 0 ? $user->wallet_c - $pending : 0;
        $this->data['user'] = $user;
        $this->data['contract'] = $contract;
        return view(env('TEMPLATE', '') . 'me.withdraw', $this->data);
    }
    public function finance(Request $request)
    {
        if ($request->input('withdraw')) {
            $user = User::find(auth()->user()->id);
            $input = $request->all();
            $transv = new TransactionService();
            $anypoint = $input['anypoint'];
            $created = $transv->withdraw($anypoint);
            $trans = Transaction::find($created);
            $user->wallet_c -= $anypoint;
            $user->update();
            return Redirect::back()->with('bignotify', 'withdraw');
        }
        $trans = new Transaction();
        // $this->data['anyPoint']= $trans->pendingWalletC(auth()->user()->id);
        // $b = DB::table('transaction')->where('user_id',auth()->user()->id)->where('type','commission')->belongsTo('App\Models\OrderDetail', 'order_id', 'id');
        // dd($b);
        $a = Transaction::where('user_id', auth()->user()->id)->where('type', 'commission')->with('order')->orderBy('id', 'DESC')->get();
        // dd($a);
        $this->data['WALLETM'] = $a;
        $this->data['WALLETC'] = $trans->history(auth()->user()->id, 'wallet_c');
        $this->data['withdraw'] = Transaction::where('user_id', auth()->user()->id)->where('type', 'withdraw')->orderBy('id', 'DESC')->get();
        $this->data['navText'] = __('Quản lý tài chính');
        return view(env('TEMPLATE', '') . 'me.finance', $this->data);
    }
    public function removeCert(Request $request, $fileId)
    {
        $user = Auth::user();
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
        return redirect()->back()->with('notify', 'Xoá chứng chỉ thành công.');
    }
}
