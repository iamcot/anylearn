<?php

namespace App\Services;

use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Models\Item;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardServices
{
    private $dateF;
    private $dateT;

    function init($dateF = "", $dateT = "")
    {
        $this->dateF = $dateF;
        $this->dateT = $dateT;
    }

    public function userCount($role = null, $getAll = true, $saleId = 0)
    {
        $users = User::where('is_test', 0)
            ->whereIn('role', UserConstants::$memberRoles)
            ->where('status', 1);
        if ($this->dateF && !$getAll) {
            $users = $users->where('created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $users = $users->where('created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        if ($saleId > 0) {
            $users = $users->where(function ($query) use ($saleId) {
                $query->where('user_id', $saleId)
                    ->orWhere('sale_id', $saleId);
            });
        }
        if (!$role) {
            return $users->count();
        }
        return $users->where('role', $role)->count();
    }
    public function userCountpanert($getAll = true)
    {
        $query = DB::table('order_details')->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->join('items', 'order_details.item_id', '=', 'items.id')
            ->where('items.user_id', auth()->user()->id);
        if ($this->dateF && !$getAll) {
            $query = $query->where('order_details.created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $query = $query->where('order_details.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        return $query->count('order_details.id');
    }
    public function userCountpanertAPI($getAll = true,$users)
    {
        $query = DB::table('order_details')->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->join('items', 'order_details.item_id', '=', 'items.id')
            ->where('items.user_id', $users->id);
        if ($this->dateF && !$getAll) {
            $query = $query->where('order_details.created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $query = $query->where('order_details.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        return $query->count('order_details.id');
    }
    public function itemCount($getAll = true)
    {
        $items = DB::table('items');
        if ($this->dateF && !$getAll) {
            $items = $items->where('created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $items = $items->where('created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        return $items->count();
    }

    public function gmv($getAll = true, $saleId = 0)
    {
        $query = DB::table('orders')->where('orders.status', OrderConstants::STATUS_DELIVERED)
            ->join('order_details', 'order_details.order_id', '=', 'orders.id');
        if ($saleId > 0) {
            $query = $query->leftJoin('users', 'users.id', '=', 'orders.user_id')
                ->where(function ($where) use ($saleId) {
                    $where->where('users.user_id', $saleId)
                        ->orWhere('users.sale_id', $saleId);
                });
        }
        if ($this->dateF && !$getAll) {
            $query = $query->where('orders.created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $query = $query->where('orders.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        return $query->sum('order_details.unit_price');
    }
    public function gmvpartner($getAll = true)
    {
        $query = DB::table('order_details')->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->join('items', 'order_details.item_id', '=', 'items.id')
            ->where('items.user_id', auth()->user()->id);
        if ($this->dateF && !$getAll) {
            $query = $query->where('order_details.created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $query = $query->where('order_details.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        return $query->sum('order_details.unit_price');
    }
    public function gmvpartnerAPI($getAll = true,$users)
    {
        $query = DB::table('orders')->where('orders.status', OrderConstants::STATUS_DELIVERED)
            ->join('order_details', 'order_details.order_id', '=', 'orders.id')
            ->join('items', 'order_details.item_id', '=', 'items.id')
            ->where('items.user_id', $users->id);
        if ($this->dateF && !$getAll) {
            $query = $query->where('orders.created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $query = $query->where('orders.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        return $query->sum('order_details.unit_price');
    }
    public function userCreatedByWeek()
    {
        $last3m = date('Ym', strtotime('-3 month'));

        $sql = "SELECT  yearweek(created_at) AS week, count(*) AS num FROM users
        where created_at is not null
        and yearweek(created_at) >= ?
        group by yearweek(created_at);
        ";

        $results = DB::select($sql, [$last3m]);
        $chartDataset = [
            'labels' => [],
            'data' => []
        ];
        foreach ($results as $row) {
            $year = implode('', array_slice(str_split($row->week), 0, 4));
            $week = implode('', array_slice(str_split($row->week), 4, 2));
            $chartDataset['labels'][] = date('d/m', strtotime($year . 'W' . $week . " +6 days"));
            $chartDataset['data'][] = $row->num;
        }
        return $chartDataset;
    }

    public function userCreatedByDay()
    {
        $query = DB::table('users')
            ->whereNotNull('created_at');
        if ($this->dateF) {
            $query = $query->where('created_at', '>=', $this->dateF);
        } else {
            $query = $query->where('created_at', '>=', date('Y-m-d', strtotime('-30 days')));
        }
        if ($this->dateT) {
            $query = $query->where('created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $results = $query->selectRaw('DATE(created_at) AS day, count(*) AS num')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->get();

        $chartDataset = [
            'labels' => [],
            'data' => []
        ];
        foreach ($results as $row) {
            $chartDataset['labels'][] = date('d/m', strtotime($row->day));
            $chartDataset['data'][] = $row->num;
        }
        return $chartDataset;
    }
    public function revenuechartDataset()
    {
        $query = DB::table('order_details')
            ->whereNotNull('created_at')
            ->where('status', '=', OrderConstants::STATUS_DELIVERED);
        if ($this->dateF) {
            $query = $query->where('created_at', '>=', $this->dateF);
        } else {
            $query = $query->where('created_at', '>=', date('Y-m-d', strtotime('-30 days')));
        }
        if ($this->dateT) {
            $query = $query->where('created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $results = $query->selectRaw('DATE(created_at) AS day, sum(order_details.unit_price) AS num')
            ->groupBy(DB::raw('DATE(created_at)'))
            ->get();

        $chartDataset = [
            'labels' => [],
            'data' => []
        ];
        foreach ($results as $row) {
            $chartDataset['labels'][] = date('d/m', strtotime($row->day));
            $chartDataset['data'][] = $row->num;
        }
        return $chartDataset;
    }
    public function topUser($num = 10)
    {
        $query = DB::table('users')
            ->join('items', 'items.user_id', '=', 'users.id')
            ->leftJoin('order_details AS od', 'od.item_id', '=', 'items.id')
            ->whereIn('users.role', ['school', 'teacher']);
        if ($this->dateF) {
            $query = $query->where('od.created_at', '>=', $this->dateF);
        }
        if ($this->dateT) {
            $query = $query->where('od.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $query = $query->groupBy('users.id')
            ->orderBy('reg_num', 'desc')
            ->select('users.name', DB::raw('count(od.id) AS reg_num'))
            ->take($num)->get();

        return $query;
    }

    public function topItem($num = 10)
    {

        $query = DB::table('items')
            ->leftJoin('order_details AS od', 'od.item_id', '=', 'items.id');
        if ($this->dateF) {
            $query = $query->where('od.created_at', '>=', $this->dateF);
        }
        if ($this->dateT) {
            $query = $query->where('od.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $query = $query->groupBy('items.id')
            ->orderBy('reg_num', 'DESC')
            ->select('items.title', DB::raw('count(od.id) AS reg_num'))
            ->take($num)->get();
        return $query;
    }
    public function topItempartner($num = 10)
    {
        $query = DB::table('items')->where('items.user_id',auth()->user()->id)
            ->leftJoin('order_details AS od', 'od.item_id', '=', 'items.id');
        if ($this->dateF) {
            $query = $query->where('od.created_at', '>=', $this->dateF);
        }
        if ($this->dateT) {
            $query = $query->where('od.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $query = $query->groupBy('items.title')
            ->orderBy('reg_num', 'DESC')
            ->select('items.title', DB::raw('count(od.id) AS reg_num'))
            ->take($num)->get();
        return $query;
    }
    public function topItempartnerAPI($num = 10,$user)
    {
        $query = DB::table('items')->where('items.user_id', $user->id)
            ->leftJoin('order_details AS od', 'od.item_id', '=', 'items.id');
        if ($this->dateF) {
            $query = $query->where('od.created_at', '>=', $this->dateF);
        }
        if ($this->dateT) {
            $query = $query->where('od.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $query = $query->groupBy('items.title')
        ->orderBy('reg_num', 'DESC')
        ->select('items.title', DB::raw('count(od.id) AS reg_num'))
        ->take($num)->get();
        return $query;
    }
    public function saleActivities($saleId, $getAll = true)
    {
        $query = DB::table('users')
            ->join('sale_activities AS sa', function ($join) {
                $join->on('sa.member_id', '=', 'users.id')
                    ->whereIn('sa.type', ['chat', 'call']);
            })
            ->where(function ($where) use ($saleId) {
                $where->where('users.user_id', $saleId)
                    ->orWhere('users.sale_id', $saleId);
            });

        if ($this->dateF && !$getAll) {
            $query = $query->where('sa.created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $query = $query->where('sa.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }

        return $query->selectRaw('count(distinct users.id) AS num')->first()->num;
    }
    public function saleCount($saleId, $getAll = true)
    {
        $query = DB::table('users')
            ->join('orders', function ($join) {
                $join->on('orders.user_id', '=', 'users.id')
                    ->where('orders.status', OrderConstants::STATUS_DELIVERED);
            })
            ->where(function ($where) use ($saleId) {
                $where->where('users.user_id', $saleId)
                    ->orWhere('users.sale_id', $saleId);
            });

        if ($this->dateF && !$getAll) {
            $query = $query->where('orders.created_at', '>=', $this->dateF);
        }
        if ($this->dateT && !$getAll) {
            $query = $query->where('orders.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        return $query->sum('orders.quantity');
    }
    public function saleTopBuyer($saleId, $num = 10)
    {
        $query = DB::table('users')
            ->join('orders', 'orders.user_id', 'users.id')
            ->join('order_details', 'order_details.order_id', '=', 'orders.id')
            ->where(function ($where) use ($saleId) {
                $where->where('users.user_id', $saleId)
                    ->orWhere('users.sale_id', $saleId);
            })
            ->where('orders.status', OrderConstants::STATUS_DELIVERED);

        if ($this->dateF) {
            $query = $query->where('orders.created_at', '>=', $this->dateF);
        }
        if ($this->dateT) {
            $query = $query->where('orders.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $query = $query->groupBy('users.id')
            ->orderBy('gmv', 'desc')
            ->select('users.name', DB::raw('sum(order_details.unit_price) AS gmv'))
            ->take($num)->get();

        return $query;
    }

    public function saleTopItems($saleId, $num = 10)
    {
        $query = DB::table('users')
            ->join('orders', 'orders.user_id', 'users.id')
            ->join('order_details', 'order_details.order_id', '=', 'orders.id')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->where(function ($where) use ($saleId) {
                $where->where('users.user_id', $saleId)
                    ->orWhere('users.sale_id', $saleId);
            })
            ->where('orders.status', OrderConstants::STATUS_DELIVERED);

        if ($this->dateF) {
            $query = $query->where('orders.created_at', '>=', $this->dateF);
        }
        if ($this->dateT) {
            $query = $query->where('orders.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $query = $query->groupBy('items.id')
            ->orderBy('num', 'desc')
            ->select('items.title', DB::raw('count(items.id) AS num'))
            ->take($num)->get();

        return $query;
    }
    public function saleActivitiesByDay($saleId)
    {
        $query = DB::table('sale_activities')
            ->leftjoin('orders', function ($join) {
                $join->on('orders.user_id', '=', 'sale_activities.member_id')
                    ->whereRaw('DATE(sale_activities.created_at) = DATE(orders.created_at)');
            })
            ->leftjoin('order_details', 'order_details.order_id', '=', 'orders.id')
            ->where('sale_activities.sale_id', $saleId);
        if ($this->dateF) {
            $query = $query->where('sale_activities.created_at', '>=', $this->dateF);
        } else {
            $query = $query->where('sale_activities.created_at', '>=', date('Y-m-d', strtotime('-30 days')));
        }
        if ($this->dateT) {
            $query = $query->where('sale_activities.created_at', '<=', date('Y-m-d 23:59:59', strtotime($this->dateT)));
        }
        $results = $query->selectRaw('DATE(sale_activities.created_at) AS day, count(distinct sale_activities.member_id) AS num, IFNULL(SUM(order_details.unit_price), 0) / 1000 AS gmv')
            ->groupBy(DB::raw('DATE(sale_activities.created_at)'))
            ->get();

        $chartDataset = [
            'labels' => [],
            'data' => [],
            'gmv' => []
        ];
        foreach ($results as $row) {
            $chartDataset['labels'][] = date('d/m', strtotime($row->day));
            $chartDataset['data'][] = $row->num;
            $chartDataset['gmv'][] = $row->gmv;
        }
        return $chartDataset;
    }

    public function saleReport()
    {
        $sales = User::where(function ($query) {
            $query->whereIn('role', UserConstants::$saleRoles)
                ->orwhere('id', 1);
        })
            ->where('status', 1)
            ->get();
        $data = [];
        $report = [];
        foreach ($sales as $sale) {
            $reportDB = DB::table('sale_activities AS sa')
                ->where('sa.sale_id', $sale->id)
                ->select(DB::raw('DATE(sa.created_at) AS day'), DB::raw('COUNT(DISTINCT member_id) AS activity'))
                ->groupBy('day')
                ->get();
            // dd($reportDB);
            $tmp = [];
            foreach ($reportDB as $row) {
                $tmp[$row->day] = $row->activity;
            }
            $crrDay = $this->dateF;
            do {
                $data[json_encode(['id' => $sale->id, 'name' => $sale->name])][$crrDay] = isset($tmp[$crrDay]) ? $tmp[$crrDay] : 0;
                $date = date_create($crrDay);
                date_add($date, date_interval_create_from_date_string("1 day"));
                $crrDay =  date_format($date, "Y-m-d");
            } while ($crrDay <= $this->dateT);
        }
        $hasHeader = false;
        foreach ($data as $saleName => $days) {
            if (!$hasHeader) {
                $daysHeader = [];
                foreach (array_keys($days) as $d) {
                    $daysHeader[] = date('d/m', strtotime($d));
                }
                $report[] = array_merge(['Sales'], $daysHeader);
                $hasHeader = true;
            }
            $report[] = [$saleName] + $days;
        }
        // dd($report);
        return $report;
    }
    // public function saleManager()
    // {
    //     $saleManager = explode(',', env('SALE_MANAGER'));
    //     $results = DB::table('order_details as od')
    //         ->select('od.unit_price','od.created_at', 'i.title', 'u1.name as buyer_name', 'u2.name as seller_name')
    //         ->join('items as i', 'od.item_id', '=', 'i.id')
    //         ->join('users as u1', 'od.user_id', '=', 'u1.id')
    //         ->join('users as u2', 'u1.sale_id', '=', 'u2.id')
    //         ->whereIn('u1.sale_id',$saleManager)
    //         ->paginate(20);
    //     // dd($results);
    //     return $results;
    // }
}
