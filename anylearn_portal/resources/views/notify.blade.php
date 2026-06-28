@if(!empty($notify))
<div style="min-width:300px; position: absolute; right: 15px;z-index:999; top: {{ $top ?? '80px' }};">
    <div class="toast shadow" role="alert" aria-live="assertive" data-delay="2500" data-animation="true" aria-atomic="true">
        <div class="toast-header bg-{{ env('MAIN_COLOR', 'primary') }} text-white">
            <strong class="mr-auto"><i class="fas fa-info-circle"></i> @lang('Thông báo')</strong>
            <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
        <div class="toast-body">
            @if($notify == "0")
                @lang('Thao tác thất bại')
            @elseif($notify == "1")
                @lang('Thao tác thành công')
            @else
                {{ $notify }}
            @endif
        </div>
    </div>
</div>

@endif
@if(!@empty($bignotify))
<div class="modal fade" id="popup" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <form action="" method="GET">
            <div class="modal-content" id="withdraw">
                <div class="modal-header">
                    <h5 class="modal-title" id="exampleModalLabel">@lang('Kết quả giao dịch')</button>
                </div>
                <div class="modal-body">
                    <strong class="text-center"> Yêu cầu thành công</strong><br>
                    <strong class="text-center"> Số tiền rút</strong><br>
                    Thời gian thanh toán:<br>
                    Mã Giao dịch:<br>
                    Giao dịch sẽ được duyệt và thanh toán trong vòng 24h<br>
                    <p class="text-danger">Lưu Ý:Yêu cầu rút tiền trong các ngày lễ tết sẽ chậm hơn bình thường</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary"
                        data-bs-dismiss="modal">@lang('Quay về')</button>
                </div>
            </div>
        </form>
    </div>
</div>
@section('jscript')
@parent
<script type="text/javascript">

    <script src="/cdn/vendor/jquery/jquery.min.js"></script>
    <script src="/cdn/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>

    <script src="/cdn/vendor/jquery-easing/jquery.easing.min.js"></script>
    <script src="/cdn/js/sb-admin-2.min.js"></script>
    $(function() {
            $('#popup').modal('show');
        });
</script>
@endsection
@endif
