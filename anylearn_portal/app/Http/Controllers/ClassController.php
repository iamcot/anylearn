<?php

namespace App\Http\Controllers;

use App\Constants\ActivitybonusConstants;
use App\Constants\ConfigConstants;
use App\Constants\ItemConstants;
use App\Constants\NotifConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Models\ItemCode;
use App\Models\ItemCodeNotifTemplate;
use App\ItemExtra;
use App\Models\Category;
use App\Models\Configuration;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\ItemResource;
use App\Models\ItemUserAction;
use App\Models\Schedule;
use App\Models\User;
use App\Models\I18nContent;
use App\Models\ItemExtra as ModelsItemExtra;
use App\Models\ItemSchedulePlan;
use App\Models\ItemVideoChapter;
use App\Models\ItemVideoLesson;
use App\Models\Notification;
use App\Models\OrderDetail;
use App\Models\SocialPost;
use App\Models\UserLocation;
use App\Services\ActivitybonusServices;
use App\Services\FileServices;
use App\Services\ItemServices;
use App\Services\TransactionService;
use App\Services\UserServices;
use App\Services\VideoServices;
use BotMan\BotMan\Messages\Attachments\Video;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Validator;
use Vanthao03596\HCVN\Models\Province;
use Illuminate\Support\Str;


class ClassController extends Controller
{
    public function codes(Request $request)
    {
        /*$this->data['itemCodes'] = DB::table('item_codes')
        ->join('items', 'items.id', '=', 'item_codes.item_id')
        ->leftjoin('users', 'users.id', '=', 'item_codes.user_id')
        ->orderBy('items.id', 'desc')
        ->select('item_codes.*', 'items.title AS class', 'items.user_id AS partner_id', 'users.name', 'users.phone')
        ->paginate(20);*/

        $itemCodes = DB::table('item_codes')
            ->join('items', 'items.id', '=', 'item_codes.item_id')
            ->leftjoin('users', 'users.id', '=', 'item_codes.user_id');

        if ($request->get('action') == 'search') {
            if ($request->get('codeName')) {
                $itemCodes->where('item_codes.code', 'like', '%' . $request->get('codeName') . '%');
            }

            if ($request->get('itemName')) {
                $itemCodes->where('items.title', 'like', '%' . $request->get('itemName') . '%');
            }

            if ($request->get('userName')) {
                $itemCodes->where('users.name', 'like', '%' . $request->get('userName') . '%');
            }

            if ($request->get('codeStatus') != null) {
                if ($request->get('codeStatus') == 1) {
                    $itemCodes->whereNotNull('item_codes.user_id');
                } else {
                    $itemCodes->whereNull('item_codes.user_id');
                }
            }
        }

        $this->data['navText'] = __('Quản lý Thông tin kích hoạt');
        $this->data['itemCodes'] = $itemCodes->orderBy('items.id', 'desc')
            ->select('item_codes.*', 'items.title AS class', 'items.user_id AS partner_id', 'users.name', 'users.phone')
            ->paginate(20);

        return view('class.codes', $this->data);
    }

    public function reSendItemCode(Request $request, $id)
    {
        $itemCode = DB::table('item_codes as ic')
            ->select(
                'ic.*',
                'items.title',
                'items.activation_support',
                'items.seo_url',
                'users.name',
            )
            ->join('items', 'items.id', '=', 'ic.item_id')
            ->join('users', 'users.id', '=', 'ic.user_id')
            ->where('ic.id', $id)
            ->first();

        if (empty($itemCode)) {
            return redirect()->back()->with('notify', 'Có lỗi xảy ra, vui lòng thử lại!!');
        }

        $activationInfo = $itemCode->activation_support == ItemConstants::ACTIVATION_SUPPORT_API
            ? json_decode($itemCode->code, true)
            : ['code' => $itemCode->code];

        $activationInfo['course'] = $itemCode->title;
        $activationInfo['method'] = $itemCode->activation_support;
        $activationInfo['user'] = $itemCode->name;
        $activationInfo['path'] = route('page.pdp', [
            'itemId' => $itemCode->item_id,
            'url' => $itemCode->seo_url,
        ]);

        // dd($activationInfo);
        $notifServ = new Notification();
        $notifServ->notifActivation($itemCode->item_id, $itemCode->user_id, $activationInfo);
        return redirect()->back()->with('notify', 'Thao tác thành công.');
    }

    public function refreshItemCode(Request $request, $idItemCode)
    {
        $itemCode = ItemCode::find($idItemCode);
        if ($itemCode) {
            if ($request->input('action') == 'update') {
                // if (ItemCode::where('order_detail_id', $request->input('order_detail_id'))->first()) {
                //    return redirect()->back()->with('notify', 'Đơn hàng này đã được kích hoạt!.');
                // }

                $validation = DB::table('orders')
                    ->join('order_details as od', 'od.order_id', '=', 'orders.id')
                    ->join('items', 'items.id', '=', 'od.item_id')
                    ->where('items.subtype', ItemConstants::SUBTYPE_DIGITAL)
                    ->where('orders.status', OrderConstants::STATUS_DELIVERED)
                    ->where('orders.user_id', $request->input('user_id'))
                    ->where('od.id', $request->input('order_detail_id'))
                    ->first();

                if ($validation) {
                    $itemCode->update($request->except(['action', '_token', 'code']));
                    return redirect()->route('codes')->with('notify', 'Thao tác thành công.');
                }

                return redirect()->back()->with('notify', 'Vui lòng kiểm tra lại thông tin đơn hàng!!');
            }

            $this->data['hasBack'] = route('codes');
            $this->data['itemCode'] = $itemCode;

            return view('class.refresh_item_code', $this->data);
        }
        return redirect()->back()->with('notify', 'Có lỗi xảy ra, vui lòng thử lại!!');
    }

    public function list(Request $request)
    {
        $user = Auth::user();
        if ($request->get('action') == 'rating') {
            $itemId = $request->get('class-id', 0);
            $rating = $request->get('rating', 5);
            $comment = $request->get('comment', '');
            if ($itemId <= 0) {
                return redirect()->back()->with(['notify' => 'Khóa học không tồn tại.']);
            }
            $itemUserActionM = new ItemUserAction();
            $rs = $itemUserActionM->saveRating($itemId, $user->id, $rating, $comment);
            return redirect()->back()->with(['notify' => $rs]);
        }
        $classService = new ItemServices();
        $userService = new UserServices();
        $this->data['navText'] = __('Lớp học của tôi');
        if ($request->input('action') == 'clear') {
            return redirect()->route('class');
        }
        $courseList = $classService->itemList($request, in_array($user->role, UserConstants::$modRoles) ? null : $user->id, ItemConstants::TYPE_CLASS);

        $this->data['courseList'] = $courseList;
        if ($userService->isMod()) {
            $this->data['isSale'] = false;
            if ($user->role == UserConstants::ROLE_SALE || $user->role == UserConstants::ROLE_SALE_MANAGER) {
                $this->data['isSale'] = true;
            }
            return view('class.list', $this->data);
        } else {
            return view(env('TEMPLATE', '') . 'me.class_list', $this->data);
        }
    }

    public function create(Request $request)
    {
        $user = Auth::user();
        $courseService = new ItemServices();
        if ($request->input('action') == 'create') {
            $input = $request->all();
            $rs = $courseService->createItem($request, ItemConstants::TYPE_CLASS);
            if ($rs === false || $rs instanceof Validator) {
                return redirect()->back()->withErrors($rs)->withInput()->with('notify', __('Tạo lớp học thất bại! Vui lòng kiểm tra lại dữ liệu'));
            } else {
                $tab = 'schedule';
                if ($input['subtype'] == 'video') {
                    $tab = 'video';
                }
                if ($input['subtype'] == 'digital') {
                    $tab = 'info';
                }
                $userService = new UserServices();
                if ($userService->isMod()) {
                    return redirect()->route('class.edit', ['id' => $rs])->with(['tab' => $tab, 'notify' => __('Tạo lớp học thành công, vui lòng tiếp tục bổ sung thông tin liên quan.')]);
                } else {
                    return redirect()->route('me.class.edit', ['id' => $rs])->with(['tab' => $tab, 'notify' => __('Tạo lớp học thành công, vui lòng tiếp tục bổ sung thông tin liên quan.')]);
                }
            }
        }
        $configM = new Configuration();
        $this->data['configs'] = $configM->gets([
            ConfigConstants::CONFIG_DISCOUNT,
            ConfigConstants::CONFIG_COMMISSION,
            ConfigConstants::CONFIG_COMMISSION_FOUNDATION,
            ConfigConstants::CONFIG_COMMISSION_REF_SELLER,
        ]);
        $category = Category::all();
        $this->data['categories'] = $category;
        $this->data['companyCommission'] = null;
        $this->data['isSchool'] = false;
        $this->data['navText'] = __('Tạo lớp học');
        $this->data['hasBack'] = route('class');
        $this->data['action'] = 'create';
        $userService = new UserServices();
        if ($userService->isMod()) {
            $this->data['partners'] = User::whereIn('role', [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])
                ->where('status', 1)
                ->select('id', 'name')
                ->get();
            return view('class.edit', $this->data);
        } else {
            $this->data['hasBack'] = route('me.class');
            return view(env('TEMPLATE', '') . 'me.class_edit', $this->data);
        }
    }

    public function del(Request $request, $courseId)
    {
        Schedule::where('item_id', $courseId)->delete();
        Item::find($courseId)->delete();
        return redirect()->back();
    }

    public function activities(Request $request)
    {
        $data = DB::table('item_activities as ia')
            ->join('items as i', 'i.id', '=', 'ia.item_id')
            ->join('users as u', 'u.id', '=', 'ia.user_id')
            ->join('users as iu', 'iu.id', '=', 'i.user_id')
            ->select('ia.*', 'i.title', 'u.name as buyer_name', 'iu.name as partner', 'u.phone as buyer_phone')
            ->orderby('ia.id', 'desc')
            ->paginate(20);

        $this->data['data'] = $data;
        return view('class.activities', $this->data);
    }

    public function edit(Request $request, $courseId)
    {
        $input = $request->all();

        if ($request->get('action') == 'mailsave') {
            Item::find($courseId)->update([
                'mailcontent' => isset($input['mailcontent']) ? $input['mailcontent'] : null
            ]);
            return redirect()->back()->with(['notify' => "Cập nhật thành công", 'tab' => $input['tab']]);
        }

        if ($request->get('action') == 'dlesson') {
            $lid = $request->get('lid');
            $lesson = ItemVideoLesson::find($lid);
            if ($lesson && $lesson->item_id == $courseId) {
                $lesson->delete();
                return redirect()->back()->with(['notify' => 1, 'tab' => 'video']);
            } else {
                return redirect()->back()->with(['notify' => 'Không thể xóa bài học này.', 'tab' => 'video']);
            }
        }

        if ($request->get('action') == 'dchap') {
            $cid = $request->get('cid');
            $chapter = ItemVideoChapter::find($cid);
            $lessonCount = ItemVideoLesson::where('item_video_chapter_id', $cid)->count();
            if ($chapter && $chapter->item_id == $courseId && $lessonCount == 0) {
                $chapter->delete();
                return redirect()->back()->with(['notify' => 1, 'tab' => 'video']);
            } else {
                return redirect()->back()->with(['notify' => 'Không thể xóa chương này', 'tab' => 'video']);
            }
        }

        if ($request->input('action') == 'deleteextrafee') {
            ModelsItemExtra::find($input['iddelete'])->delete();
            return redirect()->back()->with(['notify' => "Xóa thành công", 'tab' => 'price']);
        }
        if ($request->input('action') == 'addextrafee') {
            if ($input['idextrafee'] == null) {
                ModelsItemExtra::create([
                    'title' => $input['titleextrafee'],
                    'price' => $input['priceextrafee'],
                    'item_id' => $courseId
                ]);
                return redirect()->back()->with(['notify' => "Thêm phụ phí thành công", 'tab' => 'price']);
            } else {
                $rs = ModelsItemExtra::find($input['idextrafee'])->update([
                    'title' => $input['titleextrafee'],
                    'price' => $input['priceextrafee']
                ]);
                return redirect()->back()->with(['notify' => "Chỉnh sửa thành công", 'tab' =>  'price']);
            }
        }
        if ($request->input('action') == 'createChapter') {
            $videoServices = new VideoServices();
            $videoServices->createChapter($request, $input);
            return redirect()->back()->with(['notify' => 1, 'tab' => 'video']);
        }
        if ($request->input('action') == 'createLesson') {
            $videoServices = new VideoServices();
            $videoServices->createLesson($request, $input);
            return redirect()->back()->with(['notify' => 1, 'tab' => 'video']);
        }
        if ($request->get('action') == 'schedule') {
            $schedulePlan = $request->get('opening');
            if (empty($schedulePlan['title']) || empty($schedulePlan['date_start']) || empty($schedulePlan['time_start'])) {
                return redirect()->back()->with(['notify' => 'Vui lòng nhập các trường có dấu *', 'tab' => 'schedule']);
            }
            if (empty($schedulePlan['d'])) {
                return redirect()->back()->with(['notify' => 'Vui lòng chọn ít nhất một ngày trong tuần', 'tab' => 'schedule']);
            }
            $ds = [];
            foreach ($schedulePlan['d'] as $day => $v) {
                $ds[] = $day;
            }
            $schedulePlan['weekdays'] = implode(",", $ds);
            $schedulePlan['item_id'] = $courseId;
            if (empty($schedulePlan['plan'])) {
                ItemSchedulePlan::create($schedulePlan);
            } else {
                ItemSchedulePlan::find($schedulePlan['plan'])->update($schedulePlan);
            }
            return redirect()->back()->with(['notify' => 1, 'tab' => 'schedule']);
        }
        $courseService = new ItemServices();
        if ($request->input('action') == 'update') {
            try {
                $rs = $courseService->updateItem($request, $input);

                $isDigitalCourse = Item::where('id', $courseId)
                    ->where('subtype', ItemConstants::SUBTYPE_DIGITAL)
                    ->first();

                if ($isDigitalCourse) {
                    if (!empty($input['code'])) {
                        $courseService->createItemCodes($courseId, $input['code']);
                    }
                    if (key_exists('email', $input) && key_exists('email', $input)) {
                        $notifTemplate = ItemCodeNotifTemplate::where('item_id', $courseId)->first();
                        if (empty($notifTemplate)) {
                            if (!empty($input['email'])  || !empty($input['notif'])) {
                                ItemCodeNotifTemplate::create([
                                    'item_id' => $courseId,
                                    'email_template' => $input['email'],
                                    'notif_template' => $input['notif'],
                                ]);
                            }
                        } else {
                            $beUpdate = [
                                'email_template' => $input['email'] != "" ?  $input['email'] : null,
                                'notif_template' => $input['notif'] != "" ? $input['notif'] : null,
                            ];
                            $notifTemplate->update($beUpdate);
                        }
                    }
                }
            } catch (Exception $e) {
                Log::error($e);
                return redirect()->back()->with(['tab' => $input['tab'], 'notify' => 'Có lỗi xảy ra khi cập nhật, vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.']);
            }

            if ($rs === false || $rs instanceof Validator) {
                return redirect()->back()->withErrors($rs)->withInput()->with(['tab' => $input['tab'], 'notify' => __('Sửa lớp học thất bại! Vui lòng kiểm tra lại dữ liệu')]);
            } else {
                return redirect()->back()->with(['notify' => $rs, 'tab' => $input['tab']]);
            }
        }
        $courseDb = $courseService->itemInfo($courseId);
        if (empty($courseDb)) {
            return redirect()->route('class')->with('notify', __('Lớp học không tồn tại'));
        }
        $author = User::find($courseDb['info']->user_id);
        if ($author->role == UserConstants::ROLE_SCHOOL) {
            $this->data['isSchool'] = true;
            $this->data['teachers'] = DB::table('users')
                ->leftjoin('class_teachers AS ct', function ($join) use ($courseDb) {
                    $join->on('ct.user_id', '=', 'users.id');
                    $join->on('ct.class_id', '=', DB::raw($courseDb['info']->id));
                })

                ->where('users.user_id', $courseDb['info']->user_id)
                ->where('users.role', UserConstants::ROLE_TEACHER)
                ->select('users.*', 'ct.id AS isSelected')
                ->get();
        } else {
            $this->data['isSchool'] = false;
        }
        $configM = new Configuration();
        $this->data['configs'] = $configM->gets([
            ConfigConstants::CONFIG_DISCOUNT,
            ConfigConstants::CONFIG_COMMISSION,
            ConfigConstants::CONFIG_COMMISSION_FOUNDATION,
            ConfigConstants::CONFIG_COMMISSION_REF_SELLER,
        ]);

        $this->data['companyCommission'] = json_decode($courseDb['info']->company_commission, true);
        $userLocations = UserLocation::where('user_id', $author->id)->orderby('is_head', 'desc')->get();
        $this->data['userLocations'] = $userLocations;
        $this->data['openings'] = DB::table('item_schedule_plans')
            ->join('user_locations', 'user_locations.id', '=', 'user_location_id')
            ->where('item_id', $courseId)
            ->select(
                'item_schedule_plans.title',
                'item_schedule_plans.id',
                'user_locations.title AS location',
                'item_schedule_plans.date_start',
                'item_schedule_plans.time_start',
                'item_schedule_plans.weekdays',
                'item_schedule_plans.info'
            )
            ->get();
        if ($request->get('plan')) {
            $this->data['opening'] = ItemSchedulePlan::find($request->get('plan'));
            $this->data['opening']->weekdays = explode(",", $this->data['opening']->weekdays);
        }
        // dd($this->data['openings']);

        if (!$request->session()->get('tab') && $request->get('tab')) {
            $request->session()->flash('tab', $request->get('tab'));
        }
        // if ($request->get('op')) {
        //     $op = Item::find($request->get('op'));
        //     $this->data['opening'] = $op ?? null;
        //     $courseDb['schedule'] = Schedule::where('item_id', $op->id)->get();
        // }
        $category = Category::all();

        $this->data['categories'] = $category;
        $itemCats = ItemCategory::where('item_id', $courseId)->get();
        $this->data['itemCategories'] = [];
        foreach ($itemCats as $cat) {
            $this->data['itemCategories'][] = $cat->category_id;
        }

        $this->data['ratings'] = DB::table('item_user_actions')
            ->join('users', 'users.id', '=', 'item_user_actions.user_id')
            ->where('type', 'rating')->where('item_id', $courseId)
            ->select('users.name', 'item_user_actions.*')
            ->get();

        $this->data['students'] = DB::table('order_details')
            // ->leftJoin('participations', 'participations.')
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->where('order_details.item_id', $courseId)
            ->select(
                'users.name',
                'users.id',
                'order_details.created_at',
                'order_details.id AS orderId',
                DB::raw('(SELECT count(*) FROM participations
            WHERE participations.participant_user_id = users.id AND participations.item_id = order_details.item_id AND participations.schedule_id = order_details.id  AND participations.organizer_confirm > 0
            GROUP BY participations.item_id
            ) AS confirm_count'),
                DB::raw('(SELECT count(*) FROM participations
            WHERE participations.participant_user_id = users.id AND participations.item_id = order_details.item_id AND participations.schedule_id = order_details.id  AND participations.participant_confirm > 0
            GROUP BY participations.item_id
            ) AS participant_confirm_count'),
                DB::raw("(SELECT value FROM item_user_actions
            WHERE item_user_actions.user_id = users.id AND item_user_actions.item_id = order_details.item_id
            and item_user_actions.type = 'cert'
            ORDER BY id DESC
            LIMIT 1
            ) AS cert")
            )
            ->get();

        if ($courseDb['info']->subtype == ItemConstants::SUBTYPE_DIGITAL) {
            $itemCodes = DB::table('item_codes')
                ->join('items', 'items.id', '=', 'item_codes.item_id')
                ->leftjoin('users', 'users.id', '=', 'item_codes.user_id')
                ->leftjoin('order_details', 'order_details.id', '=', 'item_codes.order_detail_id')
                ->where('items.id', $courseId)
                ->orderBy('items.id', 'desc')
                ->select('item_codes.*', 'items.title AS class', 'items.user_id AS partner_id', 'users.name', 'users.phone', 'order_details.order_id')
                ->paginate(20);
            $this->data['itemCodes'] = $itemCodes;
        }
        $videoServices = new VideoServices();
        $this->data['videos'] = $videoServices->getAllChapterAndLessons($courseId);
        // $this->data['lesson'] = DB::table('item_video_lessons')->get();
        $this->data['course'] = $courseDb;
        $this->data['navText'] = __('Chỉnh sửa lớp học');
        $this->data['hasBack'] = route('class');
        $this->data['courseId'] = $courseId;
        $this->data['extra'] = ModelsItemExtra::where('item_id', $courseId)->get();

        if ($courseDb['info']->subtype == ItemConstants::SUBTYPE_DIGITAL) {

            foreach (config('activation_apis') as $dp) {
                $this->data['config_api'] = $dp['partnerID'] == $courseDb['info']->user_id ? true : false;
                break;
            }

            $this->data['notifTemplates'] = ItemCodeNotifTemplate::where('item_id', $courseId)->first();
        }

        $userService = new UserServices();
        if ($userService->isMod()) {
            $this->data['partners'] = User::whereIn('role', [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])
                ->where('status', 1)
                ->select('id', 'name')
                ->get();
            return view('class.edit', $this->data);
        } else {
            $this->data['hasBack'] = route('me.class');
            return view(env('TEMPLATE', '') . 'me.class_edit', $this->data);
        }
    }

    public function resourceDelete($id)
    {
        $resourceM = new ItemResource();
        $rs = $resourceM->deleteRes($id);
        return redirect()->back()->with([
            'tab' => 'resource',
            'notify' => $rs
        ]);
    }

    public function delSchedule($id)
    {
        //$rs = Schedule::where('item_id', $id)->delete();
        $rs = ItemSchedulePlan::find($id)->delete();
        return redirect(strtok(url()->previous(), '?'))->with([
            'tab' => 'schedule',
            'notify' => ($rs > 0)
        ]);
    }

    public function category()
    {
        $data = Category::paginate();
        $i18nModel = new I18nContent();

        // change vi->en
        foreach ($data as $row) {
            foreach (I18nContent::$supports as $locale) {
                if ($locale == I18nContent::DEFAULT) {
                    foreach (I18nContent::$categoryCols as $col => $type) {
                        $row->$col =  [I18nContent::DEFAULT => $row->$col];
                    }
                } else {
                    $item18nData = $i18nModel->i18nCategory($row->id, $locale);
                    $supportCols = array_keys(I18nContent::$categoryCols);

                    foreach ($supportCols as $col) {
                        if (empty($item18nData[$col])) {
                            $row->$col = $row->$col + [$locale => ""];
                        } else {
                            $row->$col = $row->$col + [$locale => $item18nData[$col]];
                        }
                    }
                }
            }
        }
        $this->data['categories'] = $data;
        return view('category.index', $this->data);
    }
    public function categoryEdit(Request $request, $id = null)
    {
        if ($request->get('save')) {
            foreach (I18nContent::$supports as $locale) {
                $input = $request->all();
                // dd($input);
                $category = $input["title"];
                // dd($category);
                $url = Str::slug($category[$locale]);
                $catId = $request->get('id');
                // dd($category);
                $data = [
                    'title' => $category[$locale],
                    'url' => $url,
                ];
                $i18n = new I18nContent();
                if ($catId) {
                    if ($locale != I18nContent::DEFAULT) {
                        $i18n->i18nSave($locale, 'categories', $catId, 'title', $category[$locale]);
                        $i18n->i18nSave($locale, 'categories', $catId, 'url', $url);
                    } else {
                        Category::find($catId)->update($data);
                    }
                } else {
                    if ($locale == I18nContent::DEFAULT) {
                        $id = Category::create($data)->id;
                    } else {
                        $i18n->i18nSave($locale, 'categories', $id, 'title', $category[$locale]);
                        $i18n->i18nSave($locale, 'categories', $id, 'url', $url);
                    }
                }
            }
            return redirect()->route('category')->with('notify', 'Thành công');
        }
        if ($id) {
            $data = Category::find($id);
            $i18nModel = new I18nContent();

            // change vi->en

            foreach (I18nContent::$supports as $locale) {
                if ($locale == I18nContent::DEFAULT) {
                    foreach (I18nContent::$categoryCols as $col => $type) {
                        $data->$col = [I18nContent::DEFAULT => $data->$col];
                    }
                } else {
                    $supportCols = array_keys(I18nContent::$categoryCols);
                    $item18nData = $i18nModel->i18nCategory($data->id, $locale);
                    foreach ($supportCols as $col) {
                        if (empty($item18nData[$col])) {
                            $data->$col = $data->$col + [$locale => ""];
                        } else {
                            $data->$col = $data->$col + [$locale => $item18nData[$col]];
                        }
                    }
                }
            }
            $this->data['category'] = $data;
        }
        return view('category.form', $this->data);
    }
    public function likeTouch($itemId)
    {
        $user = Auth::user();
        $item = Item::find($itemId);
        if (!$item) {
            return redirect()->back()->with('notif', 'Trang không tồn tại');
        }
        $activityServ = new ActivitybonusServices();
        $activityServ->updateWalletC($user->id, ActivitybonusConstants::Activitybonus_Course_Favourite, 'Bạn được cộng điểm vì yêu thích khóa học', $itemId);
        $itemUserActionM = new ItemUserAction();
        $rs = $itemUserActionM->touchFav($itemId, $user->id);
        return redirect()->back();
    }

    public function specsList(Request $request, $type)
    {
        return view('specs.list');
    }

    public function specsEdit(Request $request, $type, $specId)
    {
        return view('specs.edit');
    }

    public function specsLink(Request $request, $type, $objId)
    {
        return view('specs.links');
    }

    public function authorConfirmJoinCourse(Request $request, $itemId)
    {

        $joinUserId = $request->get('join_user');
        $orderId = $request->get('orderId');
        $firstSchedule = DB::table('order_details')
            // ->join('participations', 'participations.schedule_id', '=', 'order_details.id')
            ->where('order_details.item_id', $itemId)
            ->where('order_details.user_id', $joinUserId)
            ->where('order_details.id', $orderId)
            ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            // ->whereNull('participations.id')
            ->select('order_details.id')
            ->first();
        $itemServ = new ItemServices();
        try {
            $itemServ->comfirmJoinCourse($request, $joinUserId, $firstSchedule->id);
        } catch (\Exception $ex) {
            return redirect()->back()->with(['tab' => 'registers', 'notify' => $ex->getMessage()]);
        }

        return redirect()->back()->with(['tab' => 'registers', 'notify' => 'Thao tác thành công']);
    }

    public function authorCert(Request $request, $itemId, $userId)
    {
        $certTemplate = ItemResource::where('item_id', $itemId)
            ->where('type', 'cert')
            ->first();
        if (!$certTemplate) {
            return redirect()->back()->with(['tab' => 'registers', 'notify' => 'Chưa có mẫu chứng chỉ']);
        }
        $user = User::find($userId);
        if (!$user) {
            return redirect()->back()->with(['tab' => 'registers', 'notify' => 'Thành viên không tồn tại']);
        }
        $item = Item::find($itemId);
        $fileServ = new FileServices();
        try {
            $certUrl = $fileServ->generateCert($certTemplate, $user, $item);
            $notifM = new Notification();
            if ($user->is_child) {
                $parent = User::find($user->user_id);
                $receiverId = $parent->id;
            } else {
                $receiverId = $user->id;
            }
            $notifM->createNotif(NotifConstants::COURSE_CERT_SENT, $receiverId, [
                'name' => $user->name,
                'class' => $item->title,
                'cert' => $certUrl,
                'content' => ""
            ]);

            $existsPost = SocialPost::where('type', SocialPost::TYPE_CLASS_CERT)
                ->where('user_id', $receiverId)
                ->where('ref_id', $item->id)
                ->first();
            if (!$existsPost) {
                SocialPost::create([
                    'type' => SocialPost::TYPE_CLASS_CERT,
                    'user_id' => $user->id,
                    'ref_id' => $item->id,
                    'image' => $certUrl,
                    'day' => date('Y-m-d'),
                ]);
            }
        } catch (Exception $ex) {
            Log::error($ex);
            return redirect()->back()->with(['tab' => 'registered', 'notify' => $ex->getMessage()]);
        }
        return redirect()->back()->with(['tab' => 'registered', 'notify' => 'Thao tác thành công']);
    }
}
