@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('body')
<form method="POST" enctype="multipart/form-data">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($location) ? $location->id : null }}">
    <div class="card shadow">
        <div class="card-body">
            <div class="">
                <div class="form-group row">
                    <label for="title" class="col-md-2 col-form-label text-md-right">{{ __('Tên địa điểm') }}</label>
                    <div class="col-md-8">
                        <input id="title" type="text" class="form-control @error('title') is-invalid @enderror" name="title" value="{{ old('title', !empty($location) ? $location->title : '') }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="province" class="col-md-2 col-form-label text-md-right">{{ __('Tỉnh/Thành Phố') }}</label>
                    <div class="col-md-8">
                        <select class="form-control location-tree" data-next-level="district" name="province_code" required>
                            <option value="">@lang('--Chọn Tỉnh/Thành Phố--')</option>
                            @foreach($provinces as $province)
                                <option value="{{ $province->code }}" {{ !empty($location) && $province->code == $location->province_code ? "selected" : ""}}>{{ $province->name }}</option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="select-district" class="col-md-2 col-form-label text-md-right">{{ __('Quận/Huyện') }}</label>
                    <div class="col-md-8">
                        <select class="form-control location-tree" id="select-district" data-next-level="ward" name="district_code" required>
                            @if(empty($districts))
                            <option>@lang('--Vui lòng chọn Tỉnh/Thành Phố--')</option>
                            @else
                                @foreach($districts as $district)
                                <option value="{{ $district->code }}" {{ $district->code == $location->district_code ? "selected" : ""}}>{{ $district->name }}</option>
                                @endforeach
                            @endif
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="select-ward" class="col-md-2 col-form-label text-md-right">{{ __('Phường/Xã') }}</label>
                    <div class="col-md-8">
                        <select class="form-control location-tree"  data-next-level="ward_path" id="select-ward" name="ward_code" required>
                            @if(empty($wards))
                            <option>@lang('--Vui lòng chọn Quận/Huyện--')</option>
                            @else
                                @foreach($wards as $ward)
                                <option value="{{ $ward->code }}" {{ $ward->code == $location->ward_code ? "selected" : ""}}>{{ $ward->name }}</option>
                                @endforeach
                            @endif
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="address" class="col-md-2 col-form-label text-md-right">{{ __('Địa chỉ') }}</label>
                    <div class="col-md-4 mb-1">
                        <input id="address" type="text" class="form-control @error('address') is-invalid @enderror" name="address" value="{{ old('address', !empty($location) ? $location->address : '') }}" required>
                    </div>
                    <div class="col-md-4">
                        <input readonly id="ward_path" type="text" class="form-control" name="ward_path" value="{{ old('ward_path', !empty($location) ? $location->ward_path : '') }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="is_head" class="col-md-2 col-form-label text-md-right">{{ __('Là Trụ Sở Chính') }}</label>
                    <div class="col-md-8">
                        <input id="is_head" type="checkbox" name="is_head" {{ !empty($location) && $location->is_head ? "checked" : ""}}>
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
@section('jscript')
@parent
<script src="/cdn/js/location-tree.js"></script>
@endsection