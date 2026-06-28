@inject('transServ','App\Services\TransactionService')
@extends('layout')

@section('rightFixedTop')
<!-- <form class="row">
    <div class="col-xs-4 mr-1">
        <select class="form-control" name="t" id="">
            <option {{ app('request')->input('t') == 'type' ? 'selected' : '' }} value="type">Loại giao dịch (deposit, withdraw)</option>
            <option {{ app('request')->input('t') == 'status' ? 'selected' : '' }} value="status">Trạng thái (0, 1, 99)</option>
        </select>
    </div>
    <div class="col-xs-7 mr-1">
        <input value="{{ app('request')->input('s') }}" type="text" class="form-control" name="s" placeholder="{{ __('Tìm kiếm') }}" />
    </div>
    <div class="col-xs-1">
        <button class="btn btn-primary btn"><i class="fas fa-search"></i></button>
    </div>
</form> -->
@endsection

@section('body')
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-striped table-hover table-bordered">
            <thead class="">
                <tr>
                    <th class="text-center" width="5%" scope="col">#ID</th>
                    <th class="text-center">@lang('User (SDT)')</th>
                    <th>@lang('Khoá học')</th>
                    <th class="text-center">@lang('Số tiền')</th>
                    <th class="text-center">@lang('Ngày')</th>
                    <th width="15%" class="text-right" scope="col">@lang('Thao tác')</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($orders))
                @foreach($orders as $row)
                <tr>
                    <th class="text-center" scope="row">{{ $row->id }}</th>
                    <td class="text-center" scope="row">{{ $row->name . '(' . $row->phone . ')'}}</td>
                    <td>{{ $row->classes }}</td>
                    <td class="text-center" scope="row">{{ number_format($row->amount) }}</td>
                    <td class="text-center" scope="row">{{ $row->created_at }}</td>
                    <td class="text-right">
                        <a data-orderid="{{$row->id}}" data-orderamount="{{$row->amount}}" href="{{ route('order.approve', ['orderId' => $row->id]) }}" class="btn btn-success btn-sm admin-approve">@lang('Duyệt đơn')</a>
                    </td>
                </tr>
                @endforeach
                @endif
            </tbody>
        </table>

    </div>
    <div class="card-footer">
        <div>{{ $orders->links() }}</div>
    </div>
</div>
@endsection
@section('jscript')
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-170883972-1"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'UA-170883972-1', { 'send_page_view': false });
    $(".admin-approve").on("click", function(event) {
            var orderId = $(this).data('orderid');
            var orderAmount = $(this).data('orderamount');
            gtag("event", "purchase", {
                "transaction_id": orderId,
                "currency": "VND",
                "value": orderAmount,
                "items": []
            });
            return;
        });
</script>
@endsection