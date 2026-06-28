@inject('userServ', 'App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
    child
@endsection
@section('body')
    <div class="container">
        <div class="row">
            <div class="col-md-12">
                <h1 class="text-center">Lịch sử học tập của {{ $userC->name}}</h1>
                <table class="table table-striped">
                    <thead class="text-secondary">
                        <tr>
                            <th>Ngày Mua</th>
                            <th>Khóa học</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($courses as $row)
                        <tr>
                            <td>{{ $row->created_at }}</td>
                            <td width="50%">{{ $row->title}}</td>
                            <td>{{ number_format($row->price) }} đ</td>
                            <td>
                                @if ($row->status ==1)
                                <span class="badge bg-success">Đã Mua</span>
                                @elseif ($row->status ==0)
                                <span class="badge bg-warning">Đợi Thanh Toán</span>
                                @else
                                <span class="badge bg-danger">Đã Hủy</span>
                                @endif

                            </td>
                        </tr>
                        @endforeach

                    </tbody>
                </table>
            </div>

        </div>
    </div>
@endsection
@section('jscript')
    @parent
@endsection
