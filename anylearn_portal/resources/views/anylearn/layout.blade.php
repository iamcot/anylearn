@inject('transServ','App\Services\TransactionService')
<html lang="{{ App::getLocale() }}">

<head>
    <meta charset="utf-8">
    <meta name="data-spm" content="web">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="@yield('description')">
    <meta name="author" content="">
    <title>@yield('title')</title>
    <link rel="canonical" href="@yield('canonical')" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link href="/cdn/vendor/fontawesome-free/css/all.min.css" rel="stylesheet" type="text/css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/cdn/anylearn/bootstrap-5.1.1/css/bootstrap.min.css" rel="stylesheet">
    <link href="/cdn/anylearn/fontawesome/css/all.css" rel="stylesheet">
    <link href="/cdn/anylearn/owl.carousel.min.css" rel="stylesheet">
    <link href="/cdn/anylearn/style_landing2.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">
    <link href="/cdn/anylearn/style.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">

    @yield('morestyle')
    <script async src="https://www.googletagmanager.com/gtag/js?id=UA-170883972-1"></script>
    <script>
        window.dataLayer = window.dataLayer || [];

        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', 'UA-170883972-1');
    </script>
    <script>
        a_config = {
            "logUrl": "{{ route('anylog') }}",
            "uid": "{{ Auth::check() ? Auth::user()->id : '' }}",
            "lang": "{{ App::getLocale() }}",
        };
    </script>
</head>

<body data-spm="@yield('spmb')">
    <section>
        @if(empty($isApp) || !$isApp)
        <header>
            @include('anylearn.navbar')
        </header>
        @if((strpos(Route::currentRouteName(), 'checkout') !== false || Route::currentRouteName() != 'cart') && @auth()->check() && $transServ->hasPendingOrders(Auth::user()->id))
        <section class="container">
            <p class="mt-2 mb-2 p-2 bg-warning text-danger"><i class="fas fa-exclamation-triangle"></i>@lang('Chào ' . @auth()->user()->name . '. Bạn có đơn hàng đang chờ thanh toán.') <a href="{{ route('me.pendingorders') }}" class="text-danger strong">@lang('Thanh toán ngay!')</a></p>
        </section>
        @endif
        @endif
        <section @if(!empty($isApp) && $isApp) class="mt-5" @endif>
            @include('anylearn.widget.notify', ['notify' => session('notify', '')])
            <div class="container">
                @yield('body')
            </div>
        </section>
        @if(empty($isApp) || !$isApp)
        @include('anylearn.footer2')
        @endif
    </section>
    <script src="/cdn/anylearn/bootstrap-5.1.1/js/bootstrap.bundle.min.js"></script>
    <script src="/cdn/anylearn/jquery-3.6.0.min.js"></script>
    <script src="/cdn/anylearn/owl.carousel.min.js"></script>
    <script async src="/cdn/js/anylog.js"></script>
    @yield('jscript')
    <div class="zalo-chat-widget" data-oaid="3721021934871748468" data-welcome-message="Bạn đang muốn tìm kiếm khóa học nào thế ?" data-autopopup="3" data-width="300" data-height="500"></div>
    <script src="https://sp.zalo.me/plugins/sdk.js"></script>
</body>
<style>
    .omi-w-intro-img-container {
        display: none !important;
    }
</style>

</html>