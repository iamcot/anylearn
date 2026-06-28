<?php

namespace App\Services;

use App\Constants\ConfigConstants;
use App\Constants\ItemConstants;
use Illuminate\Support\Facades\DB;
use App\Models\Spm;
use Carbon\Carbon;
use Symfony\Component\VarDumper\Cloner\Data;

class J4uServices
{
    public function collect($user)
    {
        $items = [];
        $data = new \stdClass();

        // Get data from search log      
        $searchLogs = Spm::where('user_id', $user->id)
            ->where('spmc', 'search')
            ->distinct('extra')
            ->pluck('extra');
        
        if ($searchLogs) {
            $searcheds = DB::table('items')->join('items_categories as ic', 'ic.item_id', '=', 'items.id');
            
            foreach($searchLogs as $value) {
                $searcheds->orwhere(function($query) use ($value) {
                    $query->where('items.title', 'like', '%' . $value . '%');
                    $query->where('items.status', ItemConstants::STATUS_ACTIVE);
                    $query->where('items.user_status', ItemConstants::USERSTATUS_ACTIVE);
                });
            }

            $items = $searcheds->select(
                    'items.id',   
                    'items.ages_min as minAge',
                    'items.ages_max as maxAge',
                    'items.subtype',
                    'items.price',
                    DB::raw('group_concat(ic.category_id) as categoryIds')
                )
                ->groupBy('items.id')
                ->get()
                ->toArray();
        }

        // Get data from registered items 
        $registereds =  DB::table('orders')
            ->join('order_details as od', 'od.order_id', '=', 'orders.id')        
            ->join('items', 'items.id', '=', 'od.item_id')
            ->join('items_categories as ic', 'ic.item_id', '=', 'items.id')
            ->where('orders.user_id', $user->id)
            ->select(
                'od.item_id as id',   
                'items.ages_min as minAge',
                'items.ages_max as maxAge',
                'items.subtype',
                'items.price',
                DB::raw('group_concat(ic.category_id) as categoryIds')
            )
            ->groupBy('items.id')
            ->get()
            ->toArray();

        $registereds = array_merge($items, $registereds);
            
        $data->categoryIds = [];
        $data->subtypes = [];
        if ($registereds) {
            $data->minAge = $registereds[0]->minAge;
            $data->maxAge = $registereds[0]->maxAge;

            $data->minPrice = $registereds[0]->price;
            $data->maxPrice = $registereds[0]->price;
                
            foreach ($registereds as $item) {
                $data->itemIds[] = $item->id; 
                
                foreach (explode(',', $item->categoryIds) as $id) {
                    if (!in_array($id, $data->categoryIds)) {
                        $data->categoryIds[] = $id;
                    }
                }
                   
                if (!in_array($item->subtype, $data->subtypes)) {
                    $data->subtypes[] = $item->subtype;
                }            
                    
                if (isset($item->minAge) && $item->minAge < $data->minAge) {
                    $data->minAge = $item->minAge;
                }
    
                if (isset($item->maxAge) && $item->maxAge > $data->maxAge) {
                    $data->maxAge = $item->maxAge;
                }

                if ($item->price < $data->minPrice) {
                    $data->minPrice = $item->price;
                }
    
                if ($item->price > $data->maxPrice) {
                    $data->maxPrice = $item->price;
                }
            }
        }
    
        // Get data from dob - subaccounts 
        $dob = DB::table('users')
            ->where('user_id', $user->id)
            ->selectRaw('max(dob) as minAge, min(dob) as maxAge')
            ->groupBy('user_id')
            ->first();     
        
        if ($dob) {
            $dob->minAge = isset($dob->minAge) ? Carbon::now()->diffInYears($dob->minAge) : null;
            $dob->maxAge = isset($dob->maxAge) ? Carbon::now()->diffInYears($dob->maxAge) : null;
            
            if (isset($data->minAge, $dob->minAge) && $dob->minAge < $data->minAge) {
                $data->minAge = $dob->minAge;
            }

            if (isset($data->maxAge, $dob->maxAge) && $dob->minAge < $data->minAge) {
                $data->maxAge = $dob->maxAge;
            }

            if (!isset($data->minAge) && isset($dob->minAge)) {
                $data->minAge = $dob->minAge;
            }

            if (!isset($data->maxAge) && isset($dob->maxAge)) {
                $data->maxAge = $dob->maxAge;
            }  
 
            $data->minAge = isset($data->minAge) ? $data->minAge : 0;
            $data->maxAge = isset($data->maxAge) ? $data->maxAge : 60;
        }

        // Get data from user location
        $data->location = $user->address;

        return $data;
    }

    public function get($user, $subtype = '', $allowIOS = 1) 
    {
        $data = $this->collect($user);
        $data->subtypes = $subtype ? array($subtype) : $data->subtypes; 
        //dd($data);
        
        $items = DB::table('items')
            ->join('items_categories as ic', 'ic.item_id', '=', 'items.id')
            ->join('categories', 'categories.id', '=', 'ic.category_id')
            ->leftjoin(
                DB::raw('(select item_id, avg(value) as rating from item_user_actions where type = "rating" group by(item_id)) as rv'), 
                'rv.item_id',
                'items.id'
            )
            ->whereNull('items.item_id')
            ->where('items.status', ItemConstants::STATUS_ACTIVE)
            ->where('items.user_status', ItemConstants::USERSTATUS_ACTIVE);

        if (!empty($data->categoryIds)) {
            $items->whereIn('ic.category_id', $data->categoryIds);
        }

        if (!empty($data->subtypes)) {
            $items->whereIn('items.subtype', $data->subtypes);
        }

        if (isset($data->minPrice)) {
            $items->where('items.price', '>=', $data->minPrice);
        }

        if(isset($data->maxPrice)) {
            $items->where('items.price', '<=', $data->maxPrice);
        }

        if (isset($data->minAge)) {
            $items->where('items.ages_min', '>=', $data->minAge);
        }

        if(isset($data->maxAge)) {
            $items->where('items.ages_max', '<=', $data->maxAge);
        }

        if (!$allowIOS) {
            $items = $items->whereNotIn('items.subtype', [ItemConstants::SUBTYPE_VIDEO, ItemConstants::SUBTYPE_DIGITAL, ItemConstants::SUBTYPE_ONLINE]);
        }
            
        $items = $items->select(                
            'items.id',
            'items.title',
            'items.image',
            'items.price',
            'items.is_hot',
            'rv.rating',
            'items.boost_score',
            'items.created_at',
            DB::raw('group_concat(categories.title) as categories')
        )
        ->groupBy('items.id')
        ->orderByRaw('items.is_hot desc, items.boost_score desc, items.created_at desc')   
        ->take(ConfigConstants::CONFIG_NUM_ITEM_DISPLAY)
        ->get();
        
        // Location !!

        return $items;
    }
}
