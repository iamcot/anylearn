@if(!empty($notify))
<div class="toast show position-absolute end-0 bg-{{ $notify == "0" ? "danger" : "primary" }} text-white" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="false">
  <!-- <div class="toast-header">
    <span class="rounded me-2"><i class="fa fa-info-circle"></i></span>
    <strong class="me-auto">@lang('Thông báo')</strong>
    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
  </div> -->
  <div class="d-flex">
  <div class="toast-body">
  @if($notify == "0")
        @lang('Thao tác thất bại')
        @elseif($notify == "1")
        @lang('Thao tác thành công')
        @else
        {{ $notify }}
        @endif
  </div>
  <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
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
    <script src="/cdn/vendor/jquery/jquery.min.js"></script>
    <script src="/cdn/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
    <script src="/cdn/vendor/jquery-easing/jquery.easing.min.js"></script>
    <script src="/cdn/js/sb-admin-2.min.js"></script>
    $(function() {
            $('#popup').modal('show');
        });
@endsection
@endif
