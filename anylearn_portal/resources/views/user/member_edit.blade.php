@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('rightFixedTop')
<form class="row pt-4">
    <div class="col-xs-2 mr-1 text-success">
        <div>
            <div>Ví M: {{ number_format($user->wallet_m, 0, ',', '.') }}</div>
            <div>Ví C: {{ number_format($user->wallet_c, 0, ',', '.') }}</div>
        </div>

    </div>
    <div class="col-xs-2 mr-1">
        <a class="btn btn-primary" id="moneyfix-action" href="#"><i class="fas fa-comments-dollar"></i> @lang('Giao dịch tiền')</a>
    </div>
</form>
@endsection

@section('body')
@if(!$userServ->isSale() || @auth()->user()->role == App\Constants\UserConstants::ROLE_SALE_CONTENT)
<form method="POST" enctype="multipart/form-data">
    @csrf
@endif

    <input type="hidden" name="id" value="{{ !empty($user) ? $user->id : null }}">
    <div class="card shadow">
        <div class="card-body">
            <div class="">
                <div class="form-group row">
                    <label for="name" class="col-md-2 col-form-label text-md-right">{{ __('Họ và tên') }}</label>
                    <div class="col-md-8">
                        <input id="name" type="text" class="form-control @error('name') is-invalid @enderror" name="name" value="{{ old('name', !empty($user) ? $user->name : '') }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="name" class="col-md-2 col-form-label text-md-right">{{ __('Mã giới thiệu') }}</label>
                    <div class="col-md-8">
                        <input id="name" type="text" class="form-control @error('refcode') is-invalid @enderror" name="refcode" value="{{ old('refcode', !empty($user) ? $user->refcode : '') }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="title" class="col-md-2 col-form-label text-md-right">{{ __('Chức danh/Đại diện') }}</label>
                    <div class="col-md-8">
                        <input id="title" type="text" class="form-control @error('title') is-invalid @enderror" name="title" value="{{ old('title', !empty($user) ? $user->title : '') }}">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="phone" class="col-md-2 col-form-label text-md-right">{{ __('Số điện thoại') }}</label>
                    <div class="col-md-8">
                        <input id="phone" type="text" class="form-control @error('phone') is-invalid @enderror" name="phone" value="{{ old('phone', !empty($user) ? $user->phone : '') }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="boost_score" class="col-md-2 col-form-label text-md-right">{{ __('Boost Score') }}</label>
                    <div class="col-md-8">
                        <input id="boost_score" type="text" class="form-control @error('boost_score') is-invalid @enderror" name="boost_score" value="{{ old('boost_score', !empty($user) ? $user->boost_score : '') }}">
                        <small>Số càng lớn càng được ưu tiên</small>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="sale_priority" class="col-md-2 col-form-label text-md-right">{{ __('Độ ưu tiên') }}</label>
                    <div class="col-md-8">
                        <select name="sale_priority" id="sale_priority" class="form-control">
                            @foreach($priorityLevels as $key => $prio)
                                <option value="{{ $key }}" {{ ( !empty($user) && $user->sale_priority == $key) ? "selected" : "" }}>{{ strtoupper($prio) }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="user_id" class="col-md-2 col-form-label text-md-right">{{ __('ID người giới thiệu') }}</label>
                    <div class="col-md-8">
                        <input id="user_id" type="text" class="form-control @error('user_id') is-invalid @enderror" name="user_id" value="{{ old('user_id', !empty($user) ? $user->user_id : '') }}">
                        <small>Có thể tham khảo ID ngoài danh sách thành viên.</small>
                    </div>
                </div>  
                <div class="form-group row">
                    <label class="col-md-2 col-form-label text-md-right">{{ __('G/T người bán:') }}</label>
                    <div class="col-md-8 py-2">
                        <div class="form-check-inline">
                            <input class="form-check-input" type="radio" name="get_ref_seller" value="1" {{ !empty($user) && $user->get_ref_seller == 1 ? 'checked' : '' }}>
                            <label class="form-check-label">Cho phép</label>
                        </div>
                        <div class="form-check-inline">
                            <input class="form-check-input" type="radio" name="get_ref_seller" value="0" {{ !empty($user) && $user->get_ref_seller == 0 ? 'checked' : '' }}>
                            <label class="form-check-label">Không</label>
                        </div><br>
                        <small class='text-warning'>Cho phép user nhận hoa hồng từ việc giới thiệu người bán.</small>
                    </div>
                </div>           
                @if($userServ->haveAccess(Auth::user()->role, 'user.sale'))
                <div class="form-group row">
                    <label for="sale_id" class="col-md-2 col-form-label text-md-right">{{ __('ID Sale chăm sóc') }}</label>
                    <div class="col-md-8">
                        <input id="sale_id" type="text" class="form-control @error('sale_id') is-invalid @enderror" name="sale_id" value="{{ old('sale_id', !empty($user) ? $user->sale_id : '') }}">
                        <small>Có thể tham khảo ID ngoài danh sách nhân viên.</small>
                    </div>
                </div>
                @endif
                <div class="form-group row">
                    <label for="email" class="col-md-2 col-form-label text-md-right">{{ __('Email') }}</label>
                    <div class="col-md-8">
                        <input id="email" type="text" class="form-control @error('email') is-invalid @enderror" name="email" value="{{ old('email', !empty($user) ? $user->email : '') }}">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="address" class="col-md-2 col-form-label text-md-right">{{ __('Address') }}</label>
                    <div class="col-md-8">
                        <input id="address" type="text" class="form-control @error('address') is-invalid @enderror" name="address" value="{{ old('address', !empty($user) ? $user->address : '') }}">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="commission_rate" class="col-md-2 col-form-label text-md-right">{{ __('Tỉ lệ hoa hồng') }}</label>
                    <div class="col-md-8">
                        <input id="commission_rate" type="text" class="form-control @error('commission_rate') is-invalid @enderror" name="commission_rate" value="{{ old('commission_rate', !empty($user) ? $user->commission_rate : '') }}" required>
                        <small>Tỉ lệ thành viên sẽ được nhận về từ doanh thu. Dạng thập phân</small>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="role" class="col-md-2 col-form-label text-md-right">{{ __('Vai trò') }}</label>
                    <div class="col-md-8">
                        <select class="form-control" name="role" id="role">
                            @foreach($type == 'mod' ? \App\Constants\UserConstants::$modRoles : \App\Constants\UserConstants::$memberRoles as $role)
                            <option value="{{ $role }}" {{ !empty($user) && $user->role  == $role ? 'selected' : '' }}>{{ $role }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="is_signned" class="col-md-2 col-form-label text-md-right">{{ __('Trạng thái hợp đồng') }}</label>
                    <div class="col-md-8">
                        <select class="form-control" name="is_signed" id="is_signned">
                            @foreach([0 => 'ĐÃ HUỶ',1 => 'MỚI',10 => 'THÀNH VIÊN KÝ',99 => 'CÔNG TY DUYỆT'] as $k => $status)
                            <option value="{{ $k }}" {{ !empty($user) && $user->is_signed  == (int)$k ? 'selected' : '' }}>{{ $status }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="password" class="col-md-2 col-form-label text-md-right">{{ __('Mật khẩu') }}</label>
                    <div class="col-md-8">
                        <input id="password" type="password" class="form-control" name="password" value="" {{ empty($user) ? 'required' : '' }} autocomplete="one-time-code">
                        @if(!empty($user))
                        <span class="small">*Để trống nếu không thay đổi</span>
                        @endif
                    </div>
                </div>
                <div class="form-group row">
                    <label for="phone" class="col-md-2 col-form-label text-md-right">{{ __('Avatar') }}</label>
                    <div class="col-md-4">
                        <input name="image" type="file" id="image" />
                    </div>
                    <div class="col-md-4">
                        @if($user->image)
                        <img src="{{ $user->image }}" alt="" style="height: 50px;">
                        @endif
                    </div>
                </div>
                <div class="form-group row">
                    <label for="phone" class="col-md-2 col-form-label text-md-right">{{ __('Banner') }}</label>
                    <div class="col-md-4">
                        <input name="banner" type="file" id="image" />
                    </div>
                    <div class="col-md-4">
                        @if($user->banner)
                        <img src="{{ $user->banner }}" alt="" style="height: 50px;">
                        @endif
                    </div>
                </div>
                <ul class="nav nav-tabs" id="i18ntab" role="tablist">
                    @foreach (App\Models\I18nContent::$supports as $locale)
                        <li class="nav-item" role="presentation">
                            <button
                                class="nav-link {{ $locale == App\Models\I18nContent::DEFAULT ? 'active' : '' }}"
                                id="{{ $locale }}-tab" data-toggle="tab" data-bs-toggle="tab"
                                data-target="#{{ $locale }}box"
                                data-bs-target="#{{ $locale }}box" type="button" role="tab"
                                aria-controls="{{ $locale }}"
                                aria-selected="{{ $locale == App\Models\I18nContent::DEFAULT ? 'true' : 'false' }}">{{ $locale }}</button>
                        </li>
                    @endforeach
                </ul>
                <div class="tab-content" id="i18ntabContent">
                    @foreach (App\Models\I18nContent::$supports as $locale)
                        <div class="p-3 tab-pane fade {{ $locale == App\Models\I18nContent::DEFAULT ? 'show active' : '' }}"
                            id="{{ $locale }}box" role="tabpanel"
                            aria-labelledby="{{ $locale }}-tab">
                            <div class="form-group row">
                                <label for="introduce"
                                    class="col-md-3 col-form-label text-md-right ">{{ __('Giới Thiệu Ngắn (Bio)') }}
                                    [{{ $locale }}]</label>
                                <div class="col-md-8">
                                    <textarea name="introduce[{{ $locale }}]" class="_editor form-control">{{ old('introduce', !empty($user) ? $user->introduce[$locale] : '') }}</textarea>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="editor"
                                    class="col-md-3 col-form-label @error('full_content') is-invalid @enderror">{{ __('Thông tin giới thiệu') }}
                                    [{{ $locale }}]</label>
                                <div class="col-md-8">
                                    <textarea class="editor" id="editor{{ $locale }}" name="full_content[{{ $locale }}]">{{ old('full_content', !empty($user) ? $user->full_content[$locale] : '') }}</textarea>
                                </div>
                            </div>
                        </div>
                    @endforeach
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button name="save" value="save" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </div>
    </div>
    @if(!$userServ->isSale() || @auth()->user()->role == App\Constants\UserConstants::ROLE_SALE_CONTENT)
</form>
@endif
@endsection
@include('dialog.money_fix')
@section('jscript')
@parent
<script src="/cdn/vendor/ckeditor5/ckeditor.js"></script>
<script>
    var allEditors = document.querySelectorAll('.editor');
    var editorConfig = {
        mediaEmbed: {
                previewsInData: true
            },
        simpleUpload: {
            uploadUrl: "{{ @route('upload.ckimage5') }}",
            withCredentials: true,
            headers: {
                'X-CSRF-TOKEN': "{{ csrf_token() }}",
            }
        }
    };
    for (var i = 0; i < allEditors.length; ++i) {
        ClassicEditor.create(allEditors[i], editorConfig)
        .catch(error => {
            console.log(error);
        });
    }
    
    $('#moneyfix-action').click(function() {
        $('#moneyFixModal').modal('show');
    });
</script>
@endsection
