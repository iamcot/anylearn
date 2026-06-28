@if (!empty($orderData))
<div style="margin-left: 20px; color: #000; font-size: 16px; line-height: 24px;">
    <p>Khóa học: {{ $orderData->title }}</p>
    <p>Đơn vị: {{ $partner->name }}</p>
    <p>Học phí: {{ number_format($orderData->unit_price) }}đ</p>
    <p>Học viên: {{ $orderData->childName }}</p>

    @if($orderData->plan_location_name)
        <p>Nơi học: {{ $orderData->plan_location_name }}</p>
        <p>Lịch học: 
        @foreach(explode(",", $orderData->plan_weekdays) as $day ) {{ 
           $day == 1 ? __('Chủ Nhật') : __("Thứ " . ($day)) }}{{ !$loop->last ? ", " : "" }} 
        @endforeach</p>
        <p>Ngày bắt đầu: {{ date("d/m/Y", strtotime($orderData->plan_date_start)) }}</p>    
    @else
       <p>Ngày bắt đầu: {{ date('d/m/Y', strtotime($orderData->date_start)) }}</p>
    @endif

    @if(!empty($orderData->plan_info))
        {!! $orderData->plan_info !!}
    @endif

    @if(!empty($extraFee) && count($extraFee) > 0)
    <p>Phụ phí:
    <ul>
        @foreach($extraFee as $extra)
        <li> {{ $extra->title}}: {{ number_format($extra->price) }}₫</li>
        @endforeach
    </ul>
    </p>
    @endif
</div>
@endif