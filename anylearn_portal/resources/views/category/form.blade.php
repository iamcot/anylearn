@extends('layout')
@section('body')
<form method="POST">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($category) ? $category->id : null }}">
    <div class="card shadow">
        <div class="card-body">
            {{-- @foreach(App\Models\I18nContent::$supports as $locale)
            <div class="form-group">
                <label for="title{{ $locale }}" class="col-md-2 col-form-label text-md-right">{{ __('Tên chuyên mục')}}[{{ $locale }}]</label>
                    <input id="title{{ $locale }}" type="text" class="form-control" name="title[{{ $locale }}]" value="{{ old('title', !empty($category) ? $category->title : '') }}">
                </div>
            </div>
            @endforeach --}}
            {{-- <ul class="nav nav-tabs" id="i18ntab" role="tablist">
                @foreach(App\Models\I18nContent::$supports as $locale)
                <li class="nav-item" role="presentation">
                    <button class="nav-link {{ $locale == App\Models\I18nContent::DEFAULT ? 'active':'' }}" id="{{ $locale }}-tab" data-toggle="tab" data-bs-toggle="tab" data-target="#{{ $locale }}box" data-bs-target="#{{ $locale }}box" type="button" role="tab" aria-controls="{{ $locale }}" aria-selected="{{ $locale == App\Models\I18nContent::DEFAULT ? 'true': 'false' }}">{{ $locale }}</button>
                </li>
                @endforeach
            </ul> --}}
            <div class="tab-content" id="i18ntabContent">
                @foreach(App\Models\I18nContent::$supports as $locale)
                {{-- <div class="p-3 tab-pane fade {{ $locale == App\Models\I18nContent::DEFAULT ? 'show active':'' }}" id="{{ $locale }}box" role="tabpanel" aria-labelledby="{{ $locale }}-tab"> --}}
                    <div class="form-group row">
                        <label for="title{{ $locale }}" class="col-md-3 col-form-label text-md-right ">{{ __('Tên chuyên mục') }} [{{ $locale }}]</label>
                        <div class="col-md-8">
                            <input id="title{{ $locale }}" type="text" class="form-control" name="title[{{ $locale }}]" value="{{ old('title', !empty($category) ? $category->title[$locale] : '') }}" required>
                        </div>
                    </div>

                {{-- </div> --}}
                @endforeach
            </div>
        </div>

        <div class="card-footer">
            <button name="save" value="save" class="btn btn-primary }}"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </div>
    </div>
</form>
@endsection
