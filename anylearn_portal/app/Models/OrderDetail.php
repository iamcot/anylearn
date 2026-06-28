<?php

namespace App\Models;

use App\Constants\ItemConstants;
use App\Constants\OrderConstants;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class OrderDetail extends Model
{
    protected $fillable = [
        'user_id', 'item_id', 'unit_price', 'paid_price', 'quanity', 'status', 'order_id', 'created_at'
        , 'item_schedule_plan_id',
    ];

    public function item()
    {
        return $this->belongsTo('App\Models\Item', 'item_id', 'id')->where('status', 1)->where('user_status', 1);
    }

    public function user()
    {
        return $this->belongsTo('App\Models\User', 'user_id', 'id')->where('status', 1);
    }

    public function order()
    {
        return $this->belongsTo('App\Models\Order', 'order_id', 'id');
    }

//@TODO fix lại nếu có item_schedule_plans thì lấy từ đó, ko thì sẽ lấy ngày hiện tại
    public function userRegistered($userId)
    {
        $today = date('Y-m-d');
        $todayTime = date("H:i:s");
        $query = DB::table('order_details AS od')
            ->join('orders', 'orders.id', '=', 'od.order_id')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->join('users', 'users.id', '=', 'orders.user_id') //this join is for main user
            ->join('users AS u2', 'u2.id', '=', 'od.user_id') //this join is for child user
            ->leftjoin('schedules', 'schedules.item_id', '=', 'items.id') // temporary
            ->leftJoin('participations AS pa', function ($join) {
                $join->on('pa.schedule_id', '=', 'od.id')
                    ->on('pa.participant_user_id', '=', 'u2.id');
            })
            ->leftJoin('item_user_actions AS iua', function ($query) {
                $query->whereRaw('iua.item_id = items.id AND iua.user_id = users.id AND iua.type=?', [ItemUserAction::TYPE_RATING]);
            })
            ->leftJoin('item_schedule_plans AS isp', 'isp.id', '=', 'od.item_schedule_plan_id')
            ->leftJoin('item_codes', function ($join) {
                $join->on('items.id', '=', 'item_codes.item_id');
                $join->on('users.id', '=', 'item_codes.user_id');
            })
            ->where('orders.user_id', $userId)
            ->where('items.status', '>', 0)
            ->where('users.status', '>', 0)
            ->where('items.user_status', '>', 0)
            ->select(
                'od.id',
                'items.title',
                'users.name',
                'item_codes.code as item_code',
                DB::raw('ifnull(items.subtype, "") as item_subtype'),
                // 'items.date_start as date',
                // 'items.time_start as time',
                DB::raw("CASE WHEN isp.date_start IS NOT NULL THEN isp.date_start ELSE '". $today ."' END AS date"),
                DB::raw("CASE WHEN isp.time_start IS NOT NULL THEN isp.time_start ELSE '". $todayTime ."' END AS time"),
                'items.time_end',
                DB::raw("'' as schedule_content"),
                'items.short_content as content',
                'pa.id AS user_joined',
                'items.user_status as author_status',
                DB::raw('ifnull(items.location, "") AS location'),
                'items.id as item_id',
                'items.nolimit_time',
                'u2.id AS child_id',
                'u2.name AS child_name',
                // DB::raw('ifnull(items.image, "") AS image'),
                DB::raw('"" AS image'),
                DB::raw('CASE WHEN iua.value IS  NULL THEN 0 ELSE iua.value END AS user_rating')
            )
            ->orderBy('items.date_start')
            ->orderBy('items.time_start');
        $query2 = clone $query;
        // $done = $query->where('items.date_start', '<', $today)->get();
        $done = $query->where('orders.status', OrderConstants::STATUS_DELIVERED)->where(function ($q) {
            $q->whereNotNull('pa.id')
                ->orWhere('items.user_status', '>=', 90)
                ->orWhere('items.status', '>=', 90);
        })->get();
        // $open = $query2->where('items.date_start', '>=', $today)->get();
        $open = $query2->where('orders.status', OrderConstants::STATUS_DELIVERED)
            ->whereNull('pa.id')
            ->where('items.user_status', 1)
            ->get();

        $fav = DB::table('item_user_actions AS iua')
            ->join('items', 'items.id', '=', 'iua.item_id')
            ->leftJoin('order_details AS od', 'od.item_id', '=', 'iua.item_id')
            ->whereNull('od.id')
            ->where('iua.user_id', $userId)
            ->where('items.user_status', '>', 0)
            ->where('iua.type', ItemUserAction::TYPE_FAV)
            ->where('iua.value', ItemUserAction::FAV_ADDED)
            ->select('items.id AS item_id', 'items.subtype as item_subtype', 'items.title', 'items.date_start as date', 'items.time_start as time', 'items.image')
            ->orderBy('iua.id', 'desc')
            ->get();
        $openModify = [];
        foreach ($open as $event) {
            if ($event->item_subtype == 'online') {
                $tmpEventContent = json_decode($event->schedule_content, true);
                $tmpEventContent['url'] = empty($tmpEventContent['url']) ? "" : $tmpEventContent['url'];
                $tmpEventContent['info'] = empty($tmpEventContent['info']) ? "" : $tmpEventContent['info'];
                $event->schedule_content = json_encode($tmpEventContent);
            } else if ($event->schedule_content == null) {
                $event->schedule_content = "";
            }

            $openModify[] = $event;
        }
        $doneModify = [];
        foreach ($done as $event) {
            if ($event->item_subtype == 'online') {
                $tmpEventContent = json_decode($event->schedule_content, true);
                $tmpEventContent['url'] = empty($tmpEventContent['url']) ? "" : $tmpEventContent['url'];
                $tmpEventContent['info'] = empty($tmpEventContent['info']) ? "" : $tmpEventContent['info'];
                $event->schedule_content = json_encode($tmpEventContent);
            } else if ($event->schedule_content == null) {
                $event->schedule_content = "";
            }
            $doneModify[] = $event;
        }
        return [
            'done' => $doneModify,
            'open' => $openModify,
            'fav' => $fav,
        ];
    }
    public function usersOrders($userId)
    {
        $query = DB::table('order_details')
            ->join('orders', 'orders.id', '=', 'order_details.order_id')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->join('users', 'users.id', '=', 'orders.user_id')
            ->join('users AS u2', 'u2.id', '=', 'order_details.user_id') //this join is for child user
            ->leftjoin('item_schedule_plans as schedules', 'schedules.item_id', '=', 'order_details.item_id')
            ->leftJoin('participations AS pa', function ($join) {
                $join->on('pa.schedule_id', '=', 'schedules.id')
                    ->on('pa.participant_user_id', '=', 'u2.id');
            })
            ->leftJoin('item_user_actions AS iua', function ($query) {
                $query->whereRaw('iua.item_id = items.id AND iua.user_id = users.id AND iua.type=?', [ItemUserAction::TYPE_RATING]);
            })
            ->where('order_details.status', 'delivered')
            ->where('users.id', $userId)
            // ->orWhere('users.id', $userId)
            // ->where('users.is_child',1)
            ->select(
                'order_details.id',
                'order_details.item_id',
                'order_details.created_at',
                'items.title',
                'items.user_status',
                'items.status',
                'items.date_end',
                'users.name',
                DB::raw('ifnull(items.subtype, "") as item_subtype'),
                'items.date_start as date',
                'items.time_start as time',
                'items.time_end',
                DB::raw("'' as schedule_content"),
                'items.short_content as content',
                'pa.id AS user_joined',
                'items.user_status as author_status',
                DB::raw('ifnull(items.location, "") AS location'),
                'items.id as item_id',
                'items.nolimit_time',
                'u2.id AS child_id',
                'u2.name AS child_name',
                // DB::raw('ifnull(items.image, "") AS image'),
                DB::raw('"" AS image'),
                DB::raw('CASE WHEN iua.value IS  NULL THEN 0 ELSE iua.value END AS user_rating')
            )
            ->orderBy('order_details.created_at', 'desc');
        // dd($query->get());
        $result = $query->distinct()->where('orders.status', OrderConstants::STATUS_DELIVERED)->get();
        return $result;
    }
    public function searchall($userId, $title)
    {
        $query = DB::table('order_details')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->join('users AS u2', 'u2.id', '=', 'order_details.user_id') //this join is for child user
            ->join('schedules', 'schedules.item_id', '=', 'order_details.item_id')
            ->leftJoin('participations AS pa', function ($join) {
                $join->on('pa.schedule_id', '=', 'schedules.id')
                    ->on('pa.participant_user_id', '=', 'u2.id');
            })
            ->leftJoin('item_user_actions AS iua', function ($query) {
                $query->whereRaw('iua.item_id = items.id AND iua.user_id = users.id AND iua.type=?', [ItemUserAction::TYPE_RATING]);
            })
            ->where('items.title', 'Like', '%' . $title . '%')
            ->where('order_details.user_id', $userId)
            ->orWhere('users.is_child', $userId)
            ->select(
                'schedules.id',
                'items.title',
                'items.date_end',
                'users.name',
                DB::raw('ifnull(items.subtype, "") as item_subtype'),
                'schedules.date as date',
                'schedules.time_start as time',
                'schedules.time_end',
                'schedules.content as schedule_content',
                'items.short_content as content',
                'pa.id AS user_joined',
                'items.user_status as author_status',
                DB::raw('ifnull(items.location, "") AS location'),
                'items.id as item_id',
                'items.nolimit_time',
                'u2.id AS child_id',
                'u2.name AS child_name',
                // DB::raw('ifnull(items.image, "") AS image'),
                DB::raw('"" AS image'),
                DB::raw('CASE WHEN iua.value IS  NULL THEN 0 ELSE iua.value END AS user_rating')
            )
            ->orderBy('schedules.date')
            ->orderBy('schedules.time_start');

        $query2 = clone $query;
        // $done = $query->where('items.date_start', '<', $today)->get();
        $done = $query->whereNotNull('pa.id')->get();
        // $open = $query2->where('items.date_start', '>=', $today)->get();
        $open = $query2->whereNull('pa.id')->get();

        $openModify = [];
        foreach ($open as $event) {
            if ($event->item_subtype == 'online') {
                $tmpEventContent = json_decode($event->schedule_content, true);
                $tmpEventContent['url'] = empty($tmpEventContent['url']) ? "" : $tmpEventContent['url'];
                $tmpEventContent['info'] = empty($tmpEventContent['info']) ? "" : $tmpEventContent['info'];
                $event->schedule_content = json_encode($tmpEventContent);
            } else if ($event->schedule_content == null) {
                $event->schedule_content = "";
            }

            $openModify[] = $event;
        }
        $doneModify = [];
        foreach ($done as $event) {
            if ($event->item_subtype == 'online') {
                $tmpEventContent = json_decode($event->schedule_content, true);
                $tmpEventContent['url'] = empty($tmpEventContent['url']) ? "" : $tmpEventContent['url'];
                $tmpEventContent['info'] = empty($tmpEventContent['info']) ? "" : $tmpEventContent['info'];
                $event->schedule_content = json_encode($tmpEventContent);
            } else if ($event->schedule_content == null) {
                $event->schedule_content = "";
            }
            $doneModify[] = $event;
        }
        return [
            'done' => $doneModify,
            'open' => $openModify,
        ];
        return $query;
    }
    public function searchparents($userId, $title)
    {
        $query = DB::table('order_details')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->join('users AS u2', 'u2.id', '=', 'order_details.user_id') //this join is for child user
            ->join('schedules', 'schedules.item_id', '=', 'order_details.item_id')
            ->leftJoin('participations AS pa', function ($join) {
                $join->on('pa.schedule_id', '=', 'schedules.id')
                    ->on('pa.participant_user_id', '=', 'u2.id');
            })
            ->leftJoin('item_user_actions AS iua', function ($query) {
                $query->whereRaw('iua.item_id = items.id AND iua.user_id = users.id AND iua.type=?', [ItemUserAction::TYPE_RATING]);
            })
            // ->where('items.status', '>', 0)
            // ->where('users.status', '>', 0)
            // ->where('items.user_status', '>', 0)
            ->where('items.title', 'Like', '%' . $title . '%')
            ->where('order_details.user_id', $userId)
            ->select(
                'schedules.id',
                'items.title',
                'items.date_end',
                'users.name',
                DB::raw('ifnull(items.subtype, "") as item_subtype'),
                'schedules.date as date',
                'schedules.time_start as time',
                'schedules.time_end',
                'schedules.content as schedule_content',
                'items.short_content as content',
                'pa.id AS user_joined',
                'items.user_status as author_status',
                DB::raw('ifnull(items.location, "") AS location'),
                'items.id as item_id',
                'items.nolimit_time',
                'u2.id AS child_id',
                'u2.name AS child_name',
                // DB::raw('ifnull(items.image, "") AS image'),
                DB::raw('"" AS image'),
                DB::raw('CASE WHEN iua.value IS  NULL THEN 0 ELSE iua.value END AS user_rating')
            )
            ->orderBy('schedules.date')
            ->orderBy('schedules.time_start');

        $query2 = clone $query;
        // $done = $query->where('items.date_start', '<', $today)->get();
        $done = $query->whereNotNull('pa.id')->get();
        // $open = $query2->where('items.date_start', '>=', $today)->get();
        $open = $query2->whereNull('pa.id')->get();

        $openModify = [];
        foreach ($open as $event) {
            if ($event->item_subtype == 'online') {
                $tmpEventContent = json_decode($event->schedule_content, true);
                $tmpEventContent['url'] = empty($tmpEventContent['url']) ? "" : $tmpEventContent['url'];
                $tmpEventContent['info'] = empty($tmpEventContent['info']) ? "" : $tmpEventContent['info'];
                $event->schedule_content = json_encode($tmpEventContent);
            } else if ($event->schedule_content == null) {
                $event->schedule_content = "";
            }

            $openModify[] = $event;
        }
        $doneModify = [];
        foreach ($done as $event) {
            if ($event->item_subtype == 'online') {
                $tmpEventContent = json_decode($event->schedule_content, true);
                $tmpEventContent['url'] = empty($tmpEventContent['url']) ? "" : $tmpEventContent['url'];
                $tmpEventContent['info'] = empty($tmpEventContent['info']) ? "" : $tmpEventContent['info'];
                $event->schedule_content = json_encode($tmpEventContent);
            } else if ($event->schedule_content == null) {
                $event->schedule_content = "";
            }
            $doneModify[] = $event;
        }
        return [
            'done' => $doneModify,
            'open' => $openModify,
        ];
        return $query;
    }
}
