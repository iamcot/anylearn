<html lang="{{ App::getLocale() }}">

<head>
    <meta charset="utf-8">
    <meta name="data-spm" content="me">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">
    <title>@yield('title')</title>
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link href="/cdn/vendor/fontawesome-free/css/all.min.css" rel="stylesheet" type="text/css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/cdn/css/sb-admin-2.min.css" rel="stylesheet">
    <link href="/cdn/anylearn/bootstrap-5.1.1/css/bootstrap.min.css" rel="stylesheet">
    <link href="/cdn/anylearn/fontawesome/css/all.css" rel="stylesheet">
    <link href="/cdn/anylearn/owl.carousel.min.css" rel="stylesheet">
    <link href="/cdn/vendor/jquery/jquery-ui-1.13.2/jquery-ui.min.css" rel="stylesheet">
    {{-- <link href="/cdn/anylearn/style_landing2.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet"> --}}
    <link href="/cdn/anylearn/style.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">
    {{-- <link href="/cdn/anylearn/style_landing2.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet"> --}}

    @yield('morestyle')
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-NKEYYJ92SP"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', 'G-NKEYYJ92SP');
    </script>
     <script>
        a_config = {
            "logUrl": "{{ route('anylog') }}",
            "uid": "{{ Auth::check() ? Auth::user()->id : '' }}",
            "lang": "{{ App::getLocale() }}",
        };
    </script>
</head>
<body id="admin-top" data-spm="@yield('spmb')">
    <div id="wrapper">
        <div id="content-wrapper" class="d-flex flex-column">
            <div id="content" class="mb-4">
                @include('anylearn.me.topbar')
                {{-- @include('anylearn.me.avatar') --}}
                <div class="container-fluid">
                @include('anylearn.widget.notify', ['notify' => session('notify', '')])
                    <div class="d-flex">
                        <div class="">
                            @if (Auth::user()->role == 'school')
                                @include('anylearn.me.sidebar_school')
                            @else
                                @include('anylearn.me.sidebar')
                            @endif
                        </div>
                        <div class="text-secondary is-content">
                            @if($navText ?? '')
                            <h1 class="h5 text-gray-800 mb-3">
                            @if($hasBack ?? false)
                                @if ($hasBack === true)
                                <a href="javascript:window.history.back()"><i class="fas  fa-arrow-left"></i></a>
                                @else
                                <a href="{{ $hasBack }}"><i class="fas  fa-arrow-left"></i></a>
                                @endif
                            @endif
                                {{ $navText ?? '' }}
                            </h1>
                            @endif
                            @yield('body')
                        </div>
                    </div>
                </div>
            </div>
            @include('anylearn.footer2')
        </div>
    </div>
    <a class="scroll-to-top rounded d-print-none" href="#admin-top">
        <i class="fas fa-angle-up"></i>
    </a>
    <script src="/cdn/anylearn/bootstrap-5.1.1/js/bootstrap.bundle.min.js"></script>
    <script src="/cdn/anylearn/jquery-3.6.0.min.js"></script>
    <script src="/cdn/vendor/jquery/jquery-ui-1.13.2/jquery-ui.min.js"></script>
    <script src="/cdn/anylearn/owl.carousel.min.js"></script>
    <script src="/cdn/js/sb-admin-2.min.js"></script>
    <script async src="/cdn/js/anylog.js"></script>
    @yield('jscript')
</body>

</html>
