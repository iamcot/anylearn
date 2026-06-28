<!doctype html>
<html>
<head>
    <title>Trợ lý ảo anyLEARN</title>
    <meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/cdn/anylearn/bootstrap-5.1.1/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="/cdn/anylearn/chatbot/assets/css/chat.css">
</head>
<body>
<script>
    var chatbotConfig =  {
        userId:  1,
        introMessage: "<span>Xin chào {{ Auth::check() ? Auth::user()->name : '' }}, mình là  trợ lý ảo anyLEARN - chuyên viên chăm sóc khách hàng tự động của anyLEARN, rất vui được hỗ trợ bạn. Mình có thể giúp gì cho bạn hôm nay?</span>",
        greetingCard: `{!! $greetingCard !!}`,
    }
</script>

<script src="/cdn/anylearn/chatbot/js/chat.js"></script>

</body>
</html>
