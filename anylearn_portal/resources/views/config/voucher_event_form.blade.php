@extends('layout')

@section('body')
<form method="POST">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($event) ? $event->id : null }}">
    <div class="card shadow">
        <div class="card-body">
            <div class="form-group row">
                <label for="title" class="col-md-2 col-form-label text-md-right">{{ __('Tiêu đề') }}</label>
                <div class="col-md-6">
                    <input id="title" type="text" class="form-control @error('title') is-invalid @enderror" name="title" value="{{ old('title', !empty($event) ? $event->title : '') }}" required>
                </div>
            </div>
            <div class="form-group row">
                <label for="type" class="col-md-2 col-form-label text-md-right">{{ __('Loại Sự kiện') }}</label>
                <div class="col-md-6">
                    <select name="type" id="type" class="form-control">
                        <option {{ !empty($event) && $event->type == App\Models\VoucherEvent::TYPE_REGISTER ? "selected" : '' }}
                            value="{{ App\Models\VoucherEvent::TYPE_REGISTER }}" >Đăng ký người dùng</option>
                        <option {{ !empty($event) && $event->type == App\Models\VoucherEvent::TYPE_CLASS ? "selected" : '' }}
                            value="{{ App\Models\VoucherEvent::TYPE_CLASS }}">Mua khóa học</option>
                        <option {{ !empty($event) && $event->type == App\Models\VoucherEvent::TYPE_PARTNER ? "selected" : '' }}
                            value="{{ App\Models\VoucherEvent::TYPE_PARTNER }}">Đối tác</option>
                        <option {{ !empty($event) && $event->type == App\Models\VoucherEvent::TYPE_PROMOTE ? "selected" : '' }}
                            value="{{ App\Models\VoucherEvent::TYPE_PROMOTE }}">Quảng cáo</option>
                    </select>
                </div>
            </div>

            <div class="form-group row">
                <label for="trigger" class="col-md-2 col-form-label text-md-right">{{ __('ID khởi tạo') }}</label>
                <div class="col-md-6">
                    <input id="trigger" type="text" class="form-control @error('trigger') is-invalid @enderror" name="trigger" value="{{ old('trigger', !empty($event) ? $event->trigger : 0) }}" required>
                    <p class="small">Set 0 nếu áp dụng cho tất cả</p>
                </div>
            </div>

            <div class="form-group row">
                <label for="targets" class="col-md-2 col-form-label text-md-right">{{ __('ID Bộ Voucher') }}</label>
                <div class="col-md-6">
                    <input id="targets" type="text" class="form-control @error('targets') is-invalid @enderror" name="targets" value="{{ old('targets', !empty($event) ? $event->targets : '') }}" required>
                    <div class="small">Nhiều bộ voucher thì phân cách nhau bằng dấu phẩy (ví dụ: 1,2,3)</div>
                    <p class="small">Nếu event dùng notif và email template riêng, nên chỉ dùng 1 bộ voucher.</p>
                </div>
            </div>
            <div class="form-group row">
                <label for="qtt" class="col-md-2 col-form-label text-md-right">{{ __('Số lượng') }}</label>
                <div class="col-md-6">
                    <input id="qtt" type="text" class="form-control @error('qtt') is-invalid @enderror" name="qtt" value="{{ old('qtt', !empty($event) ? $event->qtt : '') }}" required>
                </div>
            </div>
            <div class="form-group row">
                <label for="ref_user_id" class="col-md-2 col-form-label text-md-right">{{ __('ID Giới thiệu') }}</label>
                <div class="col-md-6">
                    <input id="ref_user_id" 
                        type="text" 
                        name="ref_user_id" 
                        class="form-control @error('ref_user_id') is-invalid @enderror" 
                        value="{{ old('ref_user_id', !empty($event) ? $event->ref_user_id : '') }}">
                    <div class="small">ID Người dùng được tính hoa hồng nếu voucher được sử dụng.</div>
                </div>
            </div>
            <div class="form-group row">
                <label for="commission_rate" class="col-md-2 col-form-label text-md-right">{{ __('Tỷ lệ hoa hồng') }}</label>
                <div class="col-md-6">
                    <input id="commission_rate" 
                        type="text" 
                        name="commission_rate" 
                        class="form-control @error('commission_rate') is-invalid @enderror" 
                        value="{{ old('commission_rate', !empty($event) ? $event->commission_rate : '') }}">
                    <div class="small">Tỷ lệ hoa hồng mặc định là {{ $defaultCommissionRate }}.</div>
                </div>
            </div>
            <div class="form-group row">
                <label for="notif_template" class="col-md-2 col-form-label text-md-right">{{ __('Template notification') }}</label>
                <div class="col-md-6">
                    <textarea id="notif_template" class="form-control" name="notif_template">{{ old('notif_template', !empty($event) ? $event->notif_template : '') }}</textarea>
                    <p class="small">Dùng các mẫu {voucher}, {amount} để thay thế cho mã voucher và số tiền nếu có.</p>
                </div>
            </div>
            <div class="form-group row">
                <label for="email_template" class="col-md-2 col-form-label text-md-right">{{ __('Template Email') }}</label>
                <div class="col-md-6">
                    <textarea id="email_template" class="form-control editor" name="email_template" rows="5">{{ old('email_template', !empty($event) ? $event->email_template : '') }}</textarea>
                    <p class="small">Dùng các mẫu {voucher}, {amount} để thay thế cho mã voucher và số tiền nếu có.</p>
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button name="save" value="save" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}"><i class="fas fa-save"></i> @lang('Lưu')</button>
        </div>
    </div>
</form>
@endsection
@section('jscript')
@parent
<script src="/cdn/vendor/ckeditor5/ckeditor.js"></script>
<script>
    var allEditors = document.querySelectorAll('.editor');
    var editorConfig = {
        mediaEmbed: {
                previewsInData: true
            },
        simpleUpload: {
            uploadUrl: "{{ @route('upload.ckimage5') }}",
            withCredentials: true,
            headers: {
                'X-CSRF-TOKEN': "{{ csrf_token() }}",
            }
        }
    };
    for (var i = 0; i < allEditors.length; ++i) {
        ClassicEditor.create(allEditors[i], editorConfig)
        .catch(error => {
            console.log(error);
        });
    }
    
</script>
@endsection