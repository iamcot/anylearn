<form action="" method="post" id="moneyFixForm">
    @csrf
    <input type="hidden" name="action" value="moneyFix">
    <div id="moneyFixModal" class="modal fade shadow" tabindex="-1" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}">@lang('Chỉnh sửa giao dịch tiền')</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="type" class="col-form-label">{{ __('Loại giao dịch') }}</label>
                        <select class="form-control" name="type" id="type">
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_DEPOSIT_REFUND }}">Hoàn tiền nạp về ngân hàng</option>
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_WITHDRAW }}">
                                Rút điểm về ngân hàng (tỉ lệ 1đ = {{ $configs[\App\Constants\ConfigConstants::CONFIG_BONUS_RATE] }} vnd)</option>
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_COMMISSION_ADD }}">Bổ sung hoa hồng</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="amount" class="">{{ __('Số tiền') }}</label>
                        <input id="amount" type="number" class="form-control" name="amount" required>
                    </div>
                    <div class="form-group">
                        <label for="content" class="">{{ __('Nội dung') }}</label>
                        <input id="content" type="text" class="form-control" name="content" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="moneyFixBtn" name="moneyFix" value="moneyFix" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}">@lang('Lưu')</button>
                </div>
            </div>
        </div>
    </div>
</form>