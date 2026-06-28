<!DOCTYPE html>
<html lang="en">

<head>
    @include('layout.onepage_header')
    <!-- Global site tag (gtag.js) - Google Analytics -->
    <script async src="https://www.googletagmanager.com/gtag/js?id="></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-NKEYYJ92SP');
    </script>
</head>

<body data-spy="scroll" data-target=".navbar" data-offset="50" id="body" class="only_portfolio_variation">
    @include('layout.fixed_menu')
    <!-- Loader -->
    <div class="loader">
        <div class="loader-inner">
            <div class="spinner">
                <div class="dot1"></div>
                <div class="dot2"></div>
            </div>
        </div>
    </div>
    <!-- Parent Section -->
    <section class="page_content_parent_section">
        <!-- Header Section -->
        <header>
            <!-- Navbar Section -->
            @include('home.navbar')
            <!-- /Navbar Section -->
            <!-- Main Slider Section -->
            @include('home.slider')
            <!-- /Main Slider Section -->
        </header>
        <!-- /Header Section -->

        @include('home.about')

        @include('home.feedback')

        @include('home.school')

        @include('home.teacher')

        @include('home.course')

        @include('home.benefit')

        @include('home.download')
        
        @include('layout.footer')
    </section>
    @include('dialog.searchpopup')

    @include('layout.onepage_script')
    <script src="/cdn/js/location-tree.js"></script>
    <script>
        $('#search-action').click(function() {
            $('#homesearchModal').modal('show');
        });
    </script>

    @if(!empty($popup))
        @include('dialog.homepopup', ['popup' => $popup]) 
        <script>
        $(function() {
        setTimeout(() => {
            $('#homepopupModal').modal('show');
        }, 2000);
        });
        </script>
    @endif

</body>

</html>
