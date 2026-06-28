<?php

namespace App\Http\Controllers\Apis;

use App\Constants\ItemConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Mail\ReturnRequest;
use App\Models\Category;
use App\Models\ItemExtra;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\User;
use App\Models\UserDocument;
use App\Models\UserLocation;
use App\Services\DashboardServices;
use App\Services\FileServices;
use App\Services\ItemServices;
use App\Services\TransactionService;
use App\Services\UserServices;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class MeApi extends Controller
{
    public function index(Request $request)
    {
        $dashServ = new DashboardServices();
        $user = $request->get('_user');
        $dashServ->init(@request('dateF') ?? date('Y-m-d', strtotime('-365 days')), @request('dateT') ?? date('Y-m-d'));

        $query = DB::table('order_details AS od')
            ->join('items AS i', 'od.item_id', '=', 'i.id')
            ->where('i.user_id', $user->id)
            ->whereNotNull('od.created_at');
        $query = $query->where('od.created_at', '>=', date('Y-m-d', strtotime('-365 days')));
        $results = $query->selectRaw('DATE_FORMAT(od.created_at, "%Y-%m") AS month, sum(od.unit_price) AS num')
            ->groupBy(DB::raw('DATE_FORMAT(od.created_at, "%Y-%m")'))
            ->get();

        $chartDataset = [
            'labels' => [],
            'data' => []
        ];
        $topItem = $dashServ->topItempartnerAPI(10, $user);
        foreach ($results as $row) {
            $chartDataset['labels'][] = date('d/m/y', strtotime($row->month));
            $chartDataset['data'][] = $row->num;
        }

        return response()->json([
            'totalRevenue' => $dashServ->gmvpartnerAPI(true, $user),
            'revenueInPeriod' => $dashServ->gmvpartnerAPI(false, $user),
            'totalStudents' => $dashServ->userCountpanertAPI(true, $user),
            'studentsInPeriod' => $dashServ->userCountpanertAPI(false, $user),
            'chartDataset' => $chartDataset,
            'topItem' => $topItem
        ]);
    }
    public function admitStudentAPI(Request $request, $id)
    {
        $user = $request->get('_user');
        $data = OrderDetail::select(
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
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->where('order_details.id', $id)
            ->where('items.user_id', $user->id)
            ->first();
        if (!$data) {
            return response()->json(['message' => 'Invalid request'], 400);
        }
        $userData = [
            'uimage' => $data->uimage,
            'introduce' => $data->introduce,
            'name' => $data->name,
            'userId' => $data->userId,
            'phone' => $data->phone,
            'email' => $data->email,
            'address' => $data->address,
            'dob' => $data->dob,
        ];

        $itemData = [
            'itemId' => $data->itemId,
            'date_start' => $data->date_start,
            'price' => $data->price,
            'title' => $data->title,
            'short_content' => $data->short_content,
            'iimage' => $data->iimage,
            'created_at' => $data->created_at,
            'confirm_count' => $data->confirm_count,
        ];

        return response()->json([
            'user' => $userData,
            'item' => $itemData,
        ]);
    }
    public function getChildAccountsAPI(Request $request)
    {
        $userService = new UserServices();
        $user = $request->get('_user');
        $id = $user->id;

        $childuser = User::where('user_id', $id)->where('is_child', 1)->get();

        $orderStats = $userService->orderStats($user->id);

        $responseData = [
            'orderStats' => $orderStats,
            'childuser' => $childuser,
            'user' => $user
        ];

        return response()->json($responseData);
    }

    public function childAccountAPI(Request $request, $id = null)
    {
        $parent = $request->get('_user');

        if (!$parent) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        $username = $request->get('username');
        $dob = $request->get('dob');
        $sex = $request->get('sex');
        $introduce = $request->get('introduce');

        $userC = User::find($id);

        if (!$userC) {
            $input = [
                'name' => $username,
                'dob' => $dob,
                'sex' => $sex,
                'introduce' => $introduce
            ];

            $userChild = new User();
            $data = $userChild->createChild($parent, $input);

            if ($data) {
                return response()->json(['message' => 'New child account created successfully'], 200);
            }
        } else {
            $userC->name = $username;
            $userC->dob = $dob;
            $userC->sex = $sex;
            $userC->introduce = $introduce;
            $userC->save();

            if ($userC) {
                return response()->json(['message' => 'Child account updated successfully'], 200);
            }
        }
        return response()->json(['message' => 'Invalid request'], 400);
    }
    public function meWork(Request $request)
    {
        $user = $request->get('_user');
        $data = DB::table('item_activities as ia')
            ->join('items as i', 'i.id', '=', 'ia.item_id')
            ->join('users as u', 'u.id', '=', 'ia.user_id')
            ->where('ia.user_id', $user->id)
            ->select('ia.*', 'i.title', 'u.name')
            ->get();

        $responseData = [
            'data' => $data,
        ];

        return response()->json($responseData, 200);
    }
    // Assuming this code is part of a controller
    public function locationList(Request $request)
    {
        $userService = new UserServices();

        $user = $request->get('_user');
        $userLocationId = $user->id;
        if ($request->get('user_id')) {
            $userLocationId = $request->get('user_id');
        }
        $locations = UserLocation::where('user_id', $userLocationId)->paginate();
        $partners = [];

        if ($userService->isMod()) {
            $partners = User::whereIn('role', [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])
                ->where('status', 1)
                ->select('id', 'name')
                ->get();
        }

        $responseData = [
            'locations' => $locations,
            'partners' => $partners,
        ];

        return response()->json($responseData, 200);
    }
    public function courseConfirm(Request $request)
    {
        $user = $request->get('_user');
        $userC = DB::table('users')->where('user_id', $user->id)->where('is_child', 1)->orWhere('id', $user->id)->get();
        $userIds = $userC->pluck('id')->toArray();
        $data = DB::table('order_details')
            ->select(
                'items.title',
                'items.id as courseId',
                'order_details.id',
                'order_details.user_id',
                'order_details.created_at',
                'participations.participant_confirm',
                'participations.organizer_confirm')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->join('participations', 'participations.schedule_id','=', 'order_details.id')
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->where('order_details.status', 'delivered')
            ->whereNotIn('items.subtype', [ItemConstants::SUBTYPE_DIGITAL, ItemConstants::SUBTYPE_VIDEO])
            ->whereIn('order_details.user_id', $userIds)
            ->orderByDesc('order_details.created_at')
            ->get();

        return response()->json(['data' => $data]);
    }
    public function list(Request $request)
    {
        $user = $request->get('_user');
        $classService = new ItemServices();
        $courseList = $classService->itemList($request, in_array($user->role, UserConstants::$modRoles) ? null : $user->id, ItemConstants::TYPE_CLASS);
        $response = $courseList;
        return response()->json($response);
    }
    public function deliveredOrders(Request $request)
    {
        $user = $request->get('_user');
        $response = DB::table('orders')
            ->join('order_details as od', 'od.order_id', '=', 'orders.id')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->where('orders.user_id', $user->id)
            ->whereIn('orders.status', [
                OrderConstants::STATUS_DELIVERED,
                OrderConstants::STATUS_RETURN_BUYER_PENDING,
                OrderConstants::STATUS_RETURN_SYSTEM,
                OrderConstants::STATUS_REFUND,
            ])
            ->selectRaw("orders.*, group_concat(items.title SEPARATOR ', ') as classes")
            ->groupBy('od.order_id')
            ->orderBy('orders.id', 'desc')
            ->get();

        return response()->json($response);
    }
    public function sendReturnRequest(Request $request, $orderId)
    {
        $user = $request->get('_user');

        $order = Order::find($orderId);
        if (!$order && $order->status != OrderConstants::STATUS_DELIVERED) {
            return response()->json(['error' => 'Có lỗi xảy ra, vui lòng thử lại!!'], 400);
        }
        if (!$order && $order->status != OrderConstants::STATUS_DELIVERED) {
            return response()->json(['error' => 'Có lỗi xảy ra, vui lòng thử lại!!'], 400);
        }
        $order->update(['status' => OrderConstants::STATUS_RETURN_BUYER_PENDING]);
        // Mail::to(env('MAIL_FROM_ADDRESS'))->send(
        //     new ReturnRequest(['orderId' => $orderId, 'name' => $user->name])
        // );
        return response()->json(['message' => 'Yêu cầu hoàn trả đơn hàng của bạn đã được gửi đi!'], 200);
    }
    function getCategories(Request $request)
    {
        $user = $request->get('_user');
        $category = Category::all();
        return response()->json($category);
    }
    function getStudents(Request $request, $courseId)
    {
        $user = $request->get('_user');
        $students = DB::table('order_details')
            ->leftJoin('participations', 'participations.schedule_id','=' ,'order_details.id')
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->where('order_details.item_id', $courseId)
            ->select(
                'users.name',
                'users.id',
                'order_details.created_at',
                'order_details.id as orderId',
                'participations.organizer_confirm',
                'participations.participant_confirm',
            )
            ->get();

        return response()->json($students);
    }
    function addExtrafee(Request $request, $courseId)
    {
        try {
            $user = $request->get('_user');
            $input = $request->all();

            // Khai báo $rs ở đây để đảm bảo nó có giá trị trong mọi trường hợp
            $rs = null;

            // Kiểm tra nếu idextrafee không tồn tại hoặc là null
            if (!isset($input['idextrafee']) || $input['idextrafee'] === null) {
                $rs = ItemExtra::create([
                    'title' => $input['titleextrafee'],
                    'price' => $input['priceextrafee'],
                    'item_id' => $courseId
                ]);
            } else {
                $itemExtra = ItemExtra::find($input['idextrafee']);

                if ($itemExtra) {
                    $itemExtra->update([
                        'title' => $input['titleextrafee'],
                        'price' => $input['priceextrafee']
                    ]);
                    $rs = $itemExtra;
                } else {
                    return response()->json(['error' => 'Không tìm thấy mục phụ phí'], 400);
                }
            }

            // Trả về JsonResponse với mã trạng thái 200 và dữ liệu $rs
            return response()->json($rs, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Có lỗi xảy ra'], 500);
        }
    }
    function getExtrafee(Request $request, $courseId)
    {
        $user = $request->get('_user');
        $rs = ItemExtra::where('item_id', $courseId)->get();
        return response()->json($rs, 200);
    }
    function location(Request $request)
    {
        $user = $request->get('_user');
        $userLocationId = $user->id;
        $userService = new UserServices();
        if ($request->get('user_id')) {
            $userLocationId = $request->get('user_id');
        }
        $locations = UserLocation::where('user_id', $userLocationId);
        return response()->json($locations, 200);
    }

    function certificate(Request $request)
    {
        $user = $request->get('_user');
        try {
            if ($request->hasFile('file') && $request->file('file')->isValid()) {
                $fileService = new FileServices();
                $fileuploaded = $fileService->doUploadImage($request, 'file');
                if ($fileuploaded === false) {
                    return response($fileuploaded, 400);
                } else {
                    if (isset($user)) {
                        $userDocM = new UserDocument();
                        $userDocM->addDocWeb($fileuploaded, $user);
                        return response()->json($fileuploaded, 200);
                    } else {
                        return response()->json(['error' => 'User không được định nghĩa'], 400);
                    }
                }
            }
            return response()->json(['message' => 'Không có file được tải lên.'], 400);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Có lỗi xảy ra'], 500);
        }
    }
    function list_certificate(Request $request)
    {
        $user = $request->get('_user');
        $results = UserDocument::where('user_id', $user->id)->get();
        return response()->json($results);
    }
    function cancelPending(Request $request, $orderId)
    {
        $user = $request->get('_user');
        $order = Order::find($orderId);
        if ($order->user_id != $user->id) {
            return response()->json(['error' => 'Bạn không có quyền cho thao tác này'], 400);
        }
        if ($order->status != OrderConstants::STATUS_PAY_PENDING) {
            return response()->json(['error' => 'Trạng thái đơn hàng không đúng'], 400);
        }
        $transService = new TransactionService();
        $transService->rejectRegistration($orderId, OrderConstants::STATUS_CANCEL_SYSTEM);
        return response()->json(['message' => 'Trạng thái đơn hàng không đúng'], 200);
    }
}
