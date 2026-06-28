<div id="companyCommissionModal" class="modal fade shadow" tabindex="-1" role="dialog">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}">@lang('Chỉnh sửa phân bổ hoa hồng cho công ty')</h5>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>{{ __('Hoa hồng trực tiếp người mua') }} (mặc định: {{ $configs[\App\Constants\ConfigConstants::CONFIG_DISCOUNT] }})</label>
                    <input type="text" class="form-control" name="company[{{ \App\Constants\ConfigConstants::CONFIG_DISCOUNT }}]" value="{{ $companyCommission[\App\Constants\ConfigConstants::CONFIG_DISCOUNT] ?? '' }}">
                    <div class="small">@lang('Số thập phân, để trống nếu không thay đổi so với tỉ lệ trong cấu hình hệ thống.')</div>

                </div>
                <div class="form-group">
                    <label>{{ __('Hoa hồng gián tiếp bạn người mua') }} (@lang('mặc định:') {{ $configs[\App\Constants\ConfigConstants::CONFIG_COMMISSION] }})</label>
                    <input type="text" class="form-control" name="company[{{ \App\Constants\ConfigConstants::CONFIG_COMMISSION }}]" value="{{ $companyCommission[\App\Constants\ConfigConstants::CONFIG_COMMISSION] ?? '' }}">
                    <div class="small">@lang('Số thập phân, để trống nếu không thay đổi so với tỉ lệ trong cấu hình hệ thống.')</div>
                </div>
                <div class="form-group">
                    <label>{{ __('Hoa hồng gián tiếp bạn người bán') }} (@lang('mặc định:') {{ $configs[\App\Constants\ConfigConstants::CONFIG_COMMISSION_REF_SELLER] }})</label>
                    <input type="text" class="form-control" name="company[{{ \App\Constants\ConfigConstants::CONFIG_COMMISSION_REF_SELLER }}]" value="{{ $companyCommission[\App\Constants\ConfigConstants::CONFIG_COMMISSION_REF_SELLER] ?? '' }}">
                    <div class="small">@lang('Số thập phân, để trống nếu không thay đổi so với tỉ lệ trong cấu hình hệ thống.')</div>
                </div>
                <div class="form-group">
                    <label>{{ __('Quỹ foundation') }} (@lang('mặc định:') {{ $configs[\App\Constants\ConfigConstants::CONFIG_COMMISSION_FOUNDATION] }})</label>
                    <input type="text" class="form-control" name="company[{{ \App\Constants\ConfigConstants::CONFIG_COMMISSION_FOUNDATION }}]" value="{{ $companyCommission[\App\Constants\ConfigConstants::CONFIG_COMMISSION_FOUNDATION] ?? '' }}">
                    <div class="small">@lang('Số thập phân, để trống nếu không thay đổi so với tỉ lệ trong cấu hình hệ thống.')</div>
                </div>
            </div>
            <div class="modal-footer">
                <button name="tab" value="info" id="companyCommissionBtn" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}">@lang('Lưu')</button>
            </div>
        </div>
    </div>
</div>