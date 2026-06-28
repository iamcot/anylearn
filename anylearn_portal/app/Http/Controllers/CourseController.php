<?php

namespace App\Http\Controllers;

use App\Constants\ItemConstants;
use App\Constants\UserConstants;
use App\Models\Item;
use App\Models\ItemResource;
use App\Models\Notification;
use App\Models\Schedule;
use App\Models\User;
use App\Services\ItemServices;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Validator;

class CourseController extends Controller
{
    public function list(Request $request)
    {
        $user = Auth::user();
        $courseService = new ItemServices();
        $this->data['navText'] = __('Quản lý khóa học');
        $this->data['courseList'] = $courseService->itemList($request, in_array($user->role, UserConstants::$modRoles) ? null : $user->id);
        return view('course.list', $this->data);
    }

    public function create(Request $request)
    {
        $courseService = new ItemServices();
        if ($request->input('action') == 'create') {
            $input = $request->all();
            $rs = $courseService->createItem($request);
            if ($rs === false || $rs instanceof Validator) {
                return redirect()->back()->withErrors($rs)->withInput()->with('notify', __('Tạo khóa học thất bại! Vui lòng kiểm tra lại dữ liệu'));
            } else {
                return redirect()->route('course.edit', ['id' => $rs])->with(['tab' => 'resource', 'notify' => __('Tạo khóa học thành công, vui lòng cập nhật hình ảnh, tài liệu nếu cần.')]);
            }
        }
        $user = Auth::user();
        $this->data['courseSeries'] = $courseService->userCourseSeries($user->id);
        $this->data['locationTypes'] = ItemConstants::$locationTypes;
        $this->data['navText'] = __('Tạo khóa học');
        $this->data['hasBack'] = route('course');
        return view('course.edit', $this->data);
    }

    public function edit(Request $request, $courseId)
    {
        $courseService = new ItemServices();
        if ($request->input('action') == 'update') {
            $input = $request->all();
            $rs = $courseService->updateItem($request, $input);
            if ($rs === false || $rs instanceof Validator) {
                return redirect()->back()->withErrors($rs)->withInput()->with(['tab' => $input['tab'], 'notify' => __('Sửa khóa học thất bại! Vui lòng kiểm tra lại dữ liệu')]);
            } else {
                return redirect()->back()->with(['notify' => $rs, 'tab' => $input['tab']]);
            }
        }
        $courseDb =  $courseService->itemInfo($courseId);
        if (empty($courseDb)) {
            return redirect()->route('class')->with('notify', __('Lớp học không tồn tại'));
        }
        $this->data['course'] = $courseDb;
        $user = Auth::user();
        $this->data['courseSeries'] = $courseService->userCourseSeries($user->id);
        $this->data['locationTypes'] = ItemConstants::$locationTypes;
        $this->data['navText'] = __('Chỉnh sửa khóa học');
        $this->data['hasBack'] = route('course');
        $this->data['courseId'] = $courseId;
        return view('course.edit', $this->data);
    }

    public function detail($courseId)
    {
        $this->data['navText'] = 'Tên khóa học';
        $this->data['hasBack'] = true;
        return view('course.detail', $this->data);
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

    public function statusTouch($itemId)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        $rs = Item::find($itemId)->update(['status' => DB::raw('1 - status')]);
        $notifServ = new Notification();
        $notifServ->notifCourseStatus($itemId);
        
        return redirect()->back()->with('notify', $rs);
    }

    public function userStatusTouch($itemId)
    {
        $rs = Item::find($itemId)->update(['user_status' => DB::raw('1 - user_status')]);
        return redirect()->back()->with('notify', $rs);
    }

    public function typeChange($itemId, $newType)
    {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->isMod($user->role)) {
            return redirect()->back()->with('notify', __('Bạn không có quyền cho thao tác này'));
        }
        if ($newType == ItemConstants::TYPE_CLASS) {
            $rs = Item::find($itemId)->update([
                'status' => 0,
                'type' => ItemConstants::TYPE_CLASS,
                'series_id' => null
            ]);
            Schedule::where('item_id', $itemId)->delete();
            return redirect()->route('class.edit', ['id' => $itemId])->with('notify', __('Khóa học đã trở thành lớp học, vui lòng cập nhật lại lịch học.'));
        } elseif ($newType == ItemConstants::TYPE_COURSE) {
            $rs = Item::find($itemId)->update([
                'status' => 0,
                'type' => ItemConstants::TYPE_COURSE,
            ]);
            Schedule::where('item_id', $itemId)->delete();
            return redirect()->route('course.edit', ['id' => $itemId])->with('notify', __('Lớp học đã trở thành khóa học, vui lòng cập nhật lại giờ học'));
        }
        
    }

    public function remindConfirm($itemId) {
        $notifM = new Notification();
        $notifM->notifRemindConfirms($itemId);
        return redirect()->back()->with('notify', 'Đã gửi thông báo nhắc xác nhận.');
    }

    public function remindJoin($itemId) {
        $notifM = new Notification();
        $rs = $notifM->notifRemindJoin($itemId);
        if ($rs === true) {
            return redirect()->back()->with('notify', 'Đã gửi thông báo.');
        } else {
            return redirect()->back()->with('notify', $rs);
        }
        
    }
}
