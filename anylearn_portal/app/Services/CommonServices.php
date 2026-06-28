<?php

namespace App\Services;

use App\Constants\ConfigConstants;
use App\Constants\ItemConstants;
use App\Constants\UserConstants;
use App\Models\Ask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CommonServices
{
    public function getLatestQuestion()
    {
        $data = [];
        $question = Ask::where('type', 'question')->orderbyDesc('id')->first();

        if ($question) {
            $data['question'] = $question->content;
            $data['comments'] = Ask::where('ask_id', $question->id)->where('type', 'comment')->get();
            $data['answers'] = Ask::where('ask_id', $question->id)->where('type', 'answer')->get();
        }

        return $data;
    }

    public function getRecommendations($allowIOS = 1)
    {
        $data = DB::table('orders')
            ->join('order_details as od', 'od.order_id', '=', 'orders.id')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->join('items_categories as ic', 'ic.item_id', '=', 'items.id')
            ->join('categories', 'categories.id', '=', 'ic.category_id')
            ->leftjoin(
                DB::raw('(select item_id, avg(value) as rating from item_user_actions where type = "rating" group by(item_id)) as rv'),
                'rv.item_id',
                'items.id'
            )
            ->where('items.status', 1)
            ->where('items.user_status', 1)
            ->select(
                'items.id',
                'items.title',
                'items.image',
                'items.price',
                'items.is_hot',
                'rv.rating',
                DB::raw('max(od.created_at) as created_at'),
                DB::raw('group_concat(categories.title) as categories')
            );
        if (!$allowIOS) {
            $data = $data->whereNotIn('items.subtype', [ItemConstants::SUBTYPE_VIDEO, ItemConstants::SUBTYPE_DIGITAL, ItemConstants::SUBTYPE_ONLINE]);
        }
        return $data->groupBy('items.id')
            ->orderbyRaw('items.is_hot desc, items.boost_score desc')
            ->take(ConfigConstants::CONFIG_NUM_ITEM_DISPLAY)
            ->get();
    }

    public function getRepurchases($user, $subtype = '', $allowIOS = 1)
    {
        $data = DB::table('orders')
            ->join('order_details as od', 'od.order_id', '=', 'orders.id')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->join('items_categories as ic', 'ic.item_id', '=', 'items.id')
            ->join('categories', 'categories.id', '=', 'ic.category_id')
            ->leftjoin(
                DB::raw('(select item_id, avg(value) as rating from item_user_actions where type = "rating" group by(item_id)) as rv'),
                'rv.item_id',
                'items.id'
            )
            ->where('orders.user_id', $user->id)
            ->where('items.status', 1)
            ->where('items.user_status', 1);

        if ($subtype) {
            $data->where('items.subtype', $subtype);
        }

        if (!$allowIOS) {
            $data = $data->whereNotIn('items.subtype', [ItemConstants::SUBTYPE_VIDEO, ItemConstants::SUBTYPE_DIGITAL, ItemConstants::SUBTYPE_ONLINE]);
        }

        return $data->select(
            'items.id',
            'items.title',
            'items.image',
            'items.price',
            'items.is_hot',
            'rv.rating',
            DB::raw('max(od.created_at) as created_at'),
            DB::raw('group_concat(categories.title) as categories')
        )
            ->groupBy('items.id')
            ->orderByRaw('items.is_hot desc, items.price desc')
            ->take(ConfigConstants::CONFIG_NUM_ITEM_DISPLAY)
            ->get();
    }

    public function getSearchResults(Request $request, $searchMap = false, $allowIOS = 1)
    {
        $items = DB::table('items')
            ->join('users', 'users.id', '=', 'items.user_id')
            ->where('items.status', ItemConstants::STATUS_ACTIVE)
            ->where('items.user_status', ItemConstants::USERSTATUS_ACTIVE)
            ->whereNull('items.item_id');

        if (!$allowIOS) {
            $items = $items->whereNotIn('items.subtype', [ItemConstants::SUBTYPE_VIDEO, ItemConstants::SUBTYPE_DIGITAL, ItemConstants::SUBTYPE_ONLINE]);
        }

        if ($request->get('subtype')) {
            $items->where('items.subtype', $request->get('subtype'));
        }

        if ($request->get('category')) {
            $items->join('items_categories as ic', 'ic.item_id', '=', 'items.id');
            $items->where('ic.category_id', $request->get('category'));
        }

        if ($request->get('price')) {
            $items->where('items.price', '<=', $request->get('price'));
        }

        if ($request->get('province')) {
            $items->join('user_locations as ul', 'ul.user_id', '=', 'users.id');
            $items->where('ul.province_code', $request->get('province'));
        }

        if ($request->get('search')) {
            $items->where('items.title', 'like', '%' . $request->get('search') . '%');
        }

        if ($searchMap) {
            if (!$request->get('province')) {
                $items->join('user_locations as ul', 'ul.user_id', '=', 'users.id');
            }
            $items->where('users.role', UserConstants::ROLE_SCHOOL);
            return $items->select(DB::raw('
                    users.id, 
                    users.name,
                    users.image, 
                    users.introduce,
                    group_concat(distinct ul.id) as locations
                '))
                ->groupBy('items.user_id');
        }

        return $items->select(DB::raw('
                users.id, 
                users.name, 
                users.image,
                group_concat(items.id) as itemIds
            '))
            ->groupBy('items.user_id');
    }

    public function calculateMapBounds($locations, $margin = 1)
    {
        $xMax = $xMin = $yMax = $yMin = 0;
        foreach ($locations as $key => $val) {
            $longitude = $val['longitude'];
            $latitude  = $val['latitude'];

            if ($key == 0) {
                $xMin = $longitude;
                $yMin = $latitude;
            }

            if ($longitude > $xMax) {
                $xMax = $longitude;
            }

            if ($longitude < $xMin) {
                $xMin = $longitude;
            }

            if ($latitude > $yMax) {
                $yMax = $latitude;
            }

            if ($latitude < $yMin) {
                $yMin = $latitude;
            }
        }

        return [
            'top' => ($xMin - $margin) . ',' . ($yMax + $margin),
            'bot' => ($xMax + $margin) . ',' . ($yMin - $margin),
        ];
    }

    public function setTemplate($route, $title, $items)
    {
        foreach ($items as $item) {
            $item->categories = array_unique(explode(',', $item->categories));
        }

        return [
            'route' => $route,
            'title' => $title,
            'items' => $items
        ];
    }
}
