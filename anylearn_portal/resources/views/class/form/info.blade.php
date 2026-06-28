@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')
<div class="card mb-3 shadow">
    <div class="card-header font-weight-bold">Thông tin chung</div>
    <div class="card-body">
        <div class="form-group row">
            <label for="title" class="col-md-3 col-form-label text-md-right ">{{ __('Tiêu đề') }}</label>
            <div class="col-md-8">
                <input id="title" type="text" class="form-control @error('title') is-invalid @enderror" name="title[{{ App\Models\I18nContent::DEFAULT }}]" value="{{ old('title', !empty($course) ? $course['info']->title[App\Models\I18nContent::DEFAULT] : '') }}" required>
            </div>
        </div>

        <div class="form-group row">
            <label for="categories" class="col-md-3 col-form-label text-md-right ">{{ __('Lĩnh vực') }}</label>
            <div class="col-md-8">
                <select class="form-control" name="categories[]" multiple>
                    @foreach ($categories as $category)
                    <option value="{{ $category->id }}" {{ !empty($itemCategories) && in_array($category->id, $itemCategories) ? 'selected' : '' }}>
                        {{ $category->title }}
                    </option>
                    @endforeach
                </select>
                <p class="small">@lang('Có thể chọn nhiều chuyên mục bằng giữ phím Ctrl (hoặc Cmd)')</p>
            </div>
        </div>
        <div class="form-group row">
            <label for="date_start" class="col-md-3 col-form-label text-md-right ">{{ __('Ngày bắt đầu') }}</label>
            <div class="col-md-8">
                <input id="date_start" type="date" class="form-control @error('date_start') is-invalid @enderror" name="date_start" value="{{ old('date_start', !empty($course) ? $course['info']->date_start : date('Y-m-d') ) }}" required>
            </div>
        </div>
        <div id="box_time" style="@if(empty($course)
        || ( !empty($course) && in_array( $course['info']->subtype, [\App\Constants\ItemConstants::SUBTYPE_DIGITAL, \App\Constants\ItemConstants::SUBTYPE_VIDEO]))
        ) display:none; @endif">

            <div class="form-group row">
                <label for="time_start" class="col-md-3 col-form-label text-md-right ">{{ __('Thời gian bắt đầu') }}</label>
                <div class="col-md-8">
                    <input id="time_start" type="time" class="time form-control @error('time_start') is-invalid @enderror" name="time_start" value="{{ old('time_start', !empty($course) ? $course['info']->time_start : '') }}" placeholder="hh:mm">
                </div>
            </div>
            <div class="form-group row">
                <label for="nolimit_time" class="col-md-3 col-form-label text-md-right ">{{ __('Không giới hạn thời gian đăng ký') }}</label>
                <div class="col-md-8 form-check form-switch m-2">
                    <input class="form-check-input" type="checkbox" name="nolimit_time" id="nolimit_time" {{ !empty($course) && $course['info']->nolimit_time > 0 ? "checked" : "" }}>
                </div>
            </div>
        </div>
        <div class="form-group row">
            <label for="allow_re_register" class="col-md-3 col-form-label text-md-right ">{{ __('Cho phép đăng ký nhiều lần') }}</label>
            <div class="col-md-8 form-check form-switch m-2">
                <input class="form-check-input" type="checkbox" name="allow_re_register" id="allow_re_register" {{ !empty($course) && $course['info']->allow_re_register > 0 ? "checked" : "" }}>
            </div>
        </div>
        <div id="box_activities" style="@if(empty($course)
        || (!empty($course) && !in_array( $course['info']->subtype, [\App\Constants\ItemConstants::SUBTYPE_OFFLINE, \App\Constants\ItemConstants::SUBTYPE_EXTRA]))
        ) display:none; @endif">
            <div class="form-group row">
                <label for="activiy_trial" class="col-md-3 col-form-label text-md-right ">{{ __('Có học thử') }}</label>
                <div class="col-md-8 form-check form-switch m-2">
                    <input class="form-check-input" type="checkbox" name="activiy_trial" id="activiy_trial" {{ !empty($course) && $course['info']->activiy_trial > 0 ? "checked" : "" }}>
                </div>
            </div>
            <div class="form-group row">
                <label for="activiy_visit" class="col-md-3 col-form-label text-md-right ">{{ __('Có Tham quan trường') }}</label>
                <div class="col-md-8 form-check form-switch m-2">
                    <input class="form-check-input" type="checkbox" name="activiy_visit" id="activiy_visit" {{ !empty($course) && $course['info']->activiy_visit > 0 ? "checked" : "" }}>
                </div>
            </div>
            <div class="form-group row">
                <label for="activiy_test" class="col-md-3 col-form-label text-md-right ">{{ __('Có test đầu vào') }}</label>
                <div class="col-md-8 form-check form-switch m-2">
                    <input class="form-check-input" type="checkbox" name="activiy_test" id="activiy_test" {{ !empty($course) && $course['info']->activiy_test > 0 ? "checked" : "" }}>
                </div>
            </div>
        </div>
        <div class="form-group row">
            <label for="age-range" class="col-md-3 col-form-label text-md-right ">{{ __('Độ tuổi') }}</label>
            <div class="col-md-8">
                <input type="text" id="age-amount" name="ages_range" readonly style="border:0;" data-ages_min="{{ !empty($course['info']->ages_min) ? $course['info']->ages_min : 0 }}" data-ages_max="{{ !empty($course['info']->ages_max) ? $course['info']->ages_max : 30 }}">
                <div id="age-range" class="mt-2"></div>
            </div>
        </div>

        <div class="form-group row">
            <label for="tags" class="col-md-3 col-form-label text-md-right ">{{ __('Tags') }}</label>
            <div class="col-md-8">
                <input id="tags" type="text" class="form-control @error('tags') is-invalid @enderror" name="tags" value="{{ old('tags', !empty($course) ? $course['info']->tags : '') }}">
            </div>
        </div>
    </div>
</div>
<div class="card mb-3 shadow">
    <div class="card-header font-weight-bold">Ảnh đại diện</div>
    <div class="card-body row">
        <div class="col-sm-6">
            <input name="image" type="file" id="mainImageInp" />
        </div>
        <div id="mainImage" class="mt-2 col-sm-6">
            @if(!empty($course) && $course['info']->image)
            <img style="max-height:50px;" src="{{ $course['info']->image }}" class="img-fluid">
            @endif
        </div>
    </div>
</div>
@if ($userServ->isMod() || $userServ->haveAccess(Auth::user()->role, 'user.sale'))
    <div class="card mb-3 shadow">
        <div class="card-header  font-weight-bold">Thông tin hệ thống</div>
        <div class="card-body">
            @if ($userServ->haveAccess(Auth::user()->role, 'user.sale'))
            <div class="form-group row">
                <label for="sale_id" class="col-md-3 col-form-label text-md-right">{{ __('ID Sale chăm sóc') }}</label>
                <div class="col-md-8">
                    <input id="sale_id" type="text" class="form-control @error('sale_id') is-invalid @enderror" name="sale_id" value="{{ old('sale_id', !empty($course) ? $course['info']->sale_id : '') }}">
                    <small>@lang('Có thể tham khảo ID ngoài danh sách nhân viên.')</small>
                </div>
            </div>
            @endif
            @if ($userServ->isMod())
            <div class="form-group row">
                <label for="commission_rate" class="col-md-3 col-form-label text-md-right ">{{ __('Hoa hồng người bán') }}</label>
                <div class="col-md-8">
                    <input id="commission_rate" type="text" class="form-control @error('commission_rate') is-invalid @enderror" name="commission_rate" value="{{ old('commission_rate', !empty($course) ? $course['info']->commission_rate : '') }}">
                    <div class="small">@lang('Số thập phân; Để trống nếu không thay đổi so với tỉ lệ trong hợp đồng; Set là -1 nếu khoá này để không chia hoa hồng người bán.')</div>
                </div>
            </div>
            <div class="form-group row">
                <label for="company_rate" class="col-md-3 col-form-label text-md-right ">{{ __('Hoa hồng công ty') }}</label>
                <div class="col-md-8">
                    @if ($companyCommission != null)
                    @foreach ($companyCommission as $key => $config)
                    @if ($config != null)
                    {{ $key }}= {{ $config }};
                    @endif
                    @endforeach
                    @endif
                    <a class="btn btn-sm btn-danger" id="companyCommission-action" href="#"><i class="fa fa-edit"></i></a>
                </div>
            </div>
            @endif
        </div>
    </div>
@endif
<div class="card mb-3 shadow">
    <div class="card-header font-weight-bold">Tuỳ chỉnh SEO</div>
    <div class="card-body">
        <div class="form-group row">
            <label for="seo_title" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Tiêu đề') }}</label>
            <div class="col-md-8">
                <input onchange="formatSlug(this, 'seo_url')" id="seo_title" type="text" class="form-control @error('seo_title') is-invalid @enderror" name="seo_title" value="{{ old('seo_title', !empty($course) ? $course['info']->seo_title : '') }}">
            </div>
        </div>

        <div class="form-group row">
            <label for="seo_url" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Đường dẫn') }}</label>
            <div class="col-md-8">
                <input id="seo_url" type="text" class="form-control @error('seo_url') is-invalid @enderror" name="seo_url" value="{{ old('seo_url', !empty($course) ? $course['info']->seo_url : '') }}">
            </div>
        </div>

        <div class="form-group row">
            <label for="seo_desc" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Description') }}</label>
            <div class="col-md-8">
                <textarea name="seo_desc" class="form-control">{{ old('seo_desc', !empty($course) ? $course['info']->seo_desc : '') }}</textarea>
            </div>
        </div>
    </div>
</div>

<div class="text-center mb-3">
    <button class="btn btn-success border-0 rounded" name="tab" value="info"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
    <a href="javascript:changeTab('price-tab')" class="btn btn-primary border-0 rounded">Sửa học phí >></a>
</div>
@include('dialog.company_commission')