@inject('itemServ','App\Services\ItemServices')
@extends('page_layout')
@section('body')

<div class="card mb-2 border-left-primary shadow">
    <div class="card-header">
        <h5 class="modal-title m-0 font-weight-bold text-primary"><i class="fa fa-shopping-cart"></i> @lang('Đơn hàng của bạn')</h5>
    </div>
    <div class="card-body p-0">
        @if(empty($order))
        <p class="p-2">@lang('Bạn không có đơn hàng nào. Nhấn nút quay lại và tìm hiểu thêm về các khoá học của anyLEARN nhé.')</p>
        @if(!empty($pending))
        <section class="p-2">
            <hr>
            <p class="bg-warning text-danger"><i class="fas fa-exclamation-triangle"></i>@lang('Opps, Bạn có đơn hàng đang chờ thanh toán.') </p>
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
                    <a href="{{ route('order.reject', ['orderId' => $row->id]) }}" class="btn btn-danger btn-sm mt-1 col-10">HỦY</a>    
                    <a href="{{ route('checkout.paymenthelp', ['order_id' => $row->id]) }}" class="btn btn-success btn-sm border-0 rounded-pill">Thanh toán</a></td>
                </tr>
                @endforeach
            </tbody>
        </table>
        </section>
        @endif
        @else
        <table class="table table-stripped">
            <thead>
                <tr>
                    <th>#</th>
                    <th></th>
                    <th width="55%">@lang('Khoá học')</th>
                    <th class="text-right">@lang('Học phí')</th>
                    <th></th>
                </tr>
            <tbody>
                @foreach($detail as $item)
                <tr>
                    <td>{{ $loop->index + 1 }}</td>
                    <td><img class="img-fluid" style="max-height: 80px" src="{{ $item->image }}"></td>
                    <td>
                        {{ $item->title }}
                        <br>Học tại {{ $item->plan_location_name }}; @foreach(explode(",", $item->plan_weekdays) as $day ) {{ $day == 1 ? __('Chủ Nhật') : __("Thứ " . ($day)) }} {{ !$loop->last ? ", " : ". " }} @endforeach
                        Bắt đầu từ {{ date("d/m/Y", strtotime($item->plan_date_start)) }}
                    </td>
                    <td class="text-right">{{ number_format($item->paid_price, 0, ",", ".") }}</td>
                    <td>
                        @if($api_token)
                        <a href="{{ route('checkout.remove2cart', ['odId' => $item->id, 'api_token' => $api_token ]) }}" class="btn btn-sm btn-danger" title="Xoá khỏi giỏ hàng"><i class="fa fa-trash"></i></a>
                        @else
                        <a href="{{ route('checkout.remove2cart', ['odId' => $item->id ]) }}" class="btn btn-sm btn-danger" title="Xoá khỏi giỏ hàng"><i class="fa fa-trash"></i></a>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>

            </thead>
        </table>
        @endif
    </div>
    <div class="card-footer">
        @if(!empty($order))
        <div class="font-weight-bold float-right">
            @if(!empty($voucherUsed))
            <span class="text-success">( Áp dụng Mã giảm giá: {{ $voucherUsed->voucher }} )</span>
            @endif
            @lang('TỔNG TIỀN:')
            <span class="text-danger">{{ number_format($order->amount, 0, ",", ".") }}</span>
        </div>
        @endif
    </div>
</div>
@if($api_token)
<form method="POST" action="{{ route('applyvoucher', ['api_token' => $api_token]) }}" id="cartvoucher">
    @else
    <form method="POST" action="{{ route('applyvoucher') }}" id="cartvoucher">
        @endif
        @csrf
        @if(!empty($order))
        <input type="hidden" name="order_id" value="{{ $order->id }}">
        @endif
        <div class="card mb-2 border-left-success shadow">
            <div class="card-body">
                <label for="" class="font-weight-bold text-success">Mã giảm giá</label>
                <div class="row">
                    <div class="form-group col-6">
                        <input type="text" class="form-control" name="payment_voucher" value="{{ !empty($voucherUsed) ? $voucherUsed->voucher : '' }}">
                    </div>
                    <div class="form-group col-4">
                        @if (empty($voucherUsed))
                        <button class="btn btn-success" name="cart_action" value="apply_voucher">Áp dụng</button>
                        @else
                        <input type="hidden" name="voucher_userd_id" value="{{ $voucherUsed->id }}">
                        <button class="btn btn-danger" name="cart_action" value="remove_voucher">Huỷ</button>
                        @endif
                    </div>
                </div>
            </div>
        </div>
    </form>
    @if($api_token)
    <form method="POST" action="{{ route('payment', ['api_token' => $api_token]) }}" id="cartsubmit">
        @else
        <form method="POST" action="{{ route('payment') }}" id="cartsubmit">
            @endif
            @csrf
            @if(!empty($order))
            <input type="hidden" name="order_id" value="{{ $order->id }}">
            @endif
            <div class="card mb-2 border-left-success shadow">
                <div class="card-header">
                    <h5 class="modal-title m-0 font-weight-bold text-success"><i class="fa fa-wallet"></i> Phương thức Thanh toán</h5>
                </div>
                <div class="card-body">
                    <ul class="list-unstyled">
                        @foreach($payments as $key => $payment)
                        <li><input required type="radio" name="payment" value="{{ $key }}" id="radio_{{ $key }}"> <label for="radio_{{ $key }}"><strong>{{ $payment['title'] }}</strong></label></li>
                        @endforeach
                    </ul>
                    <div class="border shadow p-2 mb-2" style="max-height:150px; overflow-y: scroll;">{!! $term !!}</div>
                    <p class="font-weight-bold"><input type="checkbox" name="accept_term" value="payment" id="accept_term" required> <label for="accept_term">Tôi đồng ý với điều khoản thanh toán</label></p>
                </div>
                <div class="card-footer">
                    <button class="btn btn-success" name="cart_action" value="pay">THANH TOÁN</button>
                </div>
            </div>
        </form>
        @endsection