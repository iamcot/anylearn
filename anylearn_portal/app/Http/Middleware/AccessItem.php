<?php

namespace App\Http\Middleware;

use App\Constants\UserConstants;
use App\Models\Item;
use Closure;
use Illuminate\Support\Facades\Auth;

class AccessItem
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
        $itemId = $request->route()->parameter('id');
        $itemDb = Item::find($itemId);
        if (!$user->status || !in_array($user->role, UserConstants::$modRoles) && $itemDb->user_id != $user->id) {
            return redirect('/')->with('notify', __('Bạn không có quyền truy xuất dữ liệu này'));
        }
        return $next($request);
    }
}
