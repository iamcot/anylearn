@inject('itemServ','App\Services\ItemServices')
@extends('page_layout')
@section('body')

<div class="card mb-5 border-left-success shadow">
    <div class="card-header"><h5 class="modal-title m-0 font-weight-bold text-success"><i class="fa fa-check-double"></i> @lang('Thanh toán thành công!')</h5>
</div>
    <div class="card-body p-0">
        <h5 class="p-3 text-primary font-weight-bold">@lang('Đơn hàng đã được thanh toán và xác nhận thành công. Bạn hãy sử dụng APP để cập nhật lịch học một cách nhanh nhất nhé.')</h5>
        <table class="table table-stripped">
            <thead>
                <tr>
                    <th>#</th>
                    <th></th>
                    <th width="55%">@lang('Khoá học')</th>
                    <th class="text-right">@lang('Học phí')</th>
                </tr>
                <tbody>
                @foreach($detail as $item)
                <tr>
                    <td>{{ $loop->index + 1 }}</td>
                    <td><img class="img-fluid" style="max-height: 80px" src="{{ $item->image }}"></td>
                    <td>
                        @if($item->class_name)
                        {{ $item->class_name }} 
                        <span class="small text-danger">({{ $item->title }} )</span>
                        @else
                        {{ $item->title }} 
                        @endif
                    </td>
                    <td class="text-right">{{ number_format($item->paid_price, 0, ",", ".") }}</td>
                </tr>
                @endforeach
                </tbody>
              
            </thead>
        </table>
    </div>
    <div class="card-footer">
        <div class="font-weight-bold float-right">
            @lang('TỔNG TIỀN:')
            <span class="text-danger">{{ number_format($order->amount, 0, ",", ".") }}</span>
        </div>
    </div>
</div>
@endsection
@section('jscript')
@parent

@endsection