<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class WebAppAuth
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
        $userAgent = $request->header('User-Agent');

        if ($userAgent == "anylearn-app") {

            $token = $request->header('token') ?? $request->get('api_token');
            $user = User::where('api_token', $token)->first();
            $request->attributes->add(['_user' => $user]);
            return $next($request);
        }

        if (Auth::check()) {
            return $next($request);
        } else {
            return redirect()->route('login');
        }
    }
}
