@extends('layout')

@section('body')
    <form method="POST" enctype="multipart/form-data">
        @csrf
        <div class="card shadow">
            <div class="card-header">
                Popup trên APP
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="form-group row">
                            <label for="voucher" class="col-md-2 col-form-label text-md-right">{{ __('Hình ảnh') }}</label>
                            <div class="col-md-6">
                                <input name="image" type="file" id="imgInp" />
                            </div>
                        </div>
                        <div class="tab-content" id="i18ntabContent">
                            @foreach (App\Models\I18nContent::$supports as $locale)
                                    <div class="form-group row">
                                        <label for="voucher{{ $locale }}"
                                            class="col-md-2 col-form-label text-md-right">{{ __('Tiêu đề') }}
                                            [{{ $locale }}]</label>
                                        <div class="col-md-6">
                                            <input id="voucher{{ $locale }}" type="text"
                                                class="form-control @error('title') is-invalid @enderror"
                                                name="title[{{ $locale }}]"
                                                value="{{ old('title', !empty($config) ? $config['title']->$locale : '') }}"
                                                required>
                                        </div>
                                    </div>
                            @endforeach
                        </div>
                        <div class="form-group row">
                            <label for="value"
                                class="col-md-2 col-form-label text-md-right">{{ __('Đường dẫn') }}</label>
                            <div class="col-md-6">
                                <input id="value" type="text"
                                    class="form-control @error('route') is-invalid @enderror" name="route"
                                    value="{{ old('route', !empty($config) ? $config['route'] : '') }}">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="amount" class="col-md-2 col-form-label text-md-right">{{ __('Tham số') }}</label>
                            <div class="col-md-6">
                                <input id="amount" type="text"
                                    class="form-control @error('args') is-invalid @enderror" name="args"
                                    value="{{ old('args', !empty($config) ? $config['args'] : '') }}">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="status"
                                class="col-md-2 col-form-label text-md-right">{{ __('Kích hoạt') }}</label>
                            <div class="col-md-6">
                                <input type="checkbox" name="status" id="status" class="form-control"
                                    {{ !empty($config) && $config['status'] == 1 ? 'checked' : '' }}>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <p>Các đường dẫn trong hệ thống</p>
                        <ul>
                            <li><strong>/pdp</strong>: Trang thông tin sản phẩm, tham số là #ID</li>
                            <li><strong>/deposit</strong>: Trang nạp tiền, không tham số</li>
                        </ul>
                    </div>
                </div>

            </div>
            <div class="card-footer">
                <button name="save" value="save_app" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}"><i
                        class="fas fa-save"></i> @lang('Lưu cho APP')</button>
            </div>
        </div>
    </form>
    <hr />
    <form method="POST" enctype="multipart/form-data">
        @csrf
        <div class="card shadow">
            <div class="card-header">
                Popup trên WEB
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-8">
                        <div class="form-group row">
                            <label for="voucher"
                                class="col-md-2 col-form-label text-md-right">{{ __('Hình ảnh') }}</label>
                            <div class="col-md-6">
                                <input name="image" type="file" id="imgInp" />
                            </div>
                        </div>

                        <div class="tab-content" id="i18ntabContent">
                            @foreach (App\Models\I18nContent::$supports as $locale)

                                    <div class="form-group row">
                                        <label for="title{{ $locale }}"
                                            class="col-md-2 col-form-label text-md-right">{{ __('Tiêu đề') }} [{{ $locale }}]
                                        </label>
                                        <div class="col-md-6">
                                            <input id="title{{ $locale }}" type="text"
                                                class="form-control @error('title') is-invalid @enderror"
                                                name="title[{{ $locale }}]"
                                                value="{{ old('title', !empty($webconfig) ? $webconfig['title']->$locale : '') }}"
                                                required>
                                        </div>
                                    </div>

                            @endforeach
                        </div>
                        <div class="form-group row">
                            <label for="value"
                                class="col-md-2 col-form-label text-md-right">{{ __('Đường dẫn') }}</label>
                            <div class="col-md-6">
                                <input id="value" type="text"
                                    class="form-control @error('route') is-invalid @enderror" name="route"
                                    value="{{ old('route', !empty($webconfig) ? $webconfig['route'] : '') }}">
                            </div>
                        </div>

                        <div class="form-group row">
                            <label for="status"
                                class="col-md-2 col-form-label text-md-right">{{ __('Kích hoạt') }}</label>
                            <div class="col-md-6">
                                <input type="checkbox" name="status" id="status" class="form-control"
                                    {{ !empty($webconfig) && $webconfig['status'] == 1 ? 'checked' : '' }}>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                    </div>
                </div>

            </div>
            <div class="card-footer">
                <button name="save" value="save_web" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}"><i
                        class="fas fa-save"></i> @lang('Lưu cho WEB')</button>
            </div>
        </div>
    </form>
@endsection
