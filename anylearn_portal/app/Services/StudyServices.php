<?php 

namespace App\Services;

use App\Constants\ItemConstants;
use App\Constants\OrderConstants;
use Carbon\Carbon;
use DateTime;
use Illuminate\Support\Facades\DB;

class StudyServices 
{
    public function getSchedulePlans($userID, $dateFrom , $dateTo) 
    {
        $dateFrom = Carbon::parse($dateFrom);
        $dateTo = Carbon::parse($dateTo);

        $items = $this->queryRegisteredItems($userID);
        $this->applyStatusFilter($items, ItemConstants::STATUS_ONGOING, $dateFrom);

        $plans = [];
        foreach ($items->get() as $key => $val) {
            $current = Carbon::parse($val->date_start); 
            $current = $current < $dateFrom ? clone $dateFrom : $current; 

            $dateEnd = Carbon::parse($val->date_end);
            $dateEnd = $dateEnd > $dateTo ? $dateTo : $dateEnd;

            while ($current <= $dateEnd) {              
                if (in_array($current->dayOfWeek + 1, explode(',', $val->weekdays))) {
                    $plans[(clone $current)->format('Y-m-d')][] = $val;
                }
                $current->addDay();
            }
        }

        return $plans;
    }

    public function getSchedulePlansForDay($user, $date = null) 
    {
        $date = isset($date) ? Carbon::parse($date) : Carbon::now();
        $items = $this->queryRegisteredItems($user);
        $this->applyStatusFilter($items, ItemConstants::STATUS_ONGOING, $date);
        return $items->whereRaw('FIND_IN_SET(?, sp.weekdays)', [1 + $date->dayOfWeek])->get();
    }

    public function getRegisteredItemInfo($userID, $orderItemID)
    {
        $items = $this->queryRegisteredItems($userID);
        $items->join('users AS u1', 'u1.id', '=', 'items.user_id'); 
        $items->join('users AS u2', 'u2.id', '=', 'od.user_id');
        $items->leftJoin('item_user_actions AS ua', function($join) {
            $join->on('ua.user_id', '=', 'orders.user_id');
            $join->on('ua.item_id', '=', 'od.item_id')
               ->where('ua.type', '=', 'fav');
        });

        $items->leftJoin('item_codes AS ic', 'ic.order_detail_id', '=', 'od.id');
        $items->where('od.id', $orderItemID);
        $items->addSelect(
            'u1.id AS author_id',
            'u1.name AS author',
            'u2.name AS student',
            'ic.code AS activation_info',
            'ua.value AS favorited',
            'sp.weekdays',
            'sp.time_start',
            'sp.time_end',
            'sp.title AS plan',
            'sp.info AS plan_info',
            DB::raw('
                (SELECT COUNT(*) FROM item_user_actions 
                WHERE item_id = od.item_id AND type = "rating"
                ) AS reviews'
            ),
        );

        return $items->first();
    }

    public function getRegisteredItems($user, $status) 
    {
        $items = $this->queryRegisteredItems($user);
        $this->applyStatusFilter($items, $status);
        return $items->get();
    }

    private function applyStatusFilter($items, $status = 'ALL', $date = null) 
    {
        if (ItemConstants::STATUS_ONGOING == $status) {
            $date = isset($date) ? Carbon::parse($date) : Carbon::now();
            $this->applyOngoingFilter($items, $date->format('Y-m-d'));
        } elseif (ItemConstants::STATUS_UPCOMING == $status) {
            $this->applyUpcomingFilter($items);
        } elseif (ItemConstants::STATUS_COMPLETED == $status) {
            $this->applyCompletedFilter($items);
        }
    }

    private function applyOngoingFilter($items, $date) 
    {         
        $items->join('users AS u1', 'u1.id', '=', 'items.user_id'); 
        $items->join('users AS u2', 'u2.id', '=', 'od.user_id');
        $items->leftJoin('user_locations AS ul', 'ul.id', '=', 'sp.user_location_id');
        $items->whereIn('items.subtype', ItemConstants::CONFIRMABLE_SUBTYPES);
        $items->whereDate('sp.date_end', '>=', $date);
        $items->where(function ($query) {
            $query->orWhere('pa.organizer_confirm', 1);
            $query->orWhere('pa.participant_confirm', 1); 
        });
        $items->addSelect(
            'u1.name AS author',
            'u2.name AS student',
            'sp.weekdays',
            'sp.time_start',
            'sp.time_end',
            'sp.title AS plan',
            'sp.info AS plan_info',
            DB::raw('CONCAT(ul.address, " ,", ul.ward_path) AS location'),
        );
    }

    private function applyUpcomingFilter($items) 
    {
        $items->where(function ($query) {   
            $query->orWhere(function ($q) {
                $q->whereIn('items.subtype', ItemConstants::CONFIRMABLE_SUBTYPES);
                $q->whereNull('od.item_schedule_plan_id');
            });
            $query->orWhere(function ($q) {
                $q->whereIn('items.subtype', ItemConstants::CONFIRMABLE_SUBTYPES);
                $q->whereDate('sp.date_end', '>', Carbon::now()->format('Y-m-d'));
            });    
            $query->orWhere(function ($q) {
                $q->whereIn('items.subtype', ItemConstants::UNCONFIRMABLE_SUBTYPES);
                $q->whereDate('orders.created_at', '>', Carbon::now()->subDays(7)->format('Y-m-d'));
            });
        });
    }

    private function applyCompletedFilter($items) 
    {
        $items->where(function ($query) {    
            $query->orWhere(function ($q) {
                $q->whereIn('items.subtype', ItemConstants::CONFIRMABLE_SUBTYPES);
                $q->whereDate('sp.date_end', '<', Carbon::now()->format('Y-m-d'));
            });
            $query->orWhere(function ($q) {
                $q->whereIn('items.subtype', ItemConstants::UNCONFIRMABLE_SUBTYPES);
                $q->whereDate('orders.created_at', '<=', Carbon::now()->subDays(7)->format('Y-m-d'));
            });
        });
    }

    private function queryRegisteredItems($user)
    {        
        $items = DB::table('orders')
            ->join('order_details AS od', 'od.order_id', '=', 'orders.id')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->leftJoin('participations AS pa', 'pa.schedule_id', '=', 'od.id')
            ->leftJoin('item_schedule_plans AS sp', 'sp.id', '=', 'od.item_schedule_plan_id')
            ->where('orders.status', OrderConstants::STATUS_DELIVERED) 
            ->where('orders.user_id', $user->is_child ? $user->user_id : $user->id)
            ->select( 
                'items.id',
                'items.title',
                'items.image',
                'items.subtype',
                'pa.organizer_confirm',
                'pa.participant_confirm',
                'sp.date_start',
                'sp.date_end',
                'od.id AS order_item_id',
                'od.user_id',
                'orders.created_at AS purchased_at', 
                DB::raw('
                    (SELECT ROUND(AVG(value), 1) FROM item_user_actions 
                    WHERE item_id = od.item_id AND type = "rating"
                    ) AS rating'
                ),
            )
            ->orderByDesc('od.created_at');
        
        
        if ($user->is_child) {
            $items->where('od.user_id', $user->id);
        } 

        return $items;
    }
}