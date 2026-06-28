<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>@yield('title')</title>
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <!-- Custom fonts for this template-->
    <link href="/cdn/vendor/fontawesome-free/css/all.min.css" rel="stylesheet" type="text/css">
    <link href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i" rel="stylesheet">
    <!-- Custom styles for this template-->
    <link href="/cdn/css/sb-admin-2.min.css" rel="stylesheet">
    <link href="/cdn/onepage/css/style.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">
    <link href="/cdn/css/style.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">
    @yield('morestyle')
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-NKEYYJ92SP"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-NKEYYJ92SP');
    </script>
</head>

<body data-spy="scroll" data-target=".navbar" data-offset="50" id="body" class="only_portfolio_variation">
    @if(empty($isApp) || !$isApp)
    @include('layout.fixed_menu')
    @endif
    <!-- Parent Section -->
    <section class="page_content_parent_section">
        <!-- Header Section -->
        @if(empty($isApp) || !$isApp)
        <header>
            <!-- Navbar Section -->
            @include('../layout.page_nav')
            <!-- /Navbar Section -->
        </header>
        @endif
        <!-- /Header Section -->
        <section>
            @include('notify', ['notify' => session('notify', '')])
            <div class="container mt-5">
                @yield('body')
            </div>
        </section>
        @if(empty($isApp) || !$isApp)
        @include('layout.footer')
        @endif
    </section>

    <script src="/cdn/vendor/jquery/jquery.min.js"></script>
    <script src="/cdn/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
    <!-- Core plugin JavaScript-->
    <script src="/cdn/vendor/jquery-easing/jquery.easing.min.js"></script>
    <!-- Custom scripts for all pages-->
    <script src="/cdn/js/sb-admin-2.min.js"></script>
    <script>
        $('.toast').toast('show')
    </script>
    @yield('jscript')
</body>

</html>