@inject('userServ', 'App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
user_edit
@endsection
@section('body')
<form method="POST" enctype="multipart/form-data">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($user) ? $user->id : null }}">
    <div class="card">
        <div class="bg-light card-body">
            <div class="mb-2">
                <label class="form-label" for="firstName">{{ __('Tên Doanh nghiệp*') }}</label>
                <input placeholder="Họ và tên*" name="name" type="text" id="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name', !empty($user) ? $user->name : '') }}" required>
            </div>
            <div class="mb-2">
                <label class="form-label" for="title">{{ __('Người đại diện') }}</label>
                <input placeholder="Người đại diện" name="title" type="text" id="title" class="form-control @error('title') is-invalid @enderror" value="{{ old('title', !empty($user) ? $user->title : '') }}">
            </div>
            <div class="mb-2">
                <label class="form-label" for="phone">{{ __('Số điện thoại đăng ký') }} (Để thay đổi SĐT đăng ký, vui lòng liên hệ hotline anyLEARN)</label>
                <input placeholder="Phone" class="form-control" name="phone" value="{{ $user->phone }}" required readonly>
            </div>
            <div class="mb-2">
                <label class="form-label" for="email">{{ __('Email') }}</label>
                <input placeholder="Email" name="email" type="email" id="email" class="form-control @error('email') is-invalid @enderror" value="{{ old('email', !empty($user) ? $user->email : '') }}">
            </div>
            <div class="mb-2">
                <label class="form-label" for="refcode">{{ __('Mã giới thiệu') }}</label>
                <input placeholder="Mã giới thiệu" name="refcode" type="text" id="refcode" class="form-control @error('refcode') is-invalid @enderror" value="{{ old('refcode', !empty($user) ? $user->refcode : '') }}" required>
            </div>
            <hr>
            <div class="mb-2">
                <label class="form-label" for="business_certificate">{{ __('Số CNĐKDN') }}</label>
                <input placeholder="{{ __('Số CNĐKDN') }}" name="business_certificate" type="text" id="business_certificate" class="form-control @error('business_certificate') is-invalid @enderror" value="{{ old('business_certificate', !empty($user) ? $user->business_certificate : '') }}" required>
            </div>
            <div class="mb-2">
                <label class="form-label" for="first_issued_date">{{ __('Ngày cấp lần đầu') }}</label>
                <input placeholder="{{ __('Ngày cấp lần đầu') }}" name="first_issued_date" type="date" id="first_issued_date" class="form-control @error('first_issued_date') is-invalid @enderror" value="{{ old('first_issued_date', !empty($user) ? $user->first_issued_date : '') }}" required>
            </div>
            <div class="mb-2">
                <label class="form-label" for="issued_by">{{ __('Cấp bởi') }}</label>
                <input placeholder="{{ __('Cấp bởi') }}" name="issued_by" type="text" id="issued_by" class="form-control @error('issued_by') is-invalid @enderror" value="{{ old('issued_by', !empty($user) ? $user->issued_by : '') }}" required>
            </div>
            <div class="mb-2">
                <label class="form-label" for="headquarters_address">{{ __('Địa Chỉ Trụ sở') }}</label>
                <input placeholder="{{ __('Địa Chỉ') }}" name="headquarters_address" type="text" id="headquarters_address" class="form-control @error('headquarters_address') is-invalid @enderror" value="{{ old('headquarters_address', !empty($user) ? $user->headquarters_address : '') }}" required>
            </div>
            <hr>
            <div class="mb-2">
                <label class="form-label" for="image">{{ __('Ảnh Đại Diện') }}</label>
                <input name="image" type="file" id="image" class="form-control @error('image') is-invalid @enderror" value="{{ old('image', !empty($user) ? $user->image : '') }}">
                <br>
                @if ($user->image)
                <img src="{{ $user->image }}" alt="" style="height: 50px;">
                @endif
            </div>
            <div class="mb-2">
                <label class="form-label" for="banner">{{ __('Ảnh bìa') }}</label>
                <input name="banner" type="file" id="banner" class="form-control @error('banner') is-invalid @enderror" value="{{ old('banner', !empty($user) ? $user->banner : '') }}">
                <br>
                @if ($user->banner)
                <img src="{{ $user->banner }}" alt="" style="height: 50px;">
                @endif
            </div>


            <div class="mb-3">
                <ul class="nav nav-tabs" id="i18ntab" role="tablist">
                    @foreach (App\Models\I18nContent::$supports as $locale)
                    <li class="nav-item" role="presentation">
                        <button class="nav-link {{ $locale == App\Models\I18nContent::DEFAULT ? 'active' : '' }}" id="{{ $locale }}-tab" data-toggle="tab" data-bs-toggle="tab" data-target="#{{ $locale }}box" data-bs-target="#{{ $locale }}box" type="button" role="tab" aria-controls="{{ $locale }}" aria-selected="{{ $locale == App\Models\I18nContent::DEFAULT ? 'true' : 'false' }}">{{ $locale }}</button>
                    </li>
                    @endforeach
                </ul>
                <div class="tab-content" id="i18ntabContent">
                    @foreach (App\Models\I18nContent::$supports as $locale)
                    <div class="p-3 tab-pane fade {{ $locale == App\Models\I18nContent::DEFAULT ? 'show active' : '' }}" id="{{ $locale }}box" role="tabpanel" aria-labelledby="{{ $locale }}-tab">
                        <div class="form-group row">
                            <label for="introduce" class="form-label">{{ __('Giới Thiệu Ngắn (Bio)') }}
                                [{{ $locale }}]</label>
                            <div class="col-md-12">
                                <textarea name="introduce[{{ $locale }}]" class="_editor form-control">{{ old('introduce', !empty($user) ? $user->introduce[$locale] : '') }}</textarea>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="editor{{ $locale }}" class="form-label @error('full_content') is-invalid @enderror">{{ __('Thông tin giới thiệu') }}
                                [{{ $locale }}]</label>
                            <div class="col-md-12">
                                <textarea class="editor" id="editor{{ $locale }}" name="full_content[{{ $locale }}]">{{ old('full_content', !empty($user) ? $user->full_content[$locale] : '') }}</textarea>
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>
        <div class="card-footer text-center">
            <button name="save" value="save" class="btn btn-success rounded-pill shadow border-0"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </div>
    </div>
</form>

@endsection
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
</script>
@endsection