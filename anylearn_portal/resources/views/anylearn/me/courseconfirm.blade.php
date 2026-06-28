@extends('anylearn.me.layout')
@section('spmb')
courseconfirm
@endsection
@section('body')
<h1 class="mb-4">Xác nhận tham gia khóa học</h1>

<div class="card shadow">
    <div class="card-body p-0">
        <table class="table table-striped text-secondary">
            <thead>
                <tr>
                    <th>Tên khóa học</th>
                    <th>Mã nhập học</th>
                    <th class="text-end">Xác nhận tham gia</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data as $row)
                <tr>
                    <td>{{ $row->title }}</td>
                    <td>{{ $row->id }}</td>
                    <td class="text-end">
                        @if ($row->participant_confirm_count == 0)
                        <a href="{{ route('class.author.confirmjoin' , ['itemId' => $row->courseId ]) }}?join_user={{ $row->user_id }}&join=99&orderId={{ $row->id }}" class="btn btn-primary btn-sm">Xác nhận tham gia</a>
                        @elseif ($row->confirm_count == 0)
                        <a class="badge bg-warning text-white">Đợi xác nhận</a>
                        @elseif ($row->participant_confirm_count == 1 & $row->confirm_count == 1)
                        <a class="badge bg-success text-white">Đã xác nhận</a>
                        @endif
                    </td>
                </tr>
                @endforeach
                <!-- Thêm các hàng mới tương ứng với từng khóa học cần xác nhận -->
            </tbody>
        </table>
    </div>
</div>
@endsection
