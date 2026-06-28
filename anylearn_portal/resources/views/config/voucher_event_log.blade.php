@extends('layout')

@section('body')
@if(sizeof($data) == 0)
<div class="text-center mt-5 pt-5">
    @lang('Chưa có ai sử dụng sự kiện này.')
</div>
@else
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-bordered table-striped">
            <thead>
                <thead>
                    <th class="text-center">#ID</th>
                    <th>Thành viên</th>
                    <th>Khởi tạo</th>
                    <th>Bộ Voucher</th>
                    <th>Dữ liệu</th>
                    <th>Tạo lúc</th>
                    <th>Thao tác</th>
                </thead>
            <tbody>
                @foreach($data as $voucher)
                <tr>
                    <th class="text-center">{{ $voucher->id }}</th>
                    <td>{{ $voucher->user_id }}</td>
                    <td>{{ $voucher->trigger }}</td>
                    <td>{{ $voucher->target }}</td>
                    <td>{{ $voucher->data }}</td>
                    <td>{{ $voucher->updated_at }}</td>
                    <td>
                     
                    </td>
                </tr>
                @endforeach
            </tbody>
            </thead>
        </table>
    </div>
    <div class="card-footer">
        {{ $data->links() }}
    </div>
</div>

@endif

@endsection