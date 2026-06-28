<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;

class ApiUser
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
        $token = $request->get('api_token');
        if (empty($token)) {
            return response('Yêu cầu không hợp lệ', 400);
        }
        $user = User::where('api_token', $token)->first();
        if ($user == null) {
            return response('Thông tin xác thực không hợp lệ', 401);
        }
        if (!$user->status) {
            return response('Tài khoản của bạn đã bị khóa.', 403);
        }
        $request->attributes->add(['_user' => $user]);

        return $next($request);
    }
}
