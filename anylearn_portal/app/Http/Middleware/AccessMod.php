<?php

namespace App\Http\Middleware;

use App\Constants\UserConstants;
use Closure;
use Illuminate\Support\Facades\Auth;

class AccessMod
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
        if (!$user->status || !in_array($user->role, UserConstants::$modRoles)) {
            return redirect('/')->with('notify', __('Bạn không có quyền truy xuất dữ liệu này'));
        }
        return $next($request);
    }
}
