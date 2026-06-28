@if(!empty($mail_content))
{!! $mail_content !!}
@else 
<p>Chào {{ $data['user'] }},</p>

<p>Chúng tôi rất vui mừng thông báo rằng bạn đã đăng ký thành công cho khoá học 
<a style="text-decoration: none;" href="{{ $data['path'] }}">{{ $data['course'] }}</a> của chúng tôi. Để bắt 
đầu hành trình học tập, bạn cần kích hoạt khoá học bằng cách sử dụng thông tin dưới đây:</p>

@if ($data['method'] == \App\Constants\ItemConstants::ACTIVATION_SUPPORT_API) 
<p style="margin-bottom: 0;"><strong>Thông tin kích hoạt:</strong></p>
<ul style="list-style-type: none;">
    <li>Tài khoản: {{ $data['account'] }}</li>
    <li>Mật khẩu: {{ $data['password'] }}</li>
</ul>
@else 
<p>Mã kích hoạt: {{ $data['code'] }}</p>
@endif

<p>Để kích hoạt khoá học, hãy truy cập vào <a href="# ">đây</a> và làm theo các bước hướng dẫn.</p>

<p>Nếu bạn gặp bất kỳ vấn đề nào hoặc cần hỗ trợ, đừng ngần ngại liên hệ với chúng tôi tại 
<a href="mailto:info@anylearn.vn">info@anylearn.vn</a> hoặc qua hotline: <a href="tel:+84374900344">0374 900 344</a>.</p>

<p>Chúc bạn có một hành trình học tốt!</p>

<p>Thân,<br>anyLEARN</p>
@endif



