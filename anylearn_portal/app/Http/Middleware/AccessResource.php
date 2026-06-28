<?php

namespace App\Http\Middleware;

use App\Constants\UserConstants;
use App\Models\Item;
use App\Models\ItemResource;
use Closure;
use Illuminate\Support\Facades\Auth;

class AccessResource
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {
        $user = Auth::user();
        $resourceId = $request->route()->parameter('id');
        $resourceDb = ItemResource::find($resourceId);
        if (!$resourceDb) {
            return $next($request);
        }
        $itemDb = Item::find($resourceDb->item_id);
        if (!$user->status || !in_array($user->role, UserConstants::$modRoles) && $itemDb->user_id != $user->id) {
            return redirect('/')->with('notify', __('Bạn không có quyền truy xuất dữ liệu này'));
        }
        return $next($request);
    }
}
