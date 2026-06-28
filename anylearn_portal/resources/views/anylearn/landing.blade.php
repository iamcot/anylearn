<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="anyLEARN là nền tảng cung cấp dịch vụ trong lĩnh vực Giáo dục - Đào tạo, đi đầu về chuyển đổi số trong ngành giáo dục tại Việt Nam.">
    <meta name="author" content="">
    <title>Về Chúng Tôi - anyLEARN Trang Web Tổng Hợp và Chi Tiết Các Trường Học, Khóa Học Online và Offline</title>
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link href="/cdn/vendor/fontawesome-free/css/all.min.css" rel="stylesheet" type="text/css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link href="/cdn/anylearn/bootstrap-5.1.1/css/bootstrap.min.css" rel="stylesheet">
    <link href="/cdn/anylearn/fontawesome/css/all.css" rel="stylesheet">
    <link href="/cdn/anylearn/owl.carousel.min.css" rel="stylesheet">
    <link href="/cdn/anylearn/style.css?v{{ env('CDN_VERSION', '1.0.0') }}" rel="stylesheet">
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-NKEYYJ92SP"></script>
    <script>
        // window.dataLayer = window.dataLayer || [];

        // function gtag() {
        //     dataLayer.push(arguments);
        // }
        // gtag('js', new Date());
        // gtag('config', 'G-NKEYYJ92SP');
    </script>
</head>

<body>
<script id="omiWidget" type="text/javascript" src="https://cdn.omicrm.com/widget/main.js#domain=infoanylearn;"></script>
    <section>
        <header>
            @include('anylearn.navbar')
        </header>
        @include('anylearn.landing.banner')
        @include('anylearn.landing.info')
        @include('anylearn.landing.feature')
        @include('anylearn.landing.number')
        @include('anylearn.landing.review')
        @include('anylearn.landing.category')
        @include('anylearn.landing.school')
        @include('anylearn.landing.partner')
        @include('anylearn.landing.guarantee')
        @include('anylearn.landing.teacher')
        @include('anylearn.footer')
    </section>
    <script src="/cdn/anylearn/bootstrap-5.1.1/js/bootstrap.bundle.min.js"></script>
    <script src="/cdn/anylearn/jquery-3.6.0.min.js"></script>
    <script src="/cdn/anylearn/owl.carousel.min.js"></script>
    <script>
    $(document).ready(function() {
        $('.owl-carousel').owlCarousel({
            margin: 10,
            nav:true,
            navText: [
                '<span class="owl-carousel-control-icon rounded-circle border p-2 bg-white shadow"><i class="fas fa-2x fa-angle-left text-secondary"></i></span>',
                '<span class="owl-carousel-control-icon-right rounded-circle border  p-2 bg-white shadow"><i class="fas fa-2x fa-angle-right text-secondary"></i></span>'
            ],
            responsive: {
                0: {
                    items: 1
                },
                600: {
                    items: 3
                }
            }
        });
       
    });
    </script>
</body>

</html>