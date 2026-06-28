@inject('userServ', 'App\Services\UserServices')
@extends('layout')

@section('body')
    <div class="card">
        <div class="card-body">
            <form>
                <table class="table table-striped">
                    <thead>
                        <tr>
                            <th>Người đăng ký</th>
                            <th>Loại hành động</th>
                            <th>Ngày thực hiện</th>
                            <th>Khóa học</th>
                            <th>Note</th>
                            {{-- <th>Trạng thái</th> --}}
                            {{-- <th>Hành động</th> --}}
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($data as $row)
                            <tr>
                                <td>{{ $row->name }}</td>
                                @if ($row->type == 'trial')
                                    <td>Học thử</td>
                                @elseif ($row->type == 'visit')
                                    <td>Tham quan </td>
                                @elseif ($row->type == 'test')
                                    <td>Kiểm tra</td>
                                @endif
                                <td>{{ date_format(date_create($row->date), 'Y-m-d') }}</td>
                                <td>{{ $row->title}}</td>

                                <td>{{ $row->note }}</td>
                                {{-- @if ($row->status == 1)
                                    <td><span class="badge bg-success text-white">Thành công</span></td>
                                @elseif($row->status == 0)
                                    <td><span class="badge bg-warning text-white">Đang chờ</span></td>
                                @else
                                    <td><span class="badge bg-danger text-white">Đã Hủy</span></td>
                                @endif --}}
                                {{-- @if ($row->status == 0)
                                <td>
                                    <div class="buttons">
                                        <button id="complete" name="complete" type="button"
                                            class="btn btn-sm btn-primary">Hoàn
                                            thành</button>
                                        <button id="cancel" name="cancel" type="button"
                                            class="btn btn-sm btn-secondary">Hủy</button>
                                    </div>

                                </td>
                                @else
                                <td></td>
                                @endif --}}

                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </form>
        </div>
    </div>
@endsection
