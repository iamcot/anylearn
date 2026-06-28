@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')

<div class="card mb-3 shadow">
    <div class="card-header  font-weight-bold">Thông tin giới thiệu</div>
    <div class="card-body">

        <ul class="nav nav-tabs" id="i18ntab" role="tablist">
            @foreach (App\Models\I18nContent::$supports as $locale)
            <li class="nav-item" role="presentation">
                <button class="nav-link {{ $locale == App\Models\I18nContent::DEFAULT ? 'active' : '' }}" id="{{ $locale }}-tab" data-toggle="tab" data-bs-toggle="tab" data-target="#{{ $locale }}box" data-bs-target="#{{ $locale }}box" type="button" role="tab" aria-controls="{{ $locale }}" aria-selected="{{ $locale == App\Models\I18nContent::DEFAULT ? 'true' : 'false' }}">{{ $locale }}</button>
            </li>
            @endforeach
        </ul>
        <div class="tab-content border-0" id="i18ntabContent">
            @foreach (App\Models\I18nContent::$supports as $locale)
            <div class="p-3 tab-pane fade {{ $locale == App\Models\I18nContent::DEFAULT ? 'show active' : '' }}" id="{{ $locale }}box" role="tabpanel" aria-labelledby="{{ $locale }}-tab">
                @if ($locale != App\Models\I18nContent::DEFAULT)
                <div class="form-group">
                    <label for="title{{ $locale }}" class="col-form-label font-weight-bold">{{ __('Tiêu đề') }}
                        [{{ $locale }}]</label>
                    <div class="">
                        <input id="title{{ $locale }}" type="text" class="form-control" name="title[{{ $locale }}]" value="{{ old('title', !empty($course) ? $course['info']->title[$locale] : '') }}">
                    </div>
                </div>
                @endif

                <div class="form-group ">
                    <label for="short_content" class="col-form-label font-weight-bold">{{ __('Thông tin tóm tắt') }}
                        [{{ $locale }}]</label>
                    <div class="">
                        <textarea name="short_content[{{ $locale }}]" class="form-control">{{ old('short_content', !empty($course) ? $course['info']->short_content[$locale] : '') }}</textarea>
                    </div>
                </div>
                @foreach(App\Services\ItemServices::$CONTENT_FIELDS as $type => $name)
                @include('class.form.content_box', ['boxType' => $type, 'boxName' => $name, 'locale' => $locale, 'data' => !empty($course['info']->content[$locale][$type]) ? $course['info']->content[$locale][$type] : ''])
                @endforeach

            </div>
            @endforeach

        </div>
    </div>
</div>
<div class="text-center mb-3">
    <a href="javascript:changeTab('price-tab')" class="btn btn-primary border-0 rounded">
        << Sửa Học phí</a>
            <button class="btn btn-success border-0 rounded" name="tab" value="contenttab"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
            <a href="javascript:changeTab('schedule-tab')" class="btn btn-primary border-0 rounded">Sửa Lịch học >></a>
</div>