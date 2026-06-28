@inject('userServ','App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
order-return
@endsection
@section('body')
<h1 class="mb-4">Danh sách đơn hàng</h1>
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <p class="small px-3 py-2 m-0">
            Để hoàn trả đơn hàng, vui lòng thực hiện thao tác <strong>Hoàn trả</strong> bên dưới hoặc liên hệ hotline 
            <a href="tel:0374900344">+84 37 490 0344</a>.
        </p>
        <table class="table table-striped text-secondary">
            <thead>
                <tr>
                    <th class="text-center" width="5%" scope="col">#ID</th>
                    <th>@lang('Khóa học')</th>
                    <th class="text-center" width="10%">@lang('Số lượng')</th>      
                    <th class="text-center" width="15%">@lang('Số tiền')</th>                 
                    <th width="10%">@lang('Thời gian')</th>
                    <th width="10%">@lang('Trạng thái')</th>
                    <th class="text-center" width="10%" scope="col">@lang('Thao tác')</th>
                </tr>
            </thead>
            <tbody>
                @foreach($orders as $row)
                <tr>
                    <td class="text-center">{{ $row->id }}</td>
                    <td>{{ $row->classes }}</td>
                    <td class="text-center">{{ number_format($row->quantity) }}</td>
                    <td class="text-center">{{ number_format($row->amount) }}</td>    
                    <td>{{ date('d-m-Y', strtotime( $row->created_at)) }}</td>           
                    <td>              
                        @if ($row->status == \App\Constants\OrderConstants::STATUS_RETURN_BUYER_PENDING)
                            <span class="badge badge-pill badge-info">@lang('Đang xử lý')</span>
                        @elseif ($row->status == \App\Constants\OrderConstants::STATUS_RETURN_SYSTEM)
                            <span class="badge badge-pill badge-success">@lang('Đã hoàn trả')</span>
                        @endif   
                    </td>
                    
                    <td class="text-center">
                        @if ($row->status == \App\Constants\OrderConstants::STATUS_DELIVERED) 
                        <a class="btn btn-sm btn-danger btn-need-confirm" 
                            href="{{ route('me.order.return.send-request', ['id' => $row->id]) }}">
                            @lang('Hoàn trả')
                        </a>
                        @elseif ($row->status == \App\Constants\OrderConstants::STATUS_RETURN_BUYER_PENDING)
                            <a href="#" class="btn btn-sm btn-light disabled" tabindex="-1" role="button" aria-disabled="true">@lang('Hoàn trả')</a>
                        @else 
                            <a href="#" class="btn btn-sm btn-light disabled invisible" tabindex="-1" role="button" aria-disabled="true">@lang('Hoàn trả')</a>
                        @endif
                    </td>
                    
                </tr>
                @endforeach
            </tbody>
        </table>
        <div>{{ $orders->links() }}</div>
    </div>
</div>
@endsection
@section('jscript')
<script>
    $('.btn-need-confirm').on("click", function(event) {
        var href = $(this).attr("href");
      
        if (!confirm("Bạn có chắc muốn thực hiện thao tác này?")) {
            return false;
        }
    });
</script>
@endsection 