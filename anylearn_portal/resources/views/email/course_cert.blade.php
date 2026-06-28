@if($content)
{!! $content !!}
@else
<p>Chúc mừng {{ $name }} vừa hoàn thành khóa học {{ $class }}!</p>

<p>Chứng chỉ hoàn thành của bạn:</p>
<p><img src="{{ $cert }}" alt="" style="width: 80%;text-align:center;"></p>

<p>Trong trường hợp bạn cần hỗ trợ, vui lòng liên hệ Hotline 0374 900 344 email info@anylearn.vn.</p>

<p>Chúc bạn đạt được thêm nhiều thành tựu mới cùng anyLEARN, đừng quên để lại đánh giá của bạn cho khóa học và giới thiệu bạn bè cùng học để tích lũy thêm ưu đãi từ anyLEARN.</p>
<p>Trân trọng cảm ơn,</p>
<p>Đội ngũ anyLEARN </p>
@endif