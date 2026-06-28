<form action="{{ route('crm.save-call') }}" method="POST" id="saleAddCallForm">
    @csrf
    <input type="hidden" name="salecall[memberId]" value="{{ $memberProfile->id }}">
    <div id="saleAddCallModal" class="modal fade shadow" tabindex="-1" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title m-0 font-weight-bold text-primary">@lang('Thêm hội thoại tới khách')</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="call_logwork" class="">{{ __('Số giây gọi') }}</label>
                        <input id="call_logwork" type="number" class="form-control" name="salecall[logwork]" min=1 required>
                    </div>
                    <div class="form-group">
                        <label for="call_contennt" class="">{{ __('Nội dung') }}</label>
                        <textarea id="call_contennt" class="form-control" name="salecall[content]" rows="10" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="call_date" class="">{{ __('Ngày') }}</label>
                        <input id="call_date" type="date" class="form-control" name="salecall[date]" value="{{ date('Y-m-d') }}" required>
                    </div>
                    <div class="form-group">
                        <label for="call_time" class="">{{ __('Giờ') }} (Giờ:Phút)</label>
                        <input id="call_time" type="text" class="form-control time" name="salecall[time]" value="{{ date('H:i') }}" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="addCallButton" name="action" value="save-call" class="btn btn-primary">@lang('Lưu')</button>
                </div>
            </div>
        </div>
    </div>
</form>
