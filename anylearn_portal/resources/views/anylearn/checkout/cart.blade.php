@inject('itemServ', 'App\Services\ItemServices')
@inject('transServ', 'App\Services\TransactionService')
@inject('qrServ', 'App\Services\QRServices')

@extends('anylearn.layout')
@section('spmb')
cart
@endsection
@if (empty($order))
@section('body')
<div class="card mb-5 shadow">
    <p class="p-5">@lang('Bạn không có đơn hàng nào. Nhấn nút quay lại và tìm hiểu thêm về các khoá học của anyLEARN nhé.')</p>

    @if(!empty($pending) && count($pending) > 0)
        <section>
            <hr>
            <p class="m-2 p-2 bg-warning text-danger"><i class="fas fa-exclamation-triangle"></i>@lang('Opps, Bạn có đơn hàng đang chờ thanh toán.') </p>
            <table class="table table-striped text-secondary">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tên khóa học</th>
                    <th>Số tiền</th>
                    <th>Ngày</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                @foreach($pending as $row)
                <tr>
                    <td>{{ $row->id }}</td>
                    <td width="50%">{{ $row->classes }}</td>
                    <td>{{ number_format($row->amount) }} đồng</td>
                    <td>{{ $row->created_at }}</td>
                    <td>
                    <a href="{{ route('me.cancelpending', ['orderId' => $row->id]) }}" class="btn btn-danger btn-sm border-0 rounded-pill">HỦY</a>    
                        
                    <a href="{{ route('checkout.paymenthelp', ['order_id' => $row->id]) }}" class="btn btn-success btn-sm border-0 rounded-pill">Thanh toán</a></td>
                </tr>
                @endforeach
            </tbody>
        </table>
        </section>
        @endif
</div>
@endsection
@else
@section('body')
<div class="card mb-2 border-left-primary shadow">
    <div class="card-header">
        <h5 class="modal-title m-0 text-secondary"><i class="fa fa-shopping-cart text-success"></i> @lang('Đơn hàng của bạn')
        </h5>
    </div>
    <div class="card-body p-0">

        <table class="table table-stripped">
            <thead>
                <tr class="text-secondary">
                    <th class="text-center">#</th>
                    <th></th>
                    <th width="55%">@lang('Khoá học/Sản phẩm')</th>
                    <th class="text-end pe-5">@lang('Đơn giá')</th>
                    <th></th>
                </tr>
            <tbody>
                @php $hasPaymemtFee = false; @endphp
                @foreach ($detail as $item)
                @php if ($item->is_paymentfee) { $hasPaymemtFee = true; } @endphp
                <tr>
                    <td class="text-center">{{ $loop->index + 1 }}</td>
                    <td><img class="img-fluid" style="max-height: 80px" src="{{ $item->image }}"></td>
                    <td>
                        <strong class="text-success">
                        {{ $item->title }}
                        </strong>
                        @if ($item->childId != $user->id)
                        <span class="text-primary">({{ $item->childName }})</span>
                        @endif
                        <p class="small pt-2">
                        @if($item->plan_location_name)
                        Học tại {{ $item->plan_location_name }}; @foreach(explode(",", $item->plan_weekdays) as $day ) {{ $day == 1 ? __('Chủ Nhật') : __("Thứ " . ($day)) }} {{ !$loop->last ? ", " : ". " }} @endforeach
                        Bắt đầu từ {{ date("d/m/Y", strtotime($item->plan_date_start)) }}
                        @else 
                        Bắt đầu từ ngày {{ date('d/m/Y', strtotime($item->date_start)) }}
                        @endif
                        </p>
                    </td>

                    <td class="text-end  pe-5">
                        {{ number_format($item->paid_price, 0, ',', '.') }}₫
                        <br>
                    </td>
                    <td>
                        @if ($api_token)
                        <a href="{{ route('checkout.remove2cart', ['odId' => $item->id, 'api_token' => $api_token]) }}" class="btn btn-sm btn-danger rounded-circle" title="Xoá khỏi giỏ hàng"><i class="fa fa-trash"></i></a>
                        @else
                        <a href="{{ route('checkout.remove2cart', ['odId' => $item->id]) }}" class="btn btn-sm btn-danger rounded-circle" title="Xoá khỏi giỏ hàng "><i class="fa fa-trash"></i></a>
                        @endif
                    </td>
                </tr>
                @foreach ($transServ->extraFee($item->id) as $extra)
                <tr>
                    <td></td>
                    <td>Phụ phí</td>
                    <td>{{ $extra->title}}</td>
                    <td class="text-end pe-5">{{ number_format($extra->price) }}₫</td>
                    <td></td>
                </tr>
                @endforeach
                </tr>
                @endforeach
            </tbody>

            </thead>
        </table>
        @if (empty($voucherUsed))
        @if ($api_token)
        <form data-spm="cart.anypoint-change" method="POST" action="{{ route('exchangePoint', ['api_token' => $api_token]) }}" id="exchangePoint">
            @else
            <form data-spm="cart.anypoint-change" method="POST" action="{{ route('exchangePoint') }}" id="exchangePoint">
                @endif
                @csrf
                <input type="hidden" name="order_id" value="{{ $order->id }}">
                @if (!empty($pointUsed))
                <p class="ps-3 fw-bold text-secondary">@lang('Đã đổi:') <span class="text-success">{{ $pointUsed->amount }} anyPoint</span>
                    <input type="hidden" name="point_used_id" value="{{ $pointUsed->id }}">
                    <button class="btn-close" name="cart_action" value="remove_point"></button>
                </p>
                @else
                <div class="p-3">
                    <label for="" class="fw-bold text-secondary">@lang('Bạn đang có') <strong class="text-success">{{ $user->wallet_c }}</strong> anyPoint.
                        @lang('Bạn có thể sử dụng tối đa') <strong class="text-danger">{{ $transServ->calRequiredPoint($order->amount, $user->wallet_c, $bonusRate) }}</strong>
                        @lang('anyPoint cho đơn hàng này.')
                        <a href="javascript:$('#payment_point_input').val({{ $transServ->calRequiredPoint($order->amount, $user->wallet_c, $bonusRate) }})">@lang('Dùng hết')</a>
                    </label>
                    <div class="row">
                        <div class="form-group col-xs-12 col-md-4 mt-1">
                            <input type="number" min=0 max="{{ $transServ->calRequiredPoint($order->amount, $user->wallet_c, $bonusRate) }}" class=" rounded-pill form-control" id="payment_point_input" name="payment_point" value="{{ !empty($pointUsed) ? $pointUsed->amount : '' }}">
                        </div>
                        <div class="form-group col-xs-12 col-md-2 mt-1">
                            <button class="btn btn-warning form-control rounded-pill border-0" name="cart_action" value="exchangePoint">@lang('Đổi anyPoint')</button>
                        </div>
                    </div>
                </div>
                @endif
            </form>
            @endif

            @if (empty($pointUsed))
            @if ($api_token)
            <form data-spm="cart.voucher-apply" method="POST" action="{{ route('applyvoucher', ['api_token' => $api_token]) }}" id="cartvoucher">
                @else
                <form data-spm="cart.voucher-apply" method="POST" action="{{ route('applyvoucher') }}" id="cartvoucher">
                    @endif
                    @csrf
                    <input type="hidden" name="order_id" value="{{ $order->id }}">
                    @if (!empty($voucherUsed))
                    <p class="ps-3 fw-bold text-secondary">@lang('Áp dụng Mã giảm giá:') <span class="text-success">{{ $voucherUsed->voucher }}</span>
                        <input type="hidden" name="voucher_userd_id" value="{{ $voucherUsed->id }}">
                        <button class="btn-close" name="cart_action" value="remove_voucher"></button>
                    </p>
                    @else
                    <div class="p-3">
                        <label for="" class="fw-bold text-secondary">@lang('Mã giảm giá')</label>
                        <div class="row">
                            <div class="form-group col-xs-12 col-md-4 mt-1">
                                <input type="text" class=" rounded-pill form-control" name="payment_voucher" value="{{ !empty($voucherUsed) ? $voucherUsed->voucher : '' }}">
                            </div>
                            <div class="form-group col-xs-12 col-md-2 mt-1">
                                <button class="btn btn-warning form-control rounded-pill border-0" name="cart_action" value="apply_voucher">@lang('Áp dụng')</button>
                            </div>
                        </div>
                    </div>
                    @endif
                </form>
                @endif
    </div>

    <div class="card-footer">
        @if (!empty($order))
        <div class="fw-bold text-secondary">
            @lang('TỔNG TIỀN:')
            <span class="text-danger">{{ number_format($order->amount, 0, ',', '.') }}₫</span>
        </div>
        @endif
    </div>
</div>

@if ($api_token)
<form data-spm="cart.purchased" method="POST" action="{{ route('payment', ['api_token' => $api_token]) }}" id="cartsubmit">
    @else
    <form data-spm="cart.purchased" method="POST" action="{{ route('payment') }}" id="cartsubmit">
        @endif
        @csrf
        @if (!empty($order))
        <input type="hidden" name="order_id" value="{{ $order->id }}">
        @endif


        <div class="card mt-3 mb-5 border-left-success shadow">
            <div class="card-header">
                <h5 class="modal-title m-0 text-secondary"><i class="fa fa-wallet text-success"></i> @lang('Phương thức Thanh toán')
                </h5>
            </div>

            <div class="card-body">
                @if ($order->amount > 0)
                <ul class="list-unstyled">
                    @if(in_array('atm', explode(",", env('PAYMENT_METHOD', 'atm,onepayfee,vnpay,onepaytg,momo'))))
                    <li class="p-2"><input required type="radio" name="payment" value="atm" id="radio_atm">
                        <label for="radio_atm"><strong>@lang('Chuyển khoản ngân hàng hoặc thanh toán tại trường')</strong></label>
                    </li>
                    @endif

                    @if(in_array('onepayfee', explode(",", env('PAYMENT_METHOD', 'atm,onepayfee,vnpay,onepaytg,momo'))))
                        @if (empty($saveBanks))
                        <li class="p-2"><input required type="radio" name="payment" value="onepayfee" id="radio_onepaylocal"> <label for="radio_onepaylocal"><strong>@lang('Thanh toán trực tuyến bằng thẻ')</strong></label></li>
                        @else
                            @foreach ($saveBanks as $bank)
                            <li class="p-2"><input required type="radio" name="payment" value="{{ $bank['id'] }}" id="radio_savedBank_{{ $bank['id'] }}"> <label for="radio_savedBank_{{ $bank['id'] }}"><img src="{{ $bank['logo'] }}" style="height: 20px;">
                                    <strong>{{ substr($bank['tokenNum'], 0, 6) }}***</strong></label></li>
                            @endforeach
                            <li class="p-2"><input required type="radio" name="payment" value="onepayfee" id="radio_onepaylocal"> <label for="radio_onepaylocal"><strong>@lang('Thanh toán trực tuyến bằng thẻ <span style="color:#267aff;">MỚI</span>')</strong></label></li>
                        @endif
                    @endif
                    @if(in_array('vnpay', explode(",", env('PAYMENT_METHOD', 'atm,onepayfee,vnpay,onepaytg,momo'))))
                    <li class="p-2"><input required type="radio" name="payment" value="vnpay" id="radio_vnpay"> <label for="radio_vnpay"><strong>@lang('Quét mã QR qua VNPay (giảm 1%) (trên 100 triệu)')</strong></label>
                    <a class="small" target="_blank" href="https://anylearn.vn/helpcenter/19/huong-dan-thanh-toan-vnpay-tren-anylearn.html">Xem hướng dẫn thanh toán</a>
                    </li>
                    @endif 
                    @if(in_array('onepaytg', explode(",", env('PAYMENT_METHOD', 'atm,onepayfee,vnpay,onepaytg,momo'))))
                        @if ($order->amount >= 3000000)
                        <li class="p-2"><input required type="radio" name="payment" value="onepaytg" id="radio_onepaytg">
                            <label for="radio_onepaytg"><strong>@lang('Trả góp qua thẻ tín dụng (trên 3 triệu) (kỳ hạn 3 tháng) (0% lãi suất)')</strong></label>
                        </li>
                        @endif
                    @endif
                    @if(in_array('momo', explode(",", env('PAYMENT_METHOD', 'atm,onepayfee,vnpay,onepaytg,momo'))))
                        @if ($momoStatus && $order->amount >= 1000 && $order->amount <= 50000000)
                        <li class="p-2"><input required type="radio" name="payment" value="momo" id="radio_momo">
                            <label for="radio_momo"><strong>@lang('Thanh toán bằng ví MoMo')</strong></label>
                        </li>
                        @endif
                    @endif
                </ul>
                <p class="fw-bold" style="display: none;" id="save_card_block"><input type="checkbox" name="save_card" id="save_card"> <label for="save_card">@lang('Lưu thông tin thẻ cho lần thanh toán sau.')</label></p>
                @else
                <input type="hidden" name="payment" value="free">
                @endif

                <div class="border p-2 mb-2" style="max-height:150px; overflow-y: scroll;">{!! __($term) !!}</div>
                <p class="fw-bold d-flex"><input class="me-2" type="checkbox" name="accept_term" value="payment" id="accept_term" checked required> <label class="" for="accept_term">@lang('Tôi đồng ý với điều khoản thanh toán và') <a target="_BLANK" href="/privacy">@lang('chính sách bảo mật')</a> @lang('của Công ty')</label></p>
                <button class="btn btn-success border-0 rounded-pill mt-2 d-none d-sm-block" name="cart_action" value="pay">@lang('THANH TOÁN')</button>
                <button class="btn btn-success border-0 rounded-pill mt-2 d-block d-sm-none form-control" name="cart_action" value="pay">@lang('THANH TOÁN')</button>

            </div>
        </div>

    </form>
    @endsection
    @endif
    @section('jscript')
    @parent
    <script>
        $("input[name=payment]").on("click", function(event) {
            var value = $(this).val();
            if (value == "onepaylocal") {
                $("#save_card").prop("checked", true);
                $("#save_card_block").show();
            } else {
                $("#save_card_block").hide();
                $("#save_card").prop("checked", false);
            }
            if (value == "QR") {
                $("#qrcode").removeClass("d-none");
            } else {
                $("#qrcode").addClass("d-none");
            }
        });
    </script>
    @endsection