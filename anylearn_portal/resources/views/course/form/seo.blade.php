<div class="row">
    <div class="col-12 p-5">
        <h4>@lang('Tùy chỉnh SEO')
            <button class="btn btn-sm btn-primary float-right" name="tab" value="seo"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </h4>
        <hr />
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