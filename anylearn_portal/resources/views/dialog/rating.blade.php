<form action="" method="post" id="ratingForm">
    @csrf
    <input type="hidden" name="action" value="rating">
    <input type="hidden" id="rating_class_id" name="class-id" value="">
    <div id="ratingFormModal" class="modal fade shadow" tabindex="-1" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}">
                        @lang('Đánh giá của admin')</h5>
                    {{-- <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button> --}}
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="type" class="col-form-label">{{ __('Xếp hạng') }}</label>
                        <select class="form-control" name="rating" id="type">
                            <option value="5">5</option>
                            <option value="4">4</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="content" class="">{{ __('Nội dung') }}</label>
                        <textarea id="content" class="form-control" name="comment" required></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="ratingFormBtn" name="ratingForm" value="ratingForm"
                        class="btn btn-{{ env('MAIN_COLOR', 'primary') }}">@lang('Lưu')</button>
                </div>
            </div>
        </div>
    </div>
</form>
