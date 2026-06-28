@extends('auth.layout')
@section('body')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8" style="padding-top:100px;">
            <div class="card shadow">
            <div class="card-header m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}"><i class="fas fa-lock"></i> @lang('Tài khoản đang bị khóa')</div>
                <div class="card-body">
                    <h3>@lang('Xin chào') <strong>{{ session('name') }}</strong>!</h3>
                    <p>@lang('Rất tiếc tài khoản của bạn đang tạm khóa.')</p>
                    <p>@lang('Vui lòng chờ Quản trị viên kiểm tra hoặc liên hệ với chúng tôi.')</p>
                    <a href="{{ route('login') }}">@lang('Đăng nhập lại')</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection