@inject('userServ', 'App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
user_edit
@endsection
<style>
    .bg-holder {
        position: absolute;
        width: 100%;
        min-height: 100%;
        top: 0;
        left: 0;
        background-size: cover;
        background-position: 50%;
        overflow: hidden;
        will-change: transform, opacity, filter;
        backface-visibility: hidden;
        background-repeat: no-repeat;
        z-index: 0;
        background-image: url("{{ $user->banner }}");
    }
</style>
@section('body')
<form method="POST" enctype="multipart/form-data">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($user) ? $user->id : null }}">
    <div class="card">
        <div class="bg-light card-body">
            <div class="mb-2">
                <label class="form-label" for="firstName">{{ __('Họ và tên*') }}</label>
                <input placeholder="Họ và tên*" name="name" type="text" id="name" class="form-control @error('name') is-invalid @enderror" value="{{ old('name', !empty($user) ? $user->name : '') }}" required>
            </div>
            <div class="mb-2">
                <label class="form-label" for="dob">{{ __('Ngày sinh') }}</label>
                <input placeholder="Ngày sinh" name="dob" type="date" id="dob" class="form-control @error('dob') is-invalid @enderror" value="{{ old('dob', !empty($user) ? $user->dob : '') }}" required>
            </div>
            <div class="mb-2">
                <label class="form-label" for="email">{{ __('Email') }}</label>
                <input placeholder="Email" name="email" type="email" id="email" class="form-control @error('email') is-invalid @enderror" value="{{ old('email', !empty($user) ? $user->email : '') }}">
            </div>
            <div class="mb-2">
                <label class="form-label" for="phone">{{ __('Số điện thoại') }}</label>
                <input placeholder="Phone" name="phone" type="text" id="phone" class="form-control @error('phone') is-invalid @enderror" value="{{ old('phone', !empty($user) ? $user->phone : '') }}" required>
            </div>
            <div class="mb-2">
                <label class="form-label" for="cmnd/cccd">{{ __('CMND/CCCD') }}</label>
                <input placeholder="CMND/CCCD" name="cert_id" type="text" id="cert_id" class="form-control @error('cert_id') is-invalid @enderror" value="{{ old('cert_id', !empty($user) ? $user->cert_id : '') }}">
            </div>
            <div class="mb-2">
                <label class="form-label" for="refcode">{{ __('Mã giới thiệu') }}</label>
                <input placeholder="Mã giới thiệu" name="refcode" type="text" id="refcode" class="form-control @error('refcode') is-invalid @enderror" value="{{ old('refcode', !empty($user) ? $user->refcode : '') }}" required>
            </div>
            <div class="mb-2">
                <label for="name" class="form-label">{{ __('Giới tính') }}</label>

                <div class="row">
                    <div class="col-md-2">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" value="male" name="sex" id="male" <?php if (empty($user->sex) || $user->sex == 'male') {
                                                                                                                echo "checked='checked'";
                                                                                                            } ?>>
                            <label class="form-check-label" for="male">
                                {{ __('Nam') }}
                            </label>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" value="female" name="sex" id="female" <?php if (!empty($user->sex) && $user->sex == 'female') {
                                                                                                                    echo "checked='checked'";
                                                                                                                } ?>>
                            <label class="form-check-label" for="female">
                                {{ __('Nữ') }}
                            </label>
                        </div>
                    </div>
                    <div class="col-md-2">
                        <div class="form-check">
                            <input class="form-check-input" type="radio" value="other" name="sex" id="other" <?php if (!empty($user->sex) && $user->sex == 'other') {
                                                                                                                    echo "checked='checked'";
                                                                                                                } ?>>
                            <label class="form-check-label" for="other">
                                {{ __('Khác') }}
                            </label>
                        </div>
                    </div>
                </div>
            </div>

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
            <div class="mb-2">
                <label class="form-label" for="address">{{ __('Địa Chỉ') }}</label>
                <input placeholder="{{ __('Địa Chỉ') }}" name="address" type="text" id="address" class="form-control @error('address') is-invalid @enderror" value="{{ old('address', !empty($user) ? $user->address : '') }}">
            </div>

            <div class="mb-2">
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