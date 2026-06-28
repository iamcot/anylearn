@inject('itemServ', 'App\Services\ItemServices')
@extends('anylearn.layout')
@section('spmb')
checkout-finish
@endsection
@section('body')
<div class="card mb-5 border-left-success shadow">
    <div class="card-header">
        <h5 class="modal-title m-0 font-weight-bold text-success"><i class="fa fa-check-double"></i> @lang('Thanh toán thành công!')
        </h5>
    </div>
    <div class="card-body p-0">
        <h5 class="p-3 text-success font-weight-bold">@lang('Đơn hàng đã được thanh toán và xác nhận thành công. Bạn hãy sử dụng APP để cập nhật lịch học một cách nhanh nhất nhé.')</h5>
        <table class="table table-stripped">
            <thead>
                <tr>
                    <th>#</th>
                    <th></th>
                    <th width="55%">@lang('Khoá học')</th>
                    <th class="text-right">@lang('Học phí')</th>
                </tr>
            <tbody>
                @foreach ($detail as $item)
                <tr>
                    <td>{{ $loop->index + 1 }}</td>
                    <td><img class="img-fluid" style="max-height: 80px" src="{{ $item->image }}"></td>
                    <td>
                        <strong class="text-success">
                            {{ $item->title }}
                        </strong>
                        @if ($item->childId != $user->id)
                        <span class="text-primary">({{ $item->childName }})</span>
                        @endif
                        @if($item->subtype != 'digital' && $item->subtype != 'video')
                        <br>Học tại {{ $item->plan_location_name }}; @foreach(explode(",", $item->plan_weekdays) as $day ) {{ $day == 1 ? __('Chủ Nhật') : __("Thứ " . ($day)) }} {{ !$loop->last ? ", " : ". " }} @endforeach
                        Bắt đầu từ {{ date("d/m/Y", strtotime($item->plan_date_start)) }}
                        @endif

                    </td>
                    <td class="text-right">{{ number_format($item->paid_price, 0, ',', '.') }}</td>
                </tr>
                @endforeach
            </tbody>

            </thead>
        </table>
    </div>
    <div class="card-footer">
        <div class="font-weight-bold float-right">
            @lang('TỔNG TIỀN:')
            <span class="text-danger">{{ number_format($order->amount, 0, ',', '.') }}</span>
        </div>
    </div>
</div>
@endsection