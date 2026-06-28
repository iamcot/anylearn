@extends('anylearn.layout')
@section('title')
    @lang('Trang booking trường học Quốc tế, học viện, chuyên gia uy tín - anyLEARN')
@endsection
@section('description')
    @lang('anyLEARN là nền tảng booking, tư vấn giáo dục. Giúp cha mẹ giải quyết được vấn đề tìm trường học Quốc tế, khóa học, chuyên gia chất lượng cho con. Được thẩm định qua 4 bước chọn lọc. Khách quan, nhiều lợi ích tích điểm để tiết kiệm chi phí học tập lâu dài.')
@endsection
@section('spmb')
    home
@endsection
@section('body')
    @include('anylearn.home.banners')
    <section class="text-center">
        <h2 class="mt-3 fw-bold text-secondary">
            @lang('Nền tảng tìm kiếm Trường học và Chuyên gia hàng đầu, Khóa học Offline và Online')
        </h2>
        <div class="mt-3 text-center" id="search">
            <form action="/classes" method="get" id="schoolsearch" data-spm="search.0">
                <button class="border-0 bg-transparent" name="a" value="search">
                    <i class="fa fa-search text-success"></i>
                </button>
                <input type="text" name="s" class="form-control rounded-pill shadow"
                    placeholder="@lang('Tìm khoá học...')">
            </form>
        </div>
        <div id="quote" class="mt-3">
            <img id="quote-top" src="/cdn/anylearn/img/quote-top.svg" class="img-fluid" alt="">
            <img src="/cdn/anylearn/img/Bannerquotes.png" class="img-fluid" alt="">
            <span class="quote-text">{{ __($quote['quoteText']) }}<br>- {{ __($quote['quoteAuthor']) }}</span>
            <img id="quote-bottom" src="/cdn/anylearn/img/quote-bottom.svg" class="img-fluid" alt="">
        </div>
    </section>
    @include('anylearn.home.promotions', [
        'title' => $promotions_title,
        'carouselId' => 'promotions',
    ])
    @foreach ($classes as $classBlock)
        @include('anylearn.home.classes', [
            'title' => $classBlock['title'],
            'carouselId' => 'class_' . $loop->index,
            'data' => $classBlock['classes'],
        ])
        @if (count($classes) == 1 || $loop->index == floor(count($classes) / 2) - 1)
            @include('anylearn.home.articles', [
                'title' => $events_title,
                'carouselId' => 'events',
                'data' => $events,
            ])
        @endif
    @endforeach


    @include('anylearn.home.articles', [
        'title' => __('HỌC VÀ HỎI'),
        'carouselId' => 'asks',
        'data' => $articles,
    ])
    <section class="hot-items mt-5">
    </section>
@endsection
@section('jscript')
    <script>
        $(document).ready(function() {
            $('#banners .owl-carousel').owlCarousel({
                margin: 10,
                nav: true,
                loop: true,
                autoplay: true,
                autoplayTimeout: 3000,
                navText: [
                    '<span class="owl-carousel-control-icon rounded-circle border p-2 bg-white shadow"><i class="fas fa-2x fa-angle-left text-secondary"></i></span>',
                    '<span class="owl-carousel-control-icon-right rounded-circle border  p-2 bg-white shadow"><i class="fas fa-2x fa-angle-right text-secondary"></i></span>'
                ],
                responsive: {
                    0: {
                        items: 1
                    },
                }
            });
            $('.carousel3 .owl-carousel').owlCarousel({
                margin: 10,
                nav: true,
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
            $('.carousel4 .owl-carousel').owlCarousel({
                margin: 10,
                nav: true,
                navText: [
                    '<span class="owl-carousel-control-icon rounded-circle border p-2 bg-white shadow"><i class="fas fa-2x fa-angle-left text-secondary"></i></span>',
                    '<span class="owl-carousel-control-icon-right rounded-circle border  p-2 bg-white shadow"><i class="fas fa-2x fa-angle-right text-secondary"></i></span>'
                ],
                responsive: {
                    0: {
                        items: 2
                    },
                    600: {
                        items: 5
                    }
                }
            });
        });
    </script>
@endsection
