@extends('layout')
@section('rightFixedTop')
<form class="row">
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success" href="{{ route('config.voucher.create') }}"><i class="fas fa-plus"></i> @lang('Thêm mới')</a>
    </div>
</form>
@endsection


@section('body')
@if(sizeof($vouchers) == 0)
<div class="text-center mt-5 pt-5">
    @lang('Chưa có voucher nào.')
</div>
@else
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-bordered table-striped">
            <thead>
                <thead>
                    <th class="text-center">#ID</th>
                    <th>Loại voucher</th>
                    <th>Cách tạo</th>
                    <th>Mã/Tiền tố voucher</th>
                    <th>Giá trị</th>                
                    <th>Rule > Đơn tối thiểu</th>
                    <th>Rule > Đơn tối đa</th>
                    <th>Số lượng</th>
                    <th>Khóa học</th>
                    <th>Tạo lúc</th>
                    <th>Thao tác</th>
                </thead>
            <tbody>
                @foreach($vouchers as $voucher)
                <tr>
                    <th class="text-center">{{ $voucher->id }}</th>
                    <td>{{ $voucher->type }}</td>
                    <td>{{ $voucher->generate_type }}</td>
                    <td>{{ $voucher->prefix }}</td>
                    <td>{{ $voucher->rule_value >= 1000 ? number_format($voucher->value, 0, ",", ".") : $voucher->value }}</td>
                    <td>{{ number_format($voucher->rule_min, 0, ",", ".") }}</td>
                    <td>{{ $voucher->rule_max >= 1000 ? number_format($voucher->rule_max, 0, ",", ".") : $voucher->rule_max }}</td>
                    <td>{{ $voucher->qtt }}</td>
                    <td>{{ $voucher->ext }}</td>
                    <td>{{ $voucher->updated_at }}</td>
                    <td>
                        <a class="btn btn-sm btn-info" href="{{ route('config.voucher.list', ['id' => $voucher->id]) }}">
                            Danh sách
                        </a>
                        <a class="btn btn-sm btn-{{ $voucher->status == 1 ? 'danger' : 'success' }}" href="{{ route('config.voucher.close', ['id' => $voucher->id, 'type' => 'group']) }}">
                        {{ $voucher->status == 1 ? 'Khóa' : 'Mở' }}
                        </a>
                        <a target="" class="btn btn-sm btn-primary mt-1" href="{{ route('config.voucher.csv', ['id' => $voucher->id]) }}">
                            Xuất file
                        </a>
                    </td>
                </tr>
                @endforeach
            </tbody>
            </thead>
        </table>
    </div>
    <div class="card-footer">
        {{ $vouchers->links() }}
    </div>
</div>

@endif

@endsection