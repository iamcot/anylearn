@inject('userServ','App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
pending_orders
@endsection
@section('body')
{{-- <div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-striped text-secondary">
            <thead class="table-secondary text-secondary">
                <tr>
                    <th class="text-center border-0" width="5%" scope="col">#ID</th>
                    <th class="border-0">@lang('Khoá học')</th>
                    <th class="text-center border-0">@lang('Số tiền')</th>
                    <th class="text-center border-0">@lang('Ngày')</th>
                    <th width="15%" class="text-right border-0" scope="col">@lang('Thao tác')</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($orders))
                @foreach($orders as $row)
                <tr>
                    <th class="text-center" scope="row">{{ $row->id }}</th>
<td>{{ $row->classes }}</td>
<td class="text-center" scope="row">{{ number_format($row->amount) }}</td>
<td class="text-center" scope="row">{{ $row->created_at }}</td>
<td class="text-right">
<a href="{{ route('me.cancelpending', ['orderId' => $row->id]) }}" class="btn btn-danger btn-sm border-0 rounded-pill">HỦY</a> 
    <a href="{{ route('checkout.paymenthelp', ['order_id' => $row->id]) }}" class="btn btn-success btn-sm border-0 rounded-pill">Thanh toán</a>
</td>
</tr>
@endforeach
@endif
</tbody>
</table>
<div>{{ $orders->links() }}</div>
</div>
</div> --}}
<h1 class="">Khoá học đang chờ thanh toán</h1>

<div class="card shadow">
    <div class="card-body p-0">
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
                @if(!empty($orders))
                @foreach($orders as $row)
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
                @endif
            </tbody>
        </table>
        <div>{{ $orders->links() }}</div>
    </div>
</div>
@endsection