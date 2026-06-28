<?php

namespace App\Http\Middleware;

use Closure;
use Auth;
use Http\Message\Cookie;

class Role
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

        // if (Auth::check()) {
        //     return redirect('login');
        // }
        $user = auth()->user();
        if (!$user->status) {
            return redirect("/");
        }
        $role = $user->role;
        if(in_array($role,["admin","mod","content","sale","fin","fin_partner","sale_content","sale_manager"])){
            return $next($request);
        }
        // if (auth()->user()->role =="admin" || auth()->user()->role =="mod" || auth()->user()->role =="content" ||auth()->user()->role =="sale" ||auth()->user()->role =="fin") {
        //     return $next($request);
        // }
        return redirect('me')->withCookie(cookie('api_token', $user->api_token));
    }
}
