@extends('auth.layout')
<style>
    .bg-card-gradient {
        background-image: linear-gradient(-45deg, #19e2a9, #4695ff);
        background-position: 50%;
    }
</style>
@section('body')
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8" style="padding-top:100px;">
                <div class="card shadow">
                    <div class="card-header font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}"><i
                            class="fas fa-shield-alt"></i> {{ __('Đăng nhập vào') }} {{ env('APP_NAME') }}
                        <a class="btn btn-link font-weight-bold text-success float-right"
                            href="/ref/anylearn?cb={{ urlencode(url()->previous()) }}">@lang('ĐĂNG KÝ')</a>
                    </div>

                    <div class="card-body">

                        @if (session('notify'))
                            <h5 class="text-center text-danger">
                                {{ session('notify') }}
                            </h5>
                        @endif

                        <form method="POST" action="{{ route('login') }}">
                            @csrf
                            <div class="form-group row">
                                <label for="phone"
                                    class="col-md-4 col-form-label text-md-right">{{ __('Số điện thoại') }}</label>

                                <div class="col-md-6">
                                    <input id="phone" type="text"
                                        class="form-control @error('phone') is-invalid @enderror" name="phone"
                                        value="{{ old('phone') }}" required autocomplete="phone" autofocus>

                                    @error('phone')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                </div>
                            </div>

                            <div class="form-group row">
                                <label for="password"
                                    class="col-md-4 col-form-label text-md-right">{{ __('Mật khẩu') }}</label>

                                <div class="col-md-6">
                                    <input id="password" type="password"
                                        class="form-control @error('password') is-invalid @enderror" name="password"
                                        required autocomplete="current-password">

                                    @error('password')
                                        <span class="invalid-feedback" role="alert">
                                            <strong>{{ $message }}</strong>
                                        </span>
                                    @enderror
                                </div>
                            </div>

                            <div class="form-group row">
                                <div class="col-md-6 offset-md-4">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="remember" id="remember"
                                            {{ old('remember') ? 'checked' : '' }}>

                                        <label class="form-check-label" for="remember">
                                            {{ __('Tự động đăng nhập lần sau') }}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group row mb-0">
                                <div class="col-md-8 offset-md-4">
                                    <button type="submit" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}">
                                        <i class="fas fa-sign-in-alt"></i> {{ __('Đăng nhập') }}
                                    </button>

                                    @if (Route::has('password.request'))
                                        <a class="btn btn-link" href="{{ route('password.otp') }}">
                                            {{ __('Quên mật khẩu') }}
                                        </a>
                                    @endif

                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    {{-- <div class="container mt-5">
        <div class="overflow-hidden z-index-1 card">
            <div class="p-0 card-body">
                <div class="h-100 g-0 row">
                    <div class="text-white text-center bg-card-gradient col-md-5">
                        <div class="position-relative p-4 pt-md-5 pb-md-7">
                            <div class="bg-holder bg-auth-card-shape" style="background-image: url('/cdn/img/half.png');">
                            </div>
                            <div class="z-index-1 position-relative light"><a
                                    class="link-light mb-4 font-sans-serif fw-bolder fs-4 d-inline-block text-white"
                                    style="text-decoration: none;" href="/">
                                    <h3>{{ env('APP_NAME') }}</h3>
                                </a>
                                <p class="opacity-75 text-white">Với nền tảng của anyLEARN, giờ đây bạn có thể dễ dàng tìm
                                    kiếm khóa học tốt nhất cho con mình khi bận rộn, trong khi để chúng tôi tìm trường tốt
                                    nhất cho bạn!</p>
                            </div>
                        </div>
                        <div class="mt-3 mb-4 mt-md-4 mb-md-5 light">
                            <p class="text-white">Bạn chưa có tài khoản?<br><a class="text-white text-decoration-underline"
                                    href="/ref/anylearn">Đăng kí ngay!</a></p>
                            <p class="mb-0 mt-4 mt-md-5 fs--1 fw-semi-bold text-white opacity-75">Đọc <a
                                    class="text-decoration-underline text-white" href="/guide?p=guide_toc">các điều
                                    khoản</a> và <a class="text-decoration-underline text-white" href="/privacy">chính sách
                                    của chúng tôi </a></p>
                        </div>
                    </div>
                    <div class="d-flex justify-content-center align-items-center col-md-7">
                        <div class="p-4 p-md-5 flex-grow-1">
                            <h3><i class="fas fa-shield-alt"></i> {{ __('Đăng nhập vào') }} {{ env('APP_NAME') }}</h3>

                            <form class="" action="{{ route('login') }}" method="POST">
                                @if (session('notify'))
                                    <h5 class="text-center text-danger">
                                        {{ session('notify') }}
                                    </h5>
                                @endif
                                <div class="mb-3"><label class="form-label">Số điện thoại</label><input placeholder=""
                                        name="phone" type="text" class="form-control" value=""></div>
                                <div class="mb-3"><label class="form-label">Mật khẩu</label><input placeholder=""
                                        name="password" type="password" class="form-control" value=""></div>
                                <div class="justify-content-between align-items-center row">
                                    <div class="col-auto">
                                        <div class="mb-0 form-check"><input name="remember" type="checkbox" id="remember"
                                                class="form-check-input">
                                                <label for="rememberMe" class="mb-0 text-700 form-check-label">Ghi nhớ đăng nhập</label></div>
                                    </div>
                                    <div class="col-auto">
                                        @if (Route::has('password.request'))
                                            <a class="fs--1 mb-0" href="{{ route('password.otp') }}">
                                                {{ __('Bạn quên mật khẩu?') }}
                                            </a>
                                        @endif
                                    </div>
                                </div>
                                <div>
                                    <button type="submit" class="mt-3 w-100 btn btn-{{ env('MAIN_COLOR', 'primary') }}">
                                        <i class="fas fa-sign-in-alt"></i> {{ __('Đăng nhập') }}
                                    </button>
                                </div>


                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div> --}}
@endsection
