<?php

namespace App\Http\Middleware;

use App\Models\I18nContent;
use Closure;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;

class Localization
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
        if ($request->has('language')) {
            if (!in_array($request->get('language'), I18nContent::$supports)) {
                return $next($request);
            }
            if (Auth::check()) {
                Auth::user()->language = $request->get('language');
                Auth::user()->save();
                App::setLocale($request->get('language'));
                Session::put('locale', $request->get('language'));
            } else {
                Session::put('locale', $request->get('language'));
                App::setLocale($request->get('language'));
            }
            return redirect()->back();
        } elseif (auth()->user()) {
            App::setLocale(auth()->user()->language);
            Session::put('locale', auth()->user()->language);
        } else {
            if (Session::has('locale')) {
                App::setLocale(Session::get('locale'));
            }
        }
        // dd(Session::get('locale'));  
        return $next($request);
    }
}
