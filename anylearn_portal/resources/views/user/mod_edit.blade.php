@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('rightFixedTop')
<a class="btn btn-sm btn-success" href="{{ route('user.mods.create') }}"><i class="fas fa-plus"></i> @lang('Thêm mới')</a>
@endsection

@section('body')
<form method="POST" autocomplete="one-time-code">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($user) ? $user->id : null }}">
    <div class="card shadow">
        <div class="card-body">
            <div class="col-lg-6">
                <div class="form-group row">
                    <label for="role" class="col-md-4 col-form-label text-md-right">{{ __('Vai trò') }}*</label>
                    <div class="col-md-8">
                        <select class="form-control" name="role" id="role">
                            @foreach($type == 'mod' ? \App\Constants\UserConstants::$modparterRoles : \App\Constants\UserConstants::$memberRoles as $role)
                            <option value="{{ $role }}" {{ !empty($user) && $user->role  == $role ? 'selected' : '' }}>{{ $role }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="name" class="col-md-4 col-form-label text-md-right">{{ __('Họ và tên') }}*</label>
                    <div class="col-md-8">
                        <input id="name" type="text" class="form-control @error('name') is-invalid @enderror" name="name" value="{{ old('name', !empty($user) ? $user->name : '') }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="phone" class="col-md-4 col-form-label text-md-right">{{ __('Số điện thoại') }}*</label>
                    <div class="col-md-8">
                        <input id="phone" type="text" class="form-control @error('phone') is-invalid @enderror" name="phone" value="{{ old('phone', !empty($user) ? $user->phone : '') }}" required>
                        <small>Nếu vai trò là fin_partner, SDT nhập sẽ chỉ là số liên hệ, 1 số ngẫu nhiên sẽ được tạo cho sdt</small>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="omicall_id" class="col-md-4 col-form-label text-md-right">{{ __('Omical Login Id') }}</label>
                    <div class="col-md-8">
                        <input id="omicall_id" type="text" class="form-control @error('omicall_id') is-invalid @enderror" name="omicall_id" value="{{ old('omicall_id', !empty($user) ? $user->omicall_id : '') }}" autocomplete="one-time-code">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="omicall_pwd" class="col-md-4 col-form-label text-md-right">{{ __('Omicall password') }}</label>
                    <div class="col-md-8">
                        <input id="omicall_pwd" type="text" class="form-control @error('omicall_pwd') is-invalid @enderror" name="omicall_pwd" value="{{ old('omicall_pwd', !empty($user) ? $user->omicall_pwd : '') }}" autocomplete="one-time-code">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="email" class="col-md-4 col-form-label text-md-right">{{ __('Email') }}</label>
                    <div class="col-md-8">
                        <input id="email" type="text" class="form-control @error('email') is-invalid @enderror" name="email" value="{{ old('email', !empty($user) ? $user->email : '') }}">
                    </div>
                </div>

                <div class="form-group row">
                    <label for="passwordmod" class="col-md-4 col-form-label text-md-right">{{ __('Mật khẩu') }}</label>
                    <div class="col-md-8">
                        <input id="passwordmod" type="password" class="form-control" name="password" value="" autocomplete="one-time-code">
                        @if(!empty($user))
                        <span class="small">*Để trống nếu không thay đổi/không thiết lập</span>
                        @endif
                    </div>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button name="save" value="save" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </div>
    </div>
</form>
@endsection
