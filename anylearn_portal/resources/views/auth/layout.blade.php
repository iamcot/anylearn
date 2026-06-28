<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>{{ env('APP_NAME_LONG') }}</title>
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <!-- Custom fonts for this template-->
    <link href="/cdn/vendor/fontawesome-free/css/all.min.css" rel="stylesheet" type="text/css">
    <link href="https://fonts.googleapis.com/css?family=Nunito:200,200i,300,300i,400,400i,600,600i,700,700i,800,800i,900,900i" rel="stylesheet">
    <!-- Custom styles for this template-->
    <link href="/cdn/css/sb-admin-2.min.css" rel="stylesheet">
    <link href="/cdn/css/style.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">
    @yield('morestyle')
</head>

<body id="page-top">
    @include('notify', ['top' => '15px', 'notify' => session('notify', '') ])
    @yield('body')
    <!-- Bootstrap core JavaScript-->
    <script src="/cdn/vendor/jquery/jquery.min.js"></script>
    <script src="/cdn/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
    <!-- Core plugin JavaScript-->
    <script src="/cdn/vendor/jquery-easing/jquery.easing.min.js"></script>
    <!-- Custom scripts for all pages-->
    <script>
        $('.toast').toast('show')
    </script>
    @yield('jscript')
</body>

</html>