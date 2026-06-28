<?php

namespace App\Models;

use App\Constants\ActivitybonusConstants;
use App\Constants\ConfigConstants;
use App\Constants\FileConstants;
use App\Constants\UserConstants;
use App\Models\I18nContent;
use App\Services\ActivitybonusServices;
use App\Services\FileServices;
use App\Validators\UniquePhone;
use App\Validators\ValidRef;
use Illuminate\Notifications\Notifiable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cookie;

class User extends Authenticatable
{
    use Notifiable;

    const LOGIN_3RD_FACEBOOK = 'facebook';
    const LOGIN_3RD_APPLE = 'apple';
    const LOGIN_3RD_GOOGLE = 'google';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'name', 'email', 'password', 'api_token', 'notif_token', 'phone', 'role', 'status', 'user_id',
        'expire', 'wallet_m', 'wallet_c', 'commission_rate', 'is_hot', 'image', 'introduce',
        'address', 'country', 'dob', 'update_doc', 'user_category_id', 'boost_score',
        'refcode', 'title', 'num_friends', 'package_id', 'banner', 'first_name', 'full_content',
        'is_test', 'is_signed', 'dob_place', '3rd_id', '3rd_type', '3rd_token', 'is_child',
        'sale_id', 'cert_id', 'sex', 'cert_exp', 'cert_location',
        'omicall_id', 'omicall_pwd', 'contact_phone', 'is_registered', 'source', 'business_certificate', 'first_issued_date',
        'issued_by', 'headquarters_address', 'modules', 'sale_priority', 'get_ref_seller',
    ];

    /**
     * The attributes that should be hidden for arrays.
     *
     * @var array
     */
    protected $hidden = [
        'password', 'remember_token', 'api_token', 'full_content'
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @var array
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function getIsAdminAttribute()
    {
        return true;
    }

    public function refuser()
    {
        return $this->belongsTo('App\Models\User', 'user_id', 'id');
    }

    public function validateMember($data)
    {
        return Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['email', 'max:255'],
            'phone' => ['required', 'min:10', 'max:10', new UniquePhone(), 'regex:/[0-9]{10}/'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'ref' => [new ValidRef()],
            'role' => ['required', 'in:member,teacher,school'],
            'business_certificate' => $data['role'] !== 'school' ? [] : ['required'],
            'first_issued_date' => $data['role'] !== 'school' ? [] : ['required'],
            'issued_by' => $data['role'] !== 'school' ? [] : ['required'],
            'headquarters_address' => $data['role'] !== 'school' ? [] : ['required'],
            'title' => $data['role'] !== 'school' ? [] : ['required'],
        ]);
    }
    public function createChild($parent, $input)
    {
        $phoneByTime = $parent->phone . time();
        $obj = [
            'name' => isset($input['username']) ? $input['username'] : null,
            'dob' => isset($input['dob']) ? $input['dob'] : null,
            'phone' => $phoneByTime,
            'refcode' => $phoneByTime,
            'password' => Hash::make($phoneByTime),
            'role' => UserConstants::ROLE_MEMBER,
            'sex' => $input['sex'],
            'user_id' => $parent->id,
            'is_child' => 1,
            'introduce' => $input['introduce'],
            'status' => UserConstants::STATUS_ACTIVE,
        ];
        $newChild = $this->create($obj);
        return $newChild;
    }
    public function createNewMember($data)
    {
        try {
            $obj = [
                'name' => $data['name'],
                'email' => isset($data['email']) ? $data['email'] : null,
                'phone' => $data['phone'],
                'dob' => isset($data['dob']) ? $data['dob'] : null,
                'address' => isset($data['address']) ? $data['address'] : null,
                'role' => $data['role'],
                'country' => isset($data['country']) ? $data['country'] : null,
                'password' => Hash::make($data['password']),
                'status' => UserConstants::STATUS_ACTIVE,
                'update_doc' => UserConstants::STATUS_ACTIVE,
                'refcode' => $data['phone'],
                'sale_id' => isset($data['sale_id']) ? $data['sale_id'] : null,
                'business_certificate' => isset($data['business_certificate']) ? $data['business_certificate'] : null,
                'first_issued_date' => isset($data['first_issued_date']) ? $data['first_issued_date'] : null,
                'issued_by' => isset($data['issued_by']) ? $data['issued_by'] : null,
                'headquarters_address' => isset($data['headquarters_address']) ? $data['headquarters_address'] : null,
                'title' => isset($data['title']) ? $data['title'] : null,

                ['api_token' => hash('sha256', Str::random(60))]
            ];

            $obj['first_name'] = in_array($data['role'], [UserConstants::ROLE_TEACHER, UserConstants::ROLE_MEMBER]) ? $this->firstnameFromName($data['name']) : $data['name'];
            if (!empty($data['ref'])) {
                $refUser = $this->where('refcode', $data['ref'])->first();
                $obj['user_id'] = $refUser->id;
            }
            if ($data['role'] == UserConstants::ROLE_SCHOOL || $data['role'] == UserConstants::ROLE_TEACHER) {
                $obj['update_doc'] = UserConstants::STATUS_INACTIVE;
                $configM = new Configuration();
                $configs = $configM->gets([
                    ConfigConstants::CONFIG_COMMISSION_AUTHOR,
                    ConfigConstants::CONFIG_COMMISSION_SCHOOL
                ]);
                $obj['commission_rate'] = $data['role'] == UserConstants::ROLE_TEACHER
                    ? $configs[ConfigConstants::CONFIG_COMMISSION_AUTHOR]
                    : $configs[ConfigConstants::CONFIG_COMMISSION_SCHOOL];
            }

            $exists = User::where('phone', $obj['phone'])->where('is_registered', 0)->first();
            if ($exists) {
                unset($obj['sale_id']);
                $obj['is_registered'] = 1;
                User::find($exists->id)->update($obj);
                $newMember = User::find($exists->id);
            } else {
                $newMember = $this->create($obj);
            }
            if ($newMember->api_token === null) {
                $newMember->update(['api_token' => hash('sha256', Str::random(60))]);
                Cookie::queue(Cookie::forever('api_token', $newMember->api_token, null, null, false, false));
            } else {
                Cookie::queue(Cookie::forever('api_token', $newMember->api_token, null, null, false, false));
            }
        } catch (\Exception $ex) {
            $newMember = false;
            Log::error($ex);
        }

        try {
            if ($newMember) {
                $notifM = new Notification();
                $notifM->notifNewUser($newMember->id, $newMember->name);
                if ($newMember->user_id > 0) {
                    $notifM->notifNewFriend($newMember->user_id, $newMember->name);
                    SocialPost::create([
                        'type' => SocialPost::TYPE_FRIEND_NEW,
                        'user_id' => $newMember->user_id,
                        'ref_id' => $newMember->id,
                        'day' => date('Y-m-d'),
                    ]);
                    $activityService = new ActivitybonusServices();
                    $activityService->updateWalletC(
                        $newMember->user_id,
                        ActivitybonusConstants::Activitybonus_Referral,
                        'Cộng điểm giới thiệu thành viên mới ' . $newMember->name,
                        null,
                        true
                    );
                }

                $voucherEvent = new VoucherEventLog();
                $voucherEvent->useEvent(VoucherEvent::TYPE_REGISTER, $newMember->id, $newMember->user_id ?? 0);

                $this->updateUpTree($newMember->user_id);

                $newMember->commission_rate = (float)$newMember->commission_rate;
                Cookie::queue(
                    Cookie::forever('api_token', $newMember->api_token, null, null, false, false)
                );
            }
        } catch (\Exception $ex) {
            Log::error($ex);
        }

        return $newMember;
    }

    public function createNewMod($input)
    {
        if ($input['role'] == UserConstants::ROLE_FIN_PARTNER) {
            $input['contact_phone'] = $input['phone'];
            $input['phone'] = md5(now());
        }
        $exits = $this->where('phone', $input['phone'])->first();
        if ($exits) {
            return "Trùng số điện thoại";
        }
        $obj = [
            'name' => $input['name'],
            'email' => $input['email'],
            'phone' => $input['phone'],
            'contact_phone' => isset($input['contact_phone']) ? $input['contact_phone'] : null,
            'omicall_id' => $input['omicall_id'],
            'omicall_pwd' => $input['omicall_pwd'],
            'refcode' => $input['phone'],
            'role' => $input['role'],
            'password' => Hash::make(empty($input['password']) ? $input['phone'] : $input['password']),
            'status' => UserConstants::STATUS_ACTIVE,
        ];
        return $this->create($obj) ? 1 : 0;
    }

    public function saveMod($input)
    {
        if (empty($input['id'])) {
            return 0;
        }
        $obj = [
            'name' => $input['name'],
            'email' => $input['email'],
            // 'phone' => $input['phone'],
            'role' => $input['role'],
            'contact_phone' => $input['phone'],
            'omicall_id' => $input['omicall_id'],
            'omicall_pwd' => $input['omicall_pwd'],
        ];
        if ($input['role'] != UserConstants::ROLE_FIN_PARTNER) {
            $obj['phone'] = $input['phone'];
        }
        if (!empty($input['password'])) {
            $obj['password'] = Hash::make($input['password']);
        }
        $mod = $this->find($input['id']);
        if ($input['role'] != $mod->role) {
            $obj['modules'] = null; # reset acl
        }
        return $mod->update($obj);
    }
    public function changePassword(Request $request, $input)
    {
        if (empty($input['id'])) {
            return 0;
        }
        if (!empty($input)) {
            $obj['password'] = Hash::make($input['newpassword']);
        }
        $rs = $this->find($input['id'])->update($obj);
        return $rs;
    }
    public function saveMember(Request $request, $input)
    {
        if (empty($input['id'])) {
            return 0;
        }
        $obj = [
            'name' => $input['name'],
            'refcode' => $input['refcode'],
            'sex' => isset($input['sex']) ? $input['sex'] : null,
            'title' => isset($input['title']) ? $input['title'] : null,
            'introduce' => $input['introduce'][I18nContent::DEFAULT],
            'full_content' => $input['full_content'][I18nContent::DEFAULT],
            'dob' => isset($input['dob']) ? $input['dob'] : null,
            'cert_id' => isset($input['cert_id']) ? $input['cert_id'] : null,
            'email' => $input['email'],
            'phone' => $input['phone'],
            'role' => $input['role'],
            'address' => isset($input['address']) ? $input['address'] : null,
            'user_id' => $input['user_id'],
            'boost_score' => $input['boost_score'],
            'commission_rate' => $input['commission_rate'],

            'business_certificate' => isset($input['business_certificate']) ? $input['business_certificate'] : null,
            'first_issued_date' => isset($input['first_issued_date']) ? $input['first_issued_date'] : null,
            'issued_by' => isset($input['issued_by']) ? $input['issued_by'] : null,
            'headquarters_address' => isset($input['headquarters_address']) ? $input['headquarters_address'] : null,
        ];

        if (isset($input['get_ref_seller'])) {
            if ($input['get_ref_seller'] == 0 || $input['get_ref_seller'] == 1) {
                $obj['get_ref_seller'] = $input['get_ref_seller'];
            }
        }

        if (
            isset($input['sale_priority'])
            && in_array($input['sale_priority'], array_keys(UserConstants::$salePriorityLevels))
        ) {
            $obj['sale_priority'] = $input['sale_priority'];
        }

        if (isset($input['sale_id'])) {
            $obj['sale_id'] = $input['sale_id'];
        }

        if (!empty($input['password'])) {
            $obj['password'] = Hash::make($input['password']);
        }
        $obj['first_name'] = in_array($input['role'], [UserConstants::ROLE_TEACHER, UserConstants::ROLE_MEMBER]) ? $this->firstnameFromName($input['name']) : $input['name'];

        if (!empty($input['is_signed'])) {
            $obj['is_signed'] = $input['is_signed'];
        }

        $fileService = new FileServices();
        $avatar = $fileService->doUploadImage($request, 'image');
        $banner = $fileService->doUploadImage($request, 'banner');

        $currentData = $this->find($input['id']);
        $needDelete = [];
        if (!empty($avatar['url'])) {
            $needDelete[] = $currentData->image;
            $obj['image'] = $avatar['url'];
        }
        if (!empty($banner['url'])) {
            $needDelete[] = $currentData->banner;
            $obj['banner'] = $banner['url'];
        }
        $editUser = $this->find($input['id']);
        $activityService = new ActivitybonusServices();

        if ($editUser->image == null && isset($input['image']) != null) {
            $activityService->updateWalletC($editUser->id, ActivitybonusConstants::Activitybonus_Update_Avatar, 'Bạn được cộng điểm vì lần đầu cập nhật ảnh đại diện', null);
        }
        if ($editUser->banner == null && isset($input['banner']) != null) {
            $activityService->updateWalletC($editUser->id, ActivitybonusConstants::Activitybonus_Update_Banner, 'Bạn được cộng điểm vì lần đầu cập nhật ảnh bìa', null);
        }
        if ($editUser->email == null && isset($input['email']) != null) {
            $activityService->updateWalletC($editUser->id, ActivitybonusConstants::Activitybonus_Update_Email, 'Bạn được cộng điểm vì lần đầu cập nhật email', null);
        }
        if ($editUser->address == null && isset($input['address']) != null) {
            $activityService->updateWalletC($editUser->id, ActivitybonusConstants::Activitybonus_Update_Address, 'Bạn được cộng điểm vì lần đầu cập nhật địa chỉ', null);
        }

        $rs = $editUser->update($obj);
        if ($rs) {
            $i18 = new I18nContent();
            foreach (I18nContent::$supports as $locale) {
                if ($locale != I18nContent::DEFAULT) {
                    foreach (I18nContent::$userCols as $col => $type) {
                        $i18->i18nSave($locale, 'users', $input['id'], $col, $input[$col][$locale]);
                    }
                }
            }
            $fileService->deleteFiles($needDelete);
        }
        return $rs;
    }


    public function redirectToUpdateDocs()
    {
        if ($this->needUpdateDocs()) {
            return route('user.update_doc');
        }
        return '/admin';
    }

    public function needUpdateDocs()
    {
        $user = Auth::user();
        if (!$user) {
            return false;
        }
        return ($user->role == UserConstants::ROLE_TEACHER || $user->role == UserConstants::ROLE_SCHOOL)
            && $user->update_doc == UserConstants::STATUS_INACTIVE ? true : false;
    }
    public function searchMembers(Request $request, $file = false)
    {
        $members = DB::table('users')->whereIn('users.role', UserConstants::$memberRoles);
        if ($request->input('id_f') > 0) {
            if ($request->input('id_t') > 0) {
                $members = $members->where('users.id', '>=', $request->input('id_f'))->where('users.id', '<=', $request->input('id_t'));
            } else {
                $members = $members->where('users.id', $request->input('id_f'));
            }
        }
        if ($request->input('phone')) {
            $members = $members->where('users.phone', $request->input('phone'));
        }
        if ($request->input('role')) {
            $members = $members->where('users.role', $request->input('role'));
        }
        if ($request->input('name')) {
            $members = $members->where('users.name', 'like', '%' . $request->input('name') . '%');
        }
        if ($request->input('ref_id')) {
            $members = $members->where('users.user_id', $request->input('ref_id'));
        }
        if ($request->input('sale_id') && $request->input('sale_id') != 1) {
            $members = $members->where('users.sale_id', $request->input('sale_id'));
        }
        if ($request->input('date')) {
            $members = $members->whereDate('users.created_at', '>=', $request->input('date'));
        }
        if ($request->input('datet')) {
            $members = $members->whereDate('users.created_at', '<=', $request->input('datet'));
        }
        if ($request->input('adate')) {
            $members = $members->join('sale_activities AS sa2', function ($join) use ($request) {
                $join->on('sa2.member_id', '=', 'users.id')
                    ->whereDate('sa2.created_at', '=', $request->input('adate'));
            });
            if ($request->input('sale_id') == 1) {
                $members = $members->where('sa2.sale_id', 1);
            }
        }
        if ($request->input('sale_priority') != null) {
            $members = $members->where('users.sale_priority', $request->input('sale_priority'));
        }
        if ($request->input('dateo') && $request->input('datelo')) {
            $members = $members->join('orders AS o', function ($join) use ($request) {
                $join->on('o.user_id', '=', 'users.id')
                    ->whereDate('o.created_at', '>=', $request->input('dateo'))
                    ->whereDate('o.created_at', '<=', $request->input('datelo'));
            });
        } elseif ($request->input('dateo')) {
            $members = $members->join('orders AS o', function ($join) use ($request) {
                $join->on('o.user_id', '=', 'users.id')
                    ->whereDate('o.created_at', '>=', $request->input('dateo'));
            });
        } elseif ($request->input('datelo')) {
            $members = $members->join('orders AS lo', function ($join) use ($request) {
                $join->on('lo.user_id', '=', 'users.id')
                    ->whereDate('lo.created_at', '<=', $request->input('datelo'));
            });
        }
        $requester = Auth::user();
        if ($requester->role == UserConstants::ROLE_SALE) {
            $members = $members->where(function ($query) use ($requester) {
                return $query->where('users.sale_id', $requester->id)
                    ->orWhere('users.user_id', $requester->id);
            });
            $members = $members
                ->orderBy('lastsa.last_contact');
        } elseif ($requester->role == UserConstants::ROLE_SALE_MANAGER) {
            $members = $members->where(function ($query) use ($requester) {
                $saleManager = explode(',', env('SALE_MANAGER'));
                // $d = env('SALE_MANAGER');
                // dd($d,$saleManager);
                if (is_array($saleManager)) {
                    return $query->whereIn('users.sale_id', $saleManager)
                        ->orWhereIn('users.user_id', $saleManager);
                } else {
                    return $query;
                }
            });
            $members = $members
                ->orderBy('lastsa.last_contact');
        }
        if ($request->input('sort') == "wallet_c") {
            $members = $members->orderby('users.wallet_c', 'desc');
        }
        $members = $members->orderby('users.is_hot', 'desc')
            ->orderby('users.boost_score', 'desc')
            ->orderby('users.id', 'desc');

        $copy = clone $members;

        $members = $members
            ->leftjoin('users AS u2', 'u2.id', '=', 'users.user_id')
            ->leftJoin(DB::raw("(SELECT max(sa.created_at) last_contact, sa.member_id FROM sale_activities AS sa group by sa.member_id) AS lastsa"), 'lastsa.member_id', '=', 'users.id')
            ->groupBy('users.id')
            ->select(
                'users.id',
                'users.phone',
                'users.role',
                'users.address',
                'users.status',
                'users.email',
                'users.name',
                'users.commission_rate',
                'users.wallet_c',
                'u2.name AS refname',
                'u2.phone AS refphone',
                'u2.id AS refid',
                'users.updated_at',
                'users.update_doc',
                'users.is_hot',
                'users.boost_score',
                'lastsa.last_contact',
                'users.is_registered',
                'users.source',
                'users.sale_priority',
                DB::raw("(SELECT content FROM sale_activities WHERE `type` = 'note' AND member_id = users.id ORDER BY sale_activities.id DESC limit 1) AS last_note")
            );
        if (!$file) {
            $members = $members->paginate(UserConstants::PP);
            $members->sumC = $copy->where('users.status', 1)->sum('users.wallet_c');
        } else {
            $members = $members->get();
            if ($members) {
                $members = json_decode(json_encode($members->toArray()), true);
            } else {
                $members = [];
            }
        }

        return $members;
    }

    public function validateUpdate($userId, $input)
    {
        if (!empty($input['phone'])) {
            $phoneExists = $this->where('phone', $input['phone'])
                ->where('id', '!=', $userId)->count();
            if ($phoneExists) {
                return "Số điện thoại này đã được sử dụng";
            }
        }
        if (!empty($input['refcode'])) {
            $refExists = $this->where('refcode', $input['refcode'])
                ->where('id', '!=', $userId)->count();
            if ($refExists) {
                return "Mã giới thiệu này đã được sử dụng";
            }
        }
        return "";
    }

    public function correctTreeNum()
    {
        $usersNoUpTree = DB::table('users')->whereNull('user_id')->get();
        foreach ($usersNoUpTree as $user) {
            print("\n- start root node " . $user->id);
            $this->updateTreeNum($user->id);
        }
    }

    private function updateTreeNum($userId = null, $level = 2)
    {
        $tab = "";
        for ($i = 1; $i <= $level; $i++) {
            $tab .= "-";
        }

        $friends = $this->where('user_id', $userId)->get();
        if (count($friends) == 0) {
            print("\n" . $tab . " node " . $userId . " 0 friend");
            $this->find($userId)->update([
                'num_friends' => 0,
            ]);
            return 1;
        }
        print("\n" . $tab . " friends of node " . $userId);

        $numFriends = 0;
        foreach ($friends as $friend) {
            $numFriends += $this->updateTreeNum($friend->id, $level + 1);
        }

        print("\n" . $tab . " update node " . $userId . " = " . $numFriends);
        $this->find($userId)->update([
            'num_friends' => $numFriends,
        ]);
        return 1 + $numFriends;
    }

    private function firstnameFromName($name)
    {
        $splitWords = explode(' ', $name);
        return end($splitWords);
    }

    private function updateUpTree($upUserId)
    {
        $upUser = $this->find($upUserId);
        if (!$upUser) {
            return;
        }
        $upUser->update(['num_friends' => $upUser->num_friends + 1]);
        if ($upUser->user_id > 0) {
            $this->updateUpTree($upUser->user_id);
        }
        return;
    }
}
