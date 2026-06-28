@extends('layout')

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
                    <th>Mã voucher</th>
                    <th>Giá trị</th>
                    <th>Số lượng</th>
                    <th>Đã dùng</th>
                    <th>Tạo lúc</th>
                    <th>Thao tác</th>
                </thead>
            <tbody>
                @foreach($vouchers as $voucher)
                <tr>
                    <th class="text-center">{{ $voucher->id }}</th>
                    <td>{{ $voucher->voucher }}</td>
                    <td>{{ $voucher->value }}</td>
                    <td>{{ $voucher->amount }}</td>
                    <td>{{ $voucher->used }}</td>
                    <td>{{ $voucher->updated_at }}</td>
                    <td>
                        <a class="btn btn-sm btn-{{ $voucher->status == 1 ? 'danger' : 'success' }}" href="{{ route('config.voucher.close', ['id' => $voucher->id, 'type' => 'voucher']) }}">
                        {{ $voucher->status == 1 ? 'Khóa' : 'Mở' }}
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