<div class="row">
    <div class="col-12 p-5">
        <h4>@lang('Thông tin cơ bản khóa học')
            <button class="btn btn-sm btn-primary float-right" name="tab" value="info"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </h4>
        <hr />
        <div class="form-group row">
            <label for="title" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Tiêu đề') }}</label>
            <div class="col-md-8">
                <input id="title" type="text" class="form-control @error('title') is-invalid @enderror" name="title" value="{{ old('title', !empty($course) ? $course['info']->title : '') }}" required>
            </div>
        </div>

        <div class="form-group row">
            <label for="title" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Chuỗi khóa học') }}</label>
            <div class="col-md-8">
                <select class="form-control" name="series_id" id="series_id">
                    <option value="">---</option>
                    <option {{ old('series_id') == -1 ? 'selected' : '' }} value="-1">@lang('Tạo chuỗi khóa học mới')</option>
                    @if(!empty($courseSeries))
                    @foreach($courseSeries as $series)
                    <option {{ old('series_id', !empty($course) ? $course['info']->series_id : 0) == $series->id ? 'selected' : '' }} value="{{ $series->id }}">{{ $series->title }}</option>
                    @endforeach
                    @endif
                </select>
            </div>
        </div>
        <div class="form-group row" id="newSeries">
            <label for="series" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Chuỗi khóa học mới') }}</label>
            <div class="col-md-8">
                <input id="series" type="text" class="form-control @error('series') is-invalid @enderror" name="series" value="{{ old('series') }}">
            </div>
        </div>

        <div class="form-group row">
            <label for="price" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Học phí') }}</label>
            <div class="col-md-8">
                <input id="price" type="number" class="form-control @error('price') is-invalid @enderror" name="price" value="{{ old('price', !empty($course) ? $course['info']->price : '') }}">
            </div>
        </div>
        <div class="form-group row">
            <label for="org_price" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Học phí gốc') }}</label>
            <div class="col-md-8">
                <input id="org_price" type="number" class="form-control @error('org_price') is-invalid @enderror" name="org_price" value="{{ old('org_price', !empty($course) ? $course['info']->org_price : '') }}">
            </div>
        </div>
        <div class="form-group row">
            <label for="commission_rate" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Tỉ lệ hoa hồng') }}</label>
            <div class="col-md-8">
                <input id="commission_rate" type="text" class="form-control @error('commission_rate') is-invalid @enderror" name="commission_rate" value="{{ old('commission_rate', !empty($course) ? $course['info']->commission_rate : '') }}">
            </div>
        </div>

        <div class="form-group row">
            <label for="date_start" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Ngày diễn ra') }}</label>
            <div class="col-md-8">
                <input id="date_start" type="date" class="form-control @error('date_start') is-invalid @enderror" name="date_start" value="{{ old('date_start', !empty($course) ? $course['info']->date_start : '') }}">
            </div>
        </div>

        <div class="form-group row">
            <label for="time_start" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Thời gian bắt đầu') }}</label>
            <div class="col-md-8">
                <input id="time_start" type="text" class="time form-control @error('time_start') is-invalid @enderror" name="time_start" value="{{ old('time_start', !empty($course) ? $course['info']->time_start : '') }}" placeholder="hh:mm" required>
            </div>
        </div>
        <div class="form-group row">
            <label for="time_end" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Thời gian kết thúc') }}</label>
            <div class="col-md-8">
                <input id="time_end" type="text" class="time form-control @error('time_end') is-invalid @enderror" name="time_end" value="{{ old('time_end', !empty($course) ? $course['info']->time_end : '') }}" placeholder="hh:mm">
            </div>
        </div>
        <div class="form-group row">
            <label for="location_type" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Loại địa điểm') }}</label>
            <div class="col-md-8">
                <select class="form-control" name="location_type" id="location_type">
                    @if(!empty($locationTypes))
                    @foreach($locationTypes as $type => $title)
                    <option {{ old('location_type', !empty($course) ? $course['info']->location_type : '') == $type ? 'selected' : '' }} value="{{ $type }}">{{ $title }}</option>
                    @endforeach
                    @endif
                </select>
            </div>
        </div>
        <div class="form-group row">
            <label for="location" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Địa điểm/URL') }}</label>
            <div class="col-md-8">
                <input id="location" type="text" class="form-control @error('location') is-invalid @enderror" name="location" value="{{ old('location', !empty($course) ? $course['info']->location : '') }}">
            </div>
        </div>

        <div class="form-group row">
            <label for="short_content" class="col-md-3 col-form-label text-md-right font-weight-bold">{{ __('Thông tin tóm tắt') }}</label>
            <div class="col-md-8">
                <textarea name="short_content" class="form-control">{{ old('short_content', !empty($course) ? $course['info']->short_content : '') }}</textarea>
            </div>
        </div>

        <div class="form-group row">
            <label for="editor" class="col-md-3 col-form-label text-md-right font-weight-bold @error('content') is-invalid @enderror">{{ __('Thông tin chi tiết') }}</label>
            <div class="col-md-8">
                <textarea id="editor" name="content">{!! old('content', !empty($course) ? $course['info']->content : '') !!}</textarea>
            </div>
        </div>

    </div>
</div>