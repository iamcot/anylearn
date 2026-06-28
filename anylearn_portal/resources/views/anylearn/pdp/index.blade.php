@inject('itemServ', 'App\Services\ItemServices')
@inject('videoServ', 'App\Services\VideoServices')
@extends('anylearn.layout')
@section('title')
    {{ $item->title }}
@endsection
@section('spmb')
    pdp
@endsection
@section('canonical')
    {{ $itemServ->classUrl($item->id) }}
@endsection

@section('body')
    <style>
        p {
            font-size: 18px;
            margin-bottom: 10px;
        }

        .img-fluid {
            max-width: 100%;
        }

        .price {
            display: flex;
            align-items: center;
            font-size: 24px;
        }

        .actual-price {
            font-weight: 600;
            color: rgb(75, 163, 91) !important;
            font-size: 2rem;
            margin-right: 10px;
        }

        .original-price {
            text-decoration: line-through;
            margin-right: 10px;
        }
    </style>
    <section class="container mt-5" id="spmc" data-spm="{{ $item->id }}">
        <div class="card shadow border-0">
            <div class="card-body">
                <div class="row mt-2">
                    <div class="col-lg-5 col-md-6 imagebox">
                        <img src="{{ $item->image }}" class="img-fluid rounded" />
                    </div>
                    <div class="col-lg-7 col-md-6">
                        @include('anylearn.widget.breadcrumb', ['breadcrumb' => $breadcrumb])

                        <h2 class="text-dark fw-bold">[{{ $item->subtype }}] {{ $item->title }}</h2>
                        <p class=""><i
                                class=" text-success fa fa-{{ $author->role == 'teacher' ? 'user' : 'university' }}"></i>
                            <a href="{{ route('classes', [
                                'role' => $author->role,
                                'id' => $author->id,
                            ]) }}"
                                class="text-decoration-none text-success">{{ $author->name }}</a>
                        </p>
                        @include('anylearn.widget.rating', ['score' => $item->rating ?? 0])
                        @if ($item->ages_min > 0 && $item->ages_max > 0)
                            <p><strong>@lang('Độ tuổi:')</strong> {{ $item->ages_min . '-' . $item->ages_max }}</p>
                        @else
                            <p><strong>@lang('Độ tuổi:')</strong> Đang cập nhật </p>
                        @endif
                        @if ($item->seats > 0)
                            <p><strong>@lang('Số lượng'): </strong>
                                @if ($registered > 0)
                                    {{ $item->seats - $registered }}
                                @else
                                    {{ $item->seats }}
                                @endif
                            </p>
                        @else
                            <p><strong>@lang('Số lượng'): </strong> Không giới hạn </p>
                        @endif
                            
                        @if($item->subtype != 'digital' && $item->subtype != 'video')
                        <p>
                            <strong> @lang('Khai giảng:')</strong>
                            {{ date('d/m/Y', strtotime($item->date_start)) }}
                            {{ $num_schedule <= 1 ? '' : '(có ' . $num_schedule . ' buổi học)' }}
                        </p>
                            @if (count($plans) > 0) 
                                <p>Các chi nhánh có khóa học này</p>
                                <ul>
                                @foreach($plans as $plan)
                                <li>{{ $plan['location']['location_title'] }}, địa chỉ: {{ $plan['location']['address'] }}</li>
                                @endforeach
                                </ul>
                            @endif
                        @endif

                        <div class="price">
                            <p>
                                <span class="actual-price">{{ number_format($item->price, 0, ',', '.') }}đ</span>
                                @if ($item->org_price > 0)
                                    <span class="original-price">{{ number_format($item->org_price, 0, ',', '.') }}đ</span>
                                    <span class="bg-success badge mr-1 rounded-pill"
                                        style="font-size: 12px">-{{ number_format((($item->org_price - $item->price) / $item->org_price) * 100, 0, '.', ',') }}%</span>
                                @endif
                            </p>

                        </div>
                        <div class="mt-1 mb-5">
                            @if (!auth()->check())
                                @if ($item->activiy_trial == 1)
                                    <a href="{{ route('login') . '?cb=' . urlencode($itemServ->classUrl($item->id)) }}"
                                        class="btn btn-sm bg-none border">@lang('Học Thử')
                                    </a>
                                @endif
                                @if ($item->activiy_visit == 1)
                                    <a href="{{ route('login') . '?cb=' . urlencode($itemServ->classUrl($item->id)) }}"
                                        class="btn btn-sm bg-none border">@lang('Tham Quan Trường')
                                    </a>
                                @endif
                                @if ($item->activiy_test)
                                    <a href="{{ route('login') . '?cb=' . urlencode($itemServ->classUrl($item->id)) }}"
                                        class="btn btn-sm bg-none border">@lang('Thi Đầu Vào')
                                    </a>
                                @endif
                            @else
                                <form>
                                    <input type="hidden" name="class" value="{{ $item->id }}">
                                    @if ($item->activiy_trial == 1)
                                        <button name="action" value="activiy_trial"
                                            class="btn btn-sm bg-none border">@lang('Học Thử')</button>
                                    @endif
                                    @if ($item->activiy_visit == 1)
                                        <button name="action" value="activiy_visit"
                                            class="btn btn-sm bg-none border">@lang('Tham Quan')</button>
                                    @endif
                                    @if ($item->activiy_test)
                                        <button name="action" value="activiy_test"
                                            class="btn btn-sm bg-none border">@lang('Kiểm Tra')</button>
                                    @endif
                                </form>
                            @endif
                        </div>
                        <div class="col-lg-12 col-md-12 d-flex mt-3">
                            <div class="flex-fill pt-2">
                                @if (!auth()->check())
                                    <a class="border-0 btn btn-success form-control rounded-pill"
                                        href="{{ route('login') . '?cb=' . urlencode($itemServ->classUrl($item->id)) }}">@lang('Đăng ký học')</a>
                                @else
                                    <form action="{{ route('add2cart') }}" method="get" id="pdpAdd2Cart">
                                        <input type="hidden" name="class" value="{{ $item->id }}">
                                        <button name="action" value="add2cart"
                                            class="border-0 btn btn-success form-control rounded-pill">@lang('Đăng ký học')</button>
                                    </form>
                                @endif
                            </div>
                            @if ($is_fav)
                                <div class="flex-end p-2"><a class=" text-danger"
                                        href="{{ route('class.like', ['itemId' => $item->id]) }}"><i
                                            class="fas fa-2x fa-heart"></i></a></div>
                            @else
                                <div class="flex-end p-2 text-success"><a class="text-danger"
                                        href="{{ route('class.like', ['itemId' => $item->id]) }}"><i
                                            class="far fa-2x fa-heart"></i></a></div>
                            @endif
                            <div class="flex-end p-2 text-info"><a><i class="fas fa-2x fa-share-alt"></i></a></div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        <div class="mt-4">
            <ul class="nav nav-tabs" id="pdptab" role="tablist">
                <li class="nav-item" role="presentation">
                    <button class="nav-link text-secondary fw-bold @if (!$videoServ->checkOrder($item->id)) active @endif"
                        id="content-tab" data-bs-toggle="tab" data-bs-target="#content" type="button" role="tab"
                        aria-controls="content" aria-selected="true">@lang('MÔ TẢ')</button>
                </li>
                @if ($author->role == 'school')
                    <!-- <li class="nav-item" role="presentation">
                                                                                            <button class="nav-link text-secondary fw-bold" id="teachers-tab" data-bs-toggle="tab" data-bs-target="#teachers" type="button" role="tab" aria-controls="teachers" aria-selected="false">GIẢNG VIÊN</button>
                                                                                        </li> -->
                @endif
                @if ($item->subtype == 'video')
                    <li class="nav-item" role="presentation">
                        <button class="nav-link text-secondary fw-bold @if ($videoServ->checkOrder($item->id)) active @endif"
                            id="video-tab" data-bs-toggle="tab" data-bs-target="#video" type="button" role="tab"
                            aria-controls="video" aria-selected="false">@lang('BÀI HỌC')</button>
                    </li>
                @endif
                @if (count($reviews) > 0)
                    <li class="nav-item" role="presentation">
                        <button class="nav-link text-secondary fw-bold" id="review-tab" data-bs-toggle="tab"
                            data-bs-target="#review" type="button" role="tab" aria-controls="review"
                            aria-selected="false">@lang('ĐÁNH GIÁ')</button>
                    </li>
                @elseif(Auth::check())
                    @if ((auth()->user()->role == 'school') | (auth()->user()->role == 'teacher'))
                        <li class="nav-item" role="presentation">
                            <button class="nav-link text-secondary fw-bold" id="review-tab" data-bs-toggle="tab"
                                data-bs-target="#review" type="button" role="tab" aria-controls="review"
                                aria-selected="false">@lang('ĐÁNH GIÁ')</button>
                        </li>
                    @endif
                @endif
            </ul>
            <div class="tab-content border border-top-0 mb-5 shadow" id="myTabContent">
                <div class="tab-pane fade show @if (!$videoServ->checkOrder($item->id)) active @endif p-2" id="content"
                    role="tabpanel" aria-labelledby="content-tab">
                    @if (\App::getLocale() == 'vi')
                        <div class="collapse-module pb-4">
                            <div class="collapse" id="contentCollapse">
                                {!! $item->content !!}
                            </div>
                            <div class="text-center">
                                <button class="ps-4 pe-4 border-0 btn btn-white rounded-pill shadow fw-bold"
                                    type="button" data-bs-toggle="collapse" data-bs-target="#contentCollapse"
                                    aria-expanded="false" aria-controls="contentCollapse">
                            </div>
                        </div>
                    @else
                        <div class="collapse-module-en pb-4">
                            <div class="collapse" id="contentCollapse">
                                {!! $item->content !!}
                            </div>
                            <div class="text-center">
                                <button class="ps-4 pe-4 border-0 btn btn-white rounded-pill shadow fw-bold"
                                    type="button" data-bs-toggle="collapse" data-bs-target="#contentCollapse"
                                    aria-expanded="false" aria-controls="contentCollapse">
                            </div>
                        </div>
                    @endif

                </div>
                @if ($author->role == 'school')
                    <!-- <div class="tab-pane fade p-2" id="teachers" role="tabpanel" aria-labelledby="teachers-tab">...</div> -->
                @endif
                @if (1 == 1)
                    <div class="tab-pane fade @if ($videoServ->checkOrder($item->id)) show active @endif" id="video"
                        role="tabpanel" aria-labelledby="video-tab">
                        @include('anylearn.pdp.video')
                    </div>
                @endif
                @if (count($reviews) > 0)
                    <div class="tab-pane fade ps-4 pe-4" id="review" role="tabpanel" aria-labelledby="review-tab">
                        @include('anylearn.pdp.review')
                    </div>
                @elseif(Auth::check())
                    @if (auth()->user()->role == 'school' || auth()->user()->role == 'teacher')
                        <div class="tab-pane fade ps-4 pe-4" id="review" role="tabpanel"
                            aria-labelledby="review-tab">
                            @include('anylearn.pdp.review')
                        </div>
                    @endif
                @endif
            </div>
        </div>
        @if (\App::getLocale() == 'vi')
            <div class="mb-3">
                @include('anylearn.home.classes', [
                    'title' => 'KHOÁ HỌC LIÊN QUAN',
                    'carouselId' => 'pdp-classes',
                    'data' => $hotItems['list'],
                ])
            </div>
        @else
            <div class="mb-3">
                @include('anylearn.home.classes', [
                    'title' => 'RELATED COURSES',
                    'carouselId' => 'pdp-classes',
                    'data' => $hotItems['list'],
                ])
            </div>
        @endif
    </section>
@endsection
@section('jscript')
    @parent
    <script>
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


        $("#pdpAdd2Cart").on("submit", function(event) {
            event.preventDefault();
            gtag("event", "add_to_cart", {
                "items": [{
                    "id": "{{ $item->id }}",
                    "name": "{{ $item->title }}",
                    "price": "{{ $item->price }}",
                    "quantity": 1,
                    "currency": "VND"
                }]
            });
            $(this).unbind('submit').submit();
        });
    </script>
@endsection
