<?php

namespace App\Http\Controllers\Auth;

use App\Constants\UserConstants;
use App\Http\Controllers\Controller;
use Illuminate\Foundation\Auth\AuthenticatesUsers;
use App\Models\User;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;


class LoginController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Login Controller
    |--------------------------------------------------------------------------
    |
    | This controller handles authenticating users for the application and
    | redirecting them to your home screen. The controller uses a trait
    | to conveniently provide its functionality to your applications.
    |
    */

    use AuthenticatesUsers;

    /**
     * Where to redirect users after login.
     *
     * @var string
     */
    protected $redirectTo = '/admin';

    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('guest')->except('logout');
        $this->middleware('encrypt.cookie');
    }

    public function showLoginForm(Request $request)
    {
        $urlNext = $request->get('cb') ? $request->get('cb') : url()->previous();
        $request->session()->flash('cb', $urlNext);

        return view('auth.login');
    }

    public function username()
    {
        return 'phone';
    }

    /**
     * Redirect the user to the Facebook authentication page.
     *
     * @return \Illuminate\Http\Response
     */
    public function redirectToProvider(Request $request, $provider)
    {
        if ($request->get('ref')) {
            session(['ref' => $request->get('ref')]);
        }
        return Socialite::driver($provider)->redirect();
    }

    /**
     * Obtain the user information from Facebook.
     *
     * @return \Illuminate\Http\Response
     */
    public function handleFacebookCallback()
    {
        $user = Socialite::driver('facebook')->user();
        $existsUser = User::where('3rd_id', $user->id)->first();
        if (!$existsUser) {
            $data = [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->id,
                'role' => UserConstants::ROLE_MEMBER,
                'password' => $user->email,
                'ref' => session('ref', null) ?? null,
            ];
            $userModel = new User();
            $existsUser = $userModel->createNewMember($data);
            if ($existsUser) {
                User::find($existsUser->id)->update([
                    '3rd_id' => $user->id,
                    '3rd_type' => User::LOGIN_3RD_FACEBOOK,
                    '3rd_token' => $user->token,
                    'image' => $user->avatar,
                ]);
            }
        }
        Auth::login($existsUser);
        return redirect()->route('refpage', ['code' => session('ref', null)]);
    }

    protected function authenticated(Request $request, $user)
    {   
        if ($user->status == UserConstants::STATUS_INACTIVE) {
            $name = $user->name;
            $this->guard()->logout();
            $request->session()->invalidate();
            return redirect()->intended('/inactive')->with('name', $name);
        }
        //$userM = new User();
        //return redirect($userM->redirectToUpdateDocs());

        $userService = new UserServices();
        if (empty($user->api_token)) {
            $saveToken = User::find($user->id)->update(
                ['api_token' => hash('sha256', Str::random(60))]
            );
            if (!$saveToken) {
                return response('Không thể hoàn tất xác thực', 500);
            }
        }
        Cookie::queue(Cookie::forever('api_token', $user->api_token, null, null, false, false));
        if ($userService->isMod()) {
            return redirect('/admin');
        } else if ($user->role == UserConstants::ROLE_SCHOOL || $user->role == UserConstants::ROLE_TEACHER) {
            return redirect('/me');
        } else if ($request->session()->get('cb')) {
            return redirect()->to($request->session()->get('cb'));
        } else {
            return redirect('/');
        }
    }

    public function logout(Request $request)
    {
        Auth::guard()->logout();
        return redirect('/')->withCookie(Cookie::forget('api_token'));
    }
}
