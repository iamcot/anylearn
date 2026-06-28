<?php

namespace App\Http\Controllers;

use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Models\Contract;
use App\Models\Feedback;
use App\Models\User;
use App\Services\DashboardServices;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\I18nContent;
use App\Models\Spm;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Show the application dashboard.
     *
     * @return \Illuminate\Contracts\Support\Renderable
     */
    public function index(Request $request)
    {
        $userM = new User();
        $this->data['navText'] = __('Bảng thông tin');
        $this->data['user'] = Auth::user();
        $userServ = new UserServices();
        $dashServ = new DashboardServices();
        if (auth()->user()->role == UserConstants::ROLE_SALE_MANAGER) {
            $input = $request->all();
            $saleManager = explode(',', env('SALE_MANAGER'));
            $data = DB::table('order_details as od')
                ->select('od.unit_price', 'od.created_at', 'i.title', 'u1.name as buyer_name', 'u2.name as seller_name')
                ->join('items as i', 'od.item_id', '=', 'i.id')
                ->join('users as u1', 'od.user_id', '=', 'u1.id')
                ->join('users as u2', 'u1.sale_id', '=', 'u2.id')
                ->whereIn('u1.sale_id', $saleManager);
            $data2 = DB::table('order_details as od')
                ->join('items as i', 'od.item_id', '=', 'i.id')
                ->join('users as u1', 'od.user_id', '=', 'u1.id')
                ->join('users as u2', 'u1.sale_id', '=', 'u2.id')
                ->whereIn('u1.sale_id', $saleManager);
            $data3 = DB::table('order_details as od')
                ->join('items as i', 'od.item_id', '=', 'i.id')
                ->join('users as u1', 'od.user_id', '=', 'u1.id')
                ->join('users as u2', 'u1.sale_id', '=', 'u2.id')
                ->whereIn('u1.sale_id', $saleManager);
            $data4 = $data3->count();
            if ($request->input('filter')) {
                switch ($input['filter']) {
                    case 'time':
                        $data->orderByDesc('od.created_at');
                        break;
                    case 'seller':
                        $data->orderBy('u2.name');
                        break;
                    case 'product':
                        $data->orderByDesc('i.title');
                        break;
                    case 'buyer':
                        $data->orderBy('u1.name');
                        break;
                    case 'price':
                        $data->orderBy('od.unit_price');
                        break;
                }
            }
            if ($request->input('time')) {
                switch ($input['time']) {
                    case 'week':
                        $data->whereBetween('od.created_at', [
                            \Carbon\Carbon::now()->startOfWeek(),
                            \Carbon\Carbon::now()->endOfWeek()
                        ]);
                        $data2->whereBetween('od.created_at', [
                            \Carbon\Carbon::now()->startOfWeek(),
                            \Carbon\Carbon::now()->endOfWeek()
                        ]);
                        $data3->whereBetween('od.created_at', [
                            \Carbon\Carbon::now()->startOfWeek(),
                            \Carbon\Carbon::now()->endOfWeek()
                        ]);
                        break;
                    case 'month':
                        $data->whereBetween('od.created_at', [
                            \Carbon\Carbon::now()->startOfMonth(),
                            \Carbon\Carbon::now()->endOfMonth()
                        ]);
                        $data2->whereBetween('od.created_at', [
                            \Carbon\Carbon::now()->startOfMonth(),
                            \Carbon\Carbon::now()->endOfMonth()
                        ]);
                        $data3->whereBetween('od.created_at', [
                            \Carbon\Carbon::now()->startOfMonth(),
                            \Carbon\Carbon::now()->endOfMonth()
                        ]);
                        break;
                    case 'quarter':
                        $quarter = ceil(\Carbon\Carbon::now()->month / 3);
                        $start = \Carbon\Carbon::createFromDate(\Carbon\Carbon::now()->year, ($quarter - 1) * 3 + 1, 1)->startOfDay();
                        $end = $start->copy()->addMonths(3)->subSeconds(1)->endOfDay();
                        $data->whereBetween('od.created_at', [$start, $end]);
                        $data2->whereBetween('od.created_at', [$start, $end]);
                        $data3->whereBetween('od.created_at', [$start, $end]);
                        break;
                    case 'ip':
                        $data->whereBetween('od.created_at', [$input['start_date'], $input['end_date']]);
                        $data2->whereBetween('od.created_at', [$input['start_date'], $input['end_date']]);
                        $data3->whereBetween('od.created_at', [$input['start_date'], $input['end_date']]);
                        break;
                }
            }
            $dt = $data2->selectRaw('SUM(od.unit_price) as total_unit_price')->groupBy('od.unit_price')->get();
            $totalUnitPrice = 0;
            foreach ($dt as $key) {
                $totalUnitPrice = $totalUnitPrice + $key->total_unit_price;
            }
            $this->data['totalUnitPrice'] = $totalUnitPrice;
            $this->data['data'] = $data->paginate(20);
            $this->data['data2'] = $data2->selectRaw('SUM(od.unit_price) as total_unit_price, COUNT(DISTINCT u1.name) as buyer_names')->groupBy('od.unit_price')->first();
            $this->data['data3'] = $data3->count();
            $this->data['data4'] = $data4;
            return view('dashboard.managersale', $this->data);
        } else if ($userServ->isSale()) {
            return view('dashboard.sale', $this->data);
        } else if ($userServ->isMod()) {
            return view('dashboard.index', $this->data);
        } else {
            return view('dashboard.member', $this->data);
        }
    }

    public function meDashboard(Request $request)
    {
        $user = Auth::user();
        $query = DB::table('order_details')
            ->join('items', 'order_details.item_id', '=', 'items.id')
            ->where('items.user_id', $user->id)
            ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->whereNotNull('order_details.created_at');
        $input = $request->all();
        if ($request->input('filter')) {
            if ($input['dateF']) {
                $query = $query->where('order_details.created_at', '>=', $input['dateF']);
            }
            if ($input['dateT']) {
                $query = $query->where('order_details.created_at', '<=', date('Y-m-d 23:59:59', strtotime($input['dateT'])));
            }
        } else {
            $query = $query->where('order_details.created_at', '>=', date('Y-m-d', strtotime('-30 days')));
        }
        $results = $query->selectRaw('DATE(order_details.created_at) AS day, sum(order_details.unit_price) AS num')
            ->groupBy(DB::raw('DATE(order_details.created_at)'))
            ->get();
        $chartDataset = [
            'labels' => [],
            'data' => []
        ];
        foreach ($results as $row) {
            $chartDataset['labels'][] = date('d/m', strtotime($row->day));
            $chartDataset['data'][] = $row->num;
        }
        $this->data['chartDataset'] = $chartDataset;

        return view(env('TEMPLATE', '') . 'me.dashboard', $this->data);
    }

    public function feedback(Request $request)
    {
        $this->data['feedbacks'] = Feedback::with('user')->orderby('id', 'desc')->paginate(20);
        // dd($this->data['feedbacks']);
        return view('dashboard.feedback', $this->data);
    }

    public function spm(Request $request)
    {
        $this->data['spms'] = Spm::orderby('id', 'desc')->paginate(20);
        $this->data['columns'] = Schema::getColumnListing('spms');
        $this->data['events'] = Spm::select('event')->distinct()->pluck('event');

        if ($request->input('action') == 'filter') {
            $spmM = new Spm();
            $this->data['spms'] = $spmM->filterSpm($request)->paginate(20);
        }

        return view('dashboard.spm', $this->data);
    }
}
