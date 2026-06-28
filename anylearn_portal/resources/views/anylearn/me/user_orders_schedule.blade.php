@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')

@extends('anylearn.me.layout')
@section('spmb')
orders
@endsection
@section('body')
<div class="card">
    <div class="card-body">
        @if($item->subtype == 'digital')
        @if (!empty($code))
        @if( $item->activation_support == 'api')
        <p>Thông tin kích hoạt của bạn là:</p>
        @php $account = json_decode($code, true) @endphp
        <ul style="list-style-type: none;">
            <li>Tài khoản: {{ isset($account['account']) ? $account['account'] : "" }}</li>
            <li>Mật khẩu: {{ isset($account['password']) ? $account['password'] : "" }}</li>
        </ul>
        @else
        <p>Mã kích hoạt của bạn là: <strong>{{ $code }}</strong></p>
        @endif
        <p>Vui lòng kiểm tra email hoặc <a href="{{ $itemServ->classUrl($item->id) }}" target="_blank">Trang khóa học</a> để biết cách sử dụng mã kích hoạt. </p>
        <p>hoặc liên hệ hotline anyLEARN để được hỗ trợ </p>
        @else
        <p>Tạm thời chưa có mã kích hoạt</p>
        <p>Học viên vui lòng kiểm tra email</p>
        <p>hoặc Bạn vui lòng liên hệ với hotline anyLEARN để được hỗ trợ</p>

        @endif
        @elseif($item->subtype == 'video')
        <p>Xem khóa học video tại <a href="{{ $itemServ->classUrl($item->id) }}" target="_blank">Trang khóa học</a></p>
        @elseif(!empty($schedule))
        <div>
            <h2>Danh sách các buổi học tiếp theo</h2>
            <table class="table table-striped " id="myTable">
                <thead>
                    <tr class="text-secondary">
                        <th class="text-center">STT</th>
                        <th>Ngày học</th>
                        <th>Thời gian</th>
                        <th>Địa điểm</th>
                        <th class="text-center">Bản đồ</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($daylist as $key => $date)
                    <tr {{--style="{{ $date < $currentDate ? 'background: #ddd' : 'background: #4fd172'}}"--}}>
                        <td class="text-center">{{ $key + 1 }}</td>
                        <td>{{ $date }}</td>
                        <td>{{ $schedule->time_start }} - {{ $schedule->time_end }}</td>
                        @if (!empty($location))
                        <td>{{ $location->address }} - {{ $location->ward_path }}</td>
                        <td class="text-center"><a href="https://www.google.com/maps/search/?api=1&query={{ $location->latitude }},{{ $location->longitude }}" target="_blank" rel="noopener noreferrer">@lang('Xem')</a> </td>
                        @else
                        <td>Chưa cập nhật</td>
                        <td></td>
                        @endif
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @else
        <p>Khoá học: <strong>{{ $item->title }}</strong></p>
        @if ($item->date_start)
        <p>Ngày bắt đầu dự kiến: <strong>{{ $item->date_start }} </strong> @if ($item->time_start) <br> Giờ bắt đầu: <strong>{{ $item->time_start }} </strong> @endif</p>
        @else
        <p>Khóa học chưa có lịch học cụ thể nào. Vui lòng kiểm tra với anyLEARN qua hotline hoặc trực tiếp với đối tác.</p>
        @endif
        @endif
    </div>
</div>
@endsection