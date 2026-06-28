@extends('layout')

@section('body')
    <table class="table align-middle mb-0 bg-white">
        <thead class="bg-light">
            <tr>
                <th>#ID</th>
                <th class="text-center">Đối tác</th>
                <th class="text-center">Khóa Học</th>
                <th class="text-center">Hình Thức</th>
                <th class="text-center">Lĩnh Vực</th>
                <th class="text-center">Giá</th>
                <th class="text-center">Đã bán / Cần bán</th>
                <th class="text-center">Doanh Thu</th>
                <th class="text-center">Thời Hạn</th>

            </tr>
        </thead>
        <tbody>
            @foreach ($data as $row)
                <tr>
                    <td>{{ $row->id }}</td>
                    <td class="text-center">
                        <div class="d-flex align-items-center">
                            @if ($row->image != null)
                                <div class="avatar avatar-sm"><img src="{{ $row->image }}" alt=""
                                        style="width: 45px; height: 45px" class="rounded-circle" />
                                </div>
                            @else
                                <div class="avatar avatar-sm"><img class="rounded-circle " src="/cdn/img/logo.png"
                                        alt="">
                                </div>
                            @endif
                            <div class="ms-3">
                                <p class="fw-bold mb-1">{{ $row->name }}</p>
                            </div>
                        </div>
                    </td>
                    <td class="text-center align-items-center" width="25%">

                        {{ $row->title }}
                    </td>
                    <td class="text-center align-items-center">
                        <span class="badge badge-success rounded-pill d-inline">{{ $row->subtype }}</span>
                    </td>
                    <td class="text-center align-items-center">{{ $row->category_names }}</td>
                    <td class="text-center align-items-center">{{ number_format($row->price) }}</td>
                    <td class="text-center align-items-center">{{ $row->quanity_purchased }}/{{ $row->seats }}</td>
                    <td class="text-center align-items-center">{{ number_format($row->price*$row->quanity_purchased) }}
                    </td>
                    <td class="text-center d-flex align-items-center">
                    </td>
                </tr>
            @endforeach

        </tbody>
    </table>
@endsection
