<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8"/><link rel="icon" href="/cdn/anylearn3/0.0.3/logo.png"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="theme-color" content="#000000"/><meta name="description" content="anyLEARN"/><link rel="apple-touch-icon" href="/cdn/anylearn3/0.0.3/logo.png"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick.min.css"/><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/slick-carousel/1.8.1/slick-theme.min.css"/><link rel="manifest" href="/cdn/anylearn3/0.0.3/manifest.json"/><title>anyLEARN</title><script defer="defer" src="/cdn/anylearn3/0.0.3/static/js/main.js?v=0.0.3"></script><link href="/cdn/anylearn3/0.0.3/static/css/main.css?v=0.0.3" rel="stylesheet">
    <link rel="canonical" href="@yield('canonical')" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link href="/cdn/vendor/fontawesome-free/css/all.min.css" rel="stylesheet" type="text/css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap"
        rel="stylesheet">
    <link href="/cdn/anylearn/bootstrap-5.1.1/css/bootstrap.min.css" rel="stylesheet">
    <link href="/cdn/anylearn/fontawesome/css/all.css" rel="stylesheet">
    <link href="/cdn/anylearn/owl.carousel.min.css" rel="stylesheet">
    <link href="/cdn/anylearn/style_landing2.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">
    <link href="/cdn/anylearn/style.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">
</head>

<body id="page-top" data-spm="@yield('spmb')">
    <noscript>You need to enable JavaScript to run this app.</noscript>
    @if (strpos(request()->path(), 'me') === false)
        @include('anylearn3.header')
    @else
        @include('anylearn3.headerme')
    @endif
    <div id="root">

    </div>
    @if (strpos(request()->path(), 'me') === false)
        @include('anylearn.footer2')
    @endif
     <script src="/cdn/anylearn/bootstrap-5.1.1/js/bootstrap.bundle.min.js"></script>
    <script src="/cdn/anylearn/jquery-3.6.0.min.js"></script>
    <script src="/cdn/anylearn/owl.carousel.min.js"></script>
    <script async src="/cdn/js/anylog.js"></script>
    @yield('jscript')
</body>

</html>
