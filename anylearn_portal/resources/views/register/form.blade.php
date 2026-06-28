@extends('register.layout')
@section('body')
    <div class="row register">
        @if (!isset($isReg))
            <div class="col-12 introduce text-center">
                @yield('introduce')
            </div>
            <div class="col-12 register_form">
                <h2 class="text-light text-center">@yield('header1')</h2>
                <br>
                <h5 class="text-light text-center">@yield('header2')</h5>
                @if (env('LOGIN_3RD_ENABLE', 0))
                    <div class="text-center">
                        <a class="btn btn-primary mt-2 text-center border shadow"
                            href="/login/facebook?ref={{ !empty($user) ? $user->refcode : old('ref') }}">
                            <i class="fab fa-facebook-f"></i></a>
                    </div>
                    <br>
                    <p class="text-light text-center">@lang('--- HOẶC ---')</p>
                @endif
                <div class="col-12 p1 text-light">
                    <form method="POST" id="register_form">
                        @csrf
                        <input id="ref" type="hidden" name="ref"
                            value="{{ !empty($user) ? $user->refcode : old('ref') }}">
                        <input type="hidden" name="role" value="{{ $role }}">
                        <input id="sale_id" type="hidden" name="sale_id" value="{{ request('s') }}">

                        @if (request('r') != 'school')
                            <div class="my-1">
                                <div class="form-group row">
                                    <label for="name" class="col-md-4 col-form-label text-md-end"
                                        id="label_name">{{ __('Họ và tên') }} *</label>
                                    <div class="col-md-8">
                                        <input id="name" type="text"
                                            class="form-control @error('name') is-invalid @enderror" name="name"
                                            value="{{ old('name') }}" required autocomplete="name" autofocus>
                                        @error('name')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="phone"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Số điện thoại') }} *</label>
                                    <div class="col-md-8">
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
                                    <label for="email" class="col-md-4 col-form-label text-md-end">{{ __('Email') }}
                                        *</label>
                                    <div class="col-md-8">
                                        <input id="email" type="text"
                                            class="form-control @error('email') is-invalid @enderror" name="email"
                                            value="{{ old('email') }}" autocomplete="email" autofocus>
                                        @error('email')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="password" class="col-md-4 col-form-label text-md-end">{{ __('Mật khẩu') }}
                                        *</label>
                                    <div class="col-md-8">
                                        <input id="password" type="password"
                                            class="form-control @error('password') is-invalid @enderror" name="password"
                                            required autocomplete="new-password">
                                        <!--p class="small">@lang('*Tối thiểu 8 ký tự')</p-->
                                        @error('password')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="password-confirm"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Nhập lại mật khẩu') }} *</label>

                                    <div class="col-md-8">
                                        <input id="password-confirm" type="password" class="form-control"
                                            name="password_confirmation" required autocomplete="new-password">
                                    </div>
                                </div>
                            </div>
                        @else
                            <div class="my-2 ">
                                <h6 class="mb-2">{{ __('Thông tin tài khoản:') }}</h6>
                                <div class="form-group row">
                                    <label for="name" class="col-md-4 col-form-label text-md-end"
                                        id="label_name">{{ __('Tên doanh nghiệp') }} *</label>
                                    <div class="col-md-8">
                                        <input id="name" type="text"
                                            class="form-control @error('name') is-invalid @enderror" name="name" 
                                            placeholder="Tên trên giấy CNĐKDN" value="{{ old('name') }}" required autocomplete="name" autofocus>
                                        @error('name')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="phone"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Số điện thoại') }} *</label>
                                    <div class="col-md-8">
                                        <input id="phone" type="text"
                                            class="form-control @error('phone') is-invalid @enderror" name="phone"
                                            value="{{ old('phone') }}" required autocomplete="phone">
                                        @error('phone')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="email" class="col-md-4 col-form-label text-md-end">{{ __('Email') }}
                                        *</label>
                                    <div class="col-md-8">
                                        <input id="email" type="text"
                                            class="form-control @error('email') is-invalid @enderror" name="email"
                                            value="{{ old('email') }}" autocomplete="email">
                                        @error('email')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="password"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Mật khẩu') }} *</label>
                                    <div class="col-md-8">
                                        <input id="password" type="password"
                                            class="form-control @error('password') is-invalid @enderror" name="password"
                                            required autocomplete="new-password" minlength="8">
                                        @error('password')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="password-confirm"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Nhập lại mật khẩu') }}
                                        *</label>
                                    <div class="col-md-8">
                                        <input id="password-confirm" type="password" class="form-control"
                                            name="password_confirmation" required autocomplete="new-password">
                                    </div>
                                </div>
                            </div>
                            <div class="my-4">
                                <h6 class="mb-2">{{ __('Thông tin doanh nghiệp:') }}</h6>
                                <div class="form-group row">
                                    <label for="title" class="col-md-4 col-form-label text-md-end">{{ __('Người đại diện') }}
                                        *</label>
                                    <div class="col-md-8">
                                        <input id="title" type="text"
                                            class="form-control @error('title') is-invalid @enderror" name="title"
                                            value="{{ old('title') }}" autocomplete="off" required>
                                        @error('title')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="business_certificate"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Số CNĐKDN') }} *</label>
                                    <div class="col-md-8">
                                        <input id="business_certificate" type="text"
                                            class="form-control @error('business_certificate') is-invalid @enderror"
                                            name="business_certificate" value="{{ old('business_certificate') }}"
                                            autocomplete="off" required>
                                        @error('business_certificate')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="first_issued_date"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Ngày cấp lần đầu') }} *</label>
                                    <div class="col-md-8">
                                        <input id="first_issued_date" type="date"
                                            class="form-control datepicker @error('first_issued_date') is-invalid @enderror"
                                            name="first_issued_date" value="{{ old('first_issued_date') }}"
                                            autocomplete="off" required>
                                        @error('first_issued_date')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>

                                <div class="form-group row">
                                    <label for="issued_by"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Cấp bởi') }} *</label>
                                    <div class="col-md-8">
                                        <input id="issued_by" type="text"
                                            class="form-control @error('issued_by') is-invalid @enderror"
                                            name="issued_by" value="{{ old('issued_by') }}" autocomplete="off"
                                            required>
                                        @error('issued_by')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                                <div class="form-group row">
                                    <label for="headquarters_address"
                                        class="col-md-4 col-form-label text-md-end">{{ __('Địa chỉ trụ sở') }} *</label>
                                    <div class="col-md-8">
                                        <input id="headquarters_address" type="text"
                                            class="form-control @error('headquarters_address') is-invalid @enderror"
                                            name="headquarters_address" value="{{ old('headquarters_address') }}"
                                            autocomplete="off" required>
                                        @error('headquarters_address')
                                            <span class="invalid-feedback" role="alert">
                                                <strong>{{ $message }}</strong>
                                            </span>
                                        @enderror
                                    </div>
                                </div>
                            </div>
                        @endif

                        <div class="form-group row">
                            <div class="text-center">
                                <div class="form-check form-check-inline">
                                    <input class="form-check-input" type="checkbox" id="toc" required checked>
                                    <label class="form-check-label" for="toc">@lang('Tôi đã đọc và đồng ý với <a href="/guide?p=guide_toc" id="toc-action" data-url=":url">Điều khoản sử dụng</a>', ['url' => route('ajax.toc')])</label>
                                </div>
                            </div>
                        </div>
                        <div class="form-group row mb-0">
                            <div class="text-center">
                                <div class="register_btn">
                                    <button onclick="this.disabled=true;this.value='Đang gửi...'; this.form.submit();">
                                        @if (Session::get('locale') == null || Session::get('locale') == 'vi')
                                            <img src="/cdn/img/register/register_btn.png" alt="">
                                        @else
                                            <img src="/cdn/img/register/register_btn_en.png" alt="">
                                        @endif
                                    </button>
                                </div>
                                <a href="{{ url()->full() }}&has-account=1">@lang('Tôi đã đăng ký')</a>
                            </div>
                        </div>
                    </form>
                </div>
            @else
                <div class="col-lg-6 offset-lg-3 register_form">
                    <div class="row p1 text-center" style="margin-top:100px;">
                        <h5 class="text-light text-center">@lang('Bạn vừa hoàn thành đăng ký tài khoản trên anyLEARN, hãy tải ứng dụng về máy và bắt đầu trải nghiệm!')</h5>
                        <div class="col-md-6" style="padding: 30px;">
                            <a href="itms-apps://apps.apple.com/vn/app/anylearn/id6453411038">
                                <img src="/cdn/onepage/images/ios.png" style="width:100%" alt="">
                            </a>
                        </div>
                        <div class="col-md-6" style="padding: 30px;">
                            <a href="market://details?id=vn.anylearn">
                                <img src="/cdn/onepage/images/android.png" style="width:100%" alt="">
                            </a>
                        </div>
                        <p>
                        <form action="{{ route('logout') }}" method="POST" class="text-center">
                            {{ csrf_field() }}
                            <a href="/"><i class="fa fa-home"></i> @lang('Về trang chủ')</a> <button
                                class="btn btn-{{ env('MAIN_COLOR', 'primary') }}"
                                type="submit">@lang('Đăng xuất')</button>
                        </form>
                        </p>
                    </div>
        @endif
    </div>
    </div>
@section('jscript')
    <script>
        $(document).ready(function() {
            $('.datepicker').datepicker({
                format: 'yyyy-mm-dd', // Định dạng ngày tháng
                autoclose: true, // Tự động đóng DatePicker sau khi chọn ngày
                todayHighlight: true // Làm nổi bật ngày hiện tại trong DatePicker
            });
        });
    </script>
@endsection
@endsection
@include('dialog.toc')
