<li class="">
    @if ($index > 0)
        <hr>
    @endif
        @foreach (App\Models\I18nContent::$supports as $locale)
                <div class="form-group row">
                    <label for="voucher{{ $locale }}"
                        class="col-md-2 col-form-label text-md-right">{{ __('Tiêu đề') }}[{{ $locale }}]</label>
                    <div class="col-md-6">
                        <input id="voucher{{ $locale }}" type="text" class="form-control"
                            name="block[{{ $index }}][title][{{ $locale }}]"
                            value="{{ !empty($config['title'][$locale]) ? $config['title'][$locale] : '' }}">
                        <p class="small text-danger">Để trống nếu không muốn block này hiện lên</p>
                    </div>
                </div>
        @endforeach
    <div class="form-group row">
        <label for="value" class="col-md-2 col-form-label text-md-right">{{ __('IDs khoá học') }}</label>
        <div class="col-md-6">
            <input id="value" type="text" class="form-control" name="block[{{ $index }}][classes]"
                value="{{ !empty($config) ? $config['classes'] : '' }}">
            <p class="small text-danger">Các IDs class cách nhau bằng dấu phẩy ",". Ví dụ: 1,20,199</p>
        </div>
    </div>
</li>
