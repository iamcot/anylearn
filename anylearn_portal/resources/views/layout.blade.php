@inject('userServ','App\Services\UserServices')
<html lang="{{ App::getLocale() }}">

<head>
    <meta charset="utf-8">
    <meta name="data-spm" content="admin">
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
    <link href="/cdn/vendor/jquery/jquery-ui-1.13.2/jquery-ui.min.css" rel="stylesheet">
    <link href="/cdn/css/style.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">

    @yield('morestyle')
</head>

<body id="page-top" data-spm="@yield('spmb')">
    <!-- Page Wrapper -->
    <div id="wrapper">
        @include('layout.sidebar')
        <!-- Content Wrapper -->
        <div id="content-wrapper" class="d-flex flex-column @yield('main-bg')">
            <!-- Main Content -->
            <div id="content">
                @include('layout.topbar')
                <!-- Begin Page Content -->
                <div class="container-fluid">
                    @include('notify', ['notify' => session('notify', '')])
                    @include('warning', ['warning' => isset($warning) ? $warning : null])
                    @yield('body')
                </div>
                <!-- /.container-fluid -->
            </div>
            <!-- End of Main Content -->
            <!-- Footer -->
            <footer class="sticky-footer bg-white d-print-none">
                <div class="container my-auto">
                    <div class="copyright text-center my-auto">
                        <span>Copyright &copy; {{ env('APP_NAME') }} {{ date('Y') }}</span>
                    </div>
                </div>
            </footer>
            <!-- End of Footer -->
        </div>
        <!-- End of Content Wrapper -->
    </div>
    <!-- End of Page Wrapper -->
    <!-- Scroll to Top Button-->
    <a class="scroll-to-top rounded d-print-none" href="#page-top">
        <i class="fas fa-angle-up"></i>
    </a>
    <!-- Bootstrap core JavaScript-->
    <script src="/cdn/vendor/jquery/jquery.min.js"></script>
    <script src="/cdn/vendor/jquery/jquery-ui-1.13.2/jquery-ui.min.js"></script>

    <script src="/cdn/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
    <!-- Core plugin JavaScript-->
    <script src="/cdn/vendor/jquery-easing/jquery.easing.min.js"></script>
    <!-- Custom scripts for all pages-->
    <script src="/cdn/js/sb-admin-2.min.js"></script>
    <script>
        $('.toast').toast({
            "autohide": false,
        });

        $('.toast').toast('show');
    </script>
    @yield('jscript')
    <!-- <script type="text/javascript" src="https://anylearn.atlassian.net/s/d41d8cd98f00b204e9800998ecf8427e-T/azc3hx/b/8/c95134bc67d3a521bb3f4331beb9b804/_/download/batch/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector/com.atlassian.jira.collector.plugin.jira-issue-collector-plugin:issuecollector.js?locale=en-US&collectorId=7444ee51"></script> -->

</body>

</html>
