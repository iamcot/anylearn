<?php

namespace App\Http\Middleware;

use Closure;

class CheckTemplate
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
        return env('TEMPLATE_VERSION', 2) == 3 ? response(view('anylearn3.index')) : $next($request);
    }
}
