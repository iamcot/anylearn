<form method="POST">
    @csrf
    <input id="ref" type="hidden" name="ref" value="{{ !empty($user) ? $user->refcode : old('ref') }}" >
    @if(empty($role))
    <div class="form-group row">
        <label for="name" class="col-md-4 col-form-label text-md-right">{{ __('Bạn đăng ký thành') }}</label>
        <div class="col-md-8">
            <div class="special-check @error('role') is-invalid @enderror">
                <div class="form-check form-check-inline pt-2 mr-0">
                    <input class="form-check-input" type="radio" name="role" id="role1" value="member" checked>
                    <label class="form-check-label" for="role1">@lang('Học viên')</label>
                </div>
                <div class="form-check form-check-inline mr-0">
                    <input class="form-check-input" type="radio" name="role" id="role2" value="teacher">
                    <label class="form-check-label" for="role2">@lang('Giảng viên')</label>
                </div>
                <div class="form-check form-check-inline mr-0">
                    <input class="form-check-input" type="radio" name="role" id="role3" value="school">
                    <label class="form-check-label" for="role3">@lang('Trung tâm')</label>
                </div>
            </div>
            @error('role')
            <span class="invalid-feedback" role="alert">
                <strong>{{ $message }}</strong>
            </span>
            @enderror
        </div>
    </div>
    @else
    <input type="hidden" name="role" value="{{ $role }}">
    @endif
    <div class="form-group row">
        <label for="name" class="col-md-4 col-form-label text-md-right" id="label_name">{{ __('Họ và Tên') }} *</label>

        <div class="col-md-8">
            <input id="name" type="text" class="form-control @error('name') is-invalid @enderror" name="name" value="{{ old('name') }}" required autocomplete="name" autofocus>

            @error('name')
            <span class="invalid-feedback" role="alert">
                <strong>{{ $message }}</strong>
            </span>
            @enderror
        </div>
    </div>
    <div class="form-group row">
        <label for="phone" class="col-md-4 col-form-label text-md-right">{{ __('Số điện thoại') }} *</label>

        <div class="col-md-8">
            <input id="phone" type="text" class="form-control @error('phone') is-invalid @enderror" name="phone" value="{{ old('phone') }}" required autocomplete="phone" autofocus>

            @error('phone')
            <span class="invalid-feedback" role="alert">
                <strong>{{ $message }}</strong>
            </span>
            @enderror
        </div>
    </div>

    <div class="form-group row">
        <label for="email" class="col-md-4 col-form-label text-md-right">{{ __('Email') }}</label>

        <div class="col-md-8">
            <input id="email" type="text" class="form-control @error('email') is-invalid @enderror" name="email" value="{{ old('email') }}" autocomplete="email" autofocus>
            @error('email')
            <span class="invalid-feedback" role="alert">
                <strong>{{ $message }}</strong>
            </span>
            @enderror
        </div>
    </div>

    <div class="form-group row">
        <label for="password" class="col-md-4 col-form-label text-md-right">{{ __('Mật khẩu') }} *</label>

        <div class="col-md-8">
            <input id="password" type="password" class="form-control @error('password') is-invalid @enderror" name="password" required autocomplete="new-password">
            <p class="small">@lang('*Tối thiểu 8 ký tự')</p>
            @error('password')
            <span class="invalid-feedback" role="alert">
                <strong>{{ $message }}</strong>
            </span>
            @enderror
        </div>
    </div>

    <div class="form-group row">
        <label for="password-confirm" class="col-md-4 col-form-label text-md-right">{{ __('Nhập lại mật khẩu') }} *</label>

        <div class="col-md-8">
            <input id="password-confirm" type="password" class="form-control" name="password_confirmation" required autocomplete="new-password">
        </div>
    </div>


    <div class="form-group row">
        <div class="col-12 offset-sm-2">
            <div class="form-check form-check-inline">
                <input class="form-check-input" type="checkbox" id="toc" required checked>
                <label class="form-check-label" for="toc">@lang('Tôi đã đọc và đồng ý với <a href="#" id="toc-action" data-url=":url">Điều khoản sử dụng</a>', ['url' => route('ajax.toc')])</label>
            </div>
        </div>
    </div>

    <div class="form-group row mb-0">
        <div class="col-md-8 offset-md-4">
            <button type="submit" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}">
                <i class="fas fa-sign-in-alt"></i> {{ __('Đăng ký') }}
            </button>
            <a href="?has-account=1">@lang('Tôi đã đăng ký')</a>
        </div>
    </div>
    @if(env('LOGIN_3RD_ENABLE', 0))
    <div class="form-group row mb-0">
        <div class="col-md-8 offset-md-4">
            <a class="btn btn-primary mt-2" href="/login/facebook?ref={{ !empty($user) ? $user->refcode : old('ref') }}">
                <i class="fab fa-facebook-f"></i> @lang('Đăng nhập bằng Facebook')
            </a>
        </div>
    </div>
    @endif
</form>

@include('dialog.toc')