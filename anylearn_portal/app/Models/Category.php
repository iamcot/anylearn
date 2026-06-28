<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class Category extends Model
{
    protected $table = 'categories';

    protected $fillable = ['title', 'url', 'status'];

    public function buildCatWithItems(Request $request, $catId)
    {
        $configM = new Configuration();
        $isEnableIosTrans = $configM->enableIOSTrans($request);

        $categoriesDB = $this->where('status', 1)->get();
        $categories = [];
        $i = 0;
        foreach ($categoriesDB as $cat) {
            $products = [];
            if ($catId === null) {
                $products = DB::table('items')
                    ->join('items_categories', 'items_categories.item_id', '=', 'items.id')
                    ->where('items_categories.category_id', $cat->id)
                    ->whereNotIn("items.user_id", $isEnableIosTrans == 0 ? explode(',', env('APP_REVIEW_DIGITAL_SELLERS', '')) : [])
                    ->where('items.status', 1)
                    ->select('items.id', 'items.image', 'items.title')
                    ->take(2)
                    ->get();
            } else if ($catId == 0 && $i++ == 0) {
                $products = DB::table('items')
                    ->join('items_categories', 'items_categories.item_id', '=', 'items.id')
                    ->whereNotIn("items.user_id", $isEnableIosTrans == 0 ? explode(',', env('APP_REVIEW_DIGITAL_SELLERS', '')) : [])
                    ->where('items_categories.category_id', $cat->id)
                    ->where('items.status', 1)
                    ->select('items.id', 'items.image', 'items.title')
                    ->paginate();
            } else if ($catId > 0 && $catId == $cat->id) {
                $products = DB::table('items')
                    ->join('items_categories', 'items_categories.item_id', '=', 'items.id')
                    ->whereNotIn("items.user_id", $isEnableIosTrans == 0 ? explode(',', env('APP_REVIEW_DIGITAL_SELLERS', '')) : [])
                    ->where('items_categories.category_id', $catId)
                    ->where('items.status', 1)
                    ->select('items.id', 'items.image', 'items.title')
                    ->paginate();
            }

            if ($catId === null) {
                if (count($products) > 0) {
                    $cat->items = $products;
                    $categories[] = $cat;
                }
            } else {
                $cat->items = $products;
                $categories[] = $cat;
            }
        }
        return $categories;
    }
}
