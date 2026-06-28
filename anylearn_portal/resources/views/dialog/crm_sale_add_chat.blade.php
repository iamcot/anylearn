<form action="{{ route('crm.save-chat') }}" method="POST" id="saleAddChatForm">
    @csrf
    <input type="hidden" name="salechat[memberId]" value="{{ $memberProfile->id }}">
    <div id="saleAddChatModal" class="modal fade shadow" tabindex="-1" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title m-0 font-weight-bold text-primary">@lang('Thêm đoạn chat tới khách')</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="chat_content" class="">{{ __('Nội dung chat') }}</label>
                        <textarea id="chat_content" class="form-control" name="salechat[content]" rows="10" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="chat_date" class="">{{ __('Ngày') }}</label>
                        <input id="chat_date" type="date" class="form-control" name="salechat[date]" value="{{ date('Y-m-d') }}" required>
                    </div>
                    <div class="form-group">
                        <label for="chat_time" class="">{{ __('Giờ') }} (Giờ:Phút)</label>
                        <input id="chat_time" type="text" class="form-control time" name="salechat[time]" value="{{ date('H:i') }}" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="addChatButton" name="action" value="save-chat" class="btn btn-primary">@lang('Lưu')</button>
                </div>
            </div>
        </div>
    </div>
</form>