@inject('userServ', 'App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
    resetpassword
@endsection
@section('body')
    <div class="overflow-hidden z-index-1 card">
        <div class="p-0 card-body">
            <div class="h-100 g-0 row">
                <div class="text-white text-center bg-success bg-gradient col-md-5">
                    <div class="position-relative p-4 pt-md-5 pb-md-7">
                        <div class="bg-holder"></div>
                        <div class="z-index-1 position-relative"><a
                                class="link-light mb-4 font-sans-serif fw-bolder fs-4 d-inline-block"><img
                                    src="/cdn/anylearn/img/logo-white.svg" class="img-fluid" alt=""></a>
                            <p class="opacity-75 text-white">Trang đổi mật khẩu là nơi bạn có thể đảm bảo mật khẩu của mình
                                được bảo vệ tốt nhất, vì một mật khẩu an toàn không chỉ là chìa khóa đến sự bảo mật thông
                                tin cá nhân mà còn là nền tảng cho thành công trong hành trình học tập của bạn, giúp bạn
                                truy cập vào các tài nguyên giáo dục quan trọng và đảm bảo rằng thông tin cá nhân của bạn sẽ
                                không bị đánh cắp hoặc bị lộ ra bên ngoài.</p>
                        </div>
                    </div>
                </div>
                <div class="d-flex justify-content-center align-items-center col-md-7">
                    <div class="p-4 p-md-5 flex-grow-1">
                        <h3 class="fw-bold">ĐỔI MẬT KHẨU</h3>
                        <form class="mt-3 text-left" method="POST">
                            @csrf
                            <input type="hidden" name="id" value="{{ !empty($user) ? $user->id : null }}">
                            <div class="mb-3">
                                <label class="form-label">Mật Khẩu Cũ</label>
                                <input placeholder="" name="password" id="password" type="password"
                                    class="form-control @error('password') is-invalid @enderror" value="">
                                @error('password')
                                    <div class="alert alert-danger">{{ $message }}</div>
                                @enderror
                                @if (\Session::has('error'))
                                    <span class="text-danger ml-2">{!! \Session::get('error') !!}</span>
                                @endif
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Mật Khẩu Mới</label><input placeholder="" name="newpassword"
                                    id="newpassword" class="form-control @error('password') is-invalid @enderror"
                                    value="">
                                @error('password')
                                    <div class="alert alert-danger">{{ $message }}</div>
                                @enderror
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Xác Nhận Mật Khẩu</label><input placeholder="" name="repassword"
                                    id="repassword" type="password" class="form-control" value="">
                                @error('password')
                                    <div class="alert alert-danger">{{ $message }}</div>
                                @enderror
                                @if (\Session::has('errormk'))
                                    <span class="text-danger ml-2">{!! \Session::get('errormk') !!}</span>
                                @endif
                                <span id='message'></span>
                            </div>

                            <button name="save" value="save" class="btn btn-success shadow border-0 float-right">
                                <i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('jscript')
    @parent
    <script>
        $('#newpassword, #repassword').on('keyup', function() {
            if ($('#newpassword').val() == $('#repassword').val()) {
                $('#message').html(null);
            } else
                $('#message').html('Mật khẩu không khớp').css('color', 'red');
        });
    </script>
@endsection
