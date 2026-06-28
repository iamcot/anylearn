@inject('videoServ', 'App\Services\VideoServices')
@inject('itemServ', 'App\Services\ItemServices')
@extends('anylearn.layout')

@section('spmb')
    learn_video
@endsection

@section('body')
    <h1 class="text-success">{{ $itemData->title }} </h1>
    <hr>
    <div class="row mb-3" id="spmc" data-spm="{{ $lessonData->id }}">
        <div class="mb-3 col-lg-8">
            <div class="position-relative">
                <div class="shadow">
                    @if ($lessonData->type == 'youtube' && $videoServ->getlinkYT($lessonData->type_value) != '')
                        @include('anylearn.pdp.video_youtube', [
                            'youtubeId' => $videoServ->getlinkYT($lessonData->type_value),
                        ])
                    @else
                        <p class="p-3">Tạm thời chưa có video</p>
                    @endif
                </div>
                <h3 class="fw-bold text-success mt-3">@lang('Bài') {{ $lessonData->lesson_no }}:
                    {{ $lessonData->title }}</h3>
                @if ($lessonData->length)
                    <div>@lang('Thời lượng'): {{ $lessonData->length }} @lang('phút')</div>
                @endif
                <div>{!! $lessonData->description !!}</div>
                <div class="card mt-3">
                    <div class="card-header fw-bold text-secondary">Về khóa học {{ $itemData->title }}
                        <a class="float-end small" href="{{ $itemServ->classUrl($itemData->id) }}">Xem thông tin ></a>
                    </div>
                    <div class="card-body">{!! $itemData->short_content !!}</div>
                </div>
                <div class="card mt-3">
                    <div class="card-header fw-bold text-secondary">Về đối tác {{ $author->name }}
                        <a class="small float-end"
                            href="{{ route('classes', ['role' => $author->role, 'id' => $author->id]) }}">Xem khóa học khác
                            ></a>
                    </div>
                    <div class="card-body">
                        <p class="text-success">Tham gia từ: tháng {{ date('m', strtotime($author->created_at)) }} năm
                            {{ date('Y', strtotime($author->created_at)) }}</p>
                        {!! $author->introduce !!}
                    </div>
                </div>
                @if (count($ratings) > 0)
                    <div class="card mt-3">
                        <div class="card-header fw-bold text-secondary">Học viên đánh giá</div>
                        <div class="card-body">
                            @foreach ($ratings as $review)
                                <li class="row @if ($loop->index < count($ratings) - 1) border-bottom @endif mb-3">
                                    <div class="col-sm-1 col-3 m-2">
                                        @if ($review->user_image)
                                            <img class="avatar avatar-img border rounded-circle"
                                                src="{{ $review->user_image }}" alt="">
                                        @endif
                                    </div>
                                    <div class="col-9">
                                        <p>{{ $review->user_name }}</p>
                                        @include('anylearn.widget.rating', [
                                            'score' => $review->value ?? 0,
                                        ])
                                        <p>{{ $review->extra_value }}</p>
                                    </div>
                                </li>
                            @endforeach
                        </div>
                    </div>
                @endif
            </div>
        </div>
        <div class="col-lg-4">
            @if (!$videoServ->checkOrder($itemId))
                <div class="mb-3 card shadow">
                    <div class="card-body">
                        <h3>
                            <i class="fa fa-dollar-sign"></i>
                            @if ($itemData->org_price > 0)
                                <span
                                    class="bg-success badge mr-1">-{{ number_format((($itemData->org_price - $itemData->price) / $itemData->org_price) * 100, 0, '.', ',') }}%</span>
                                <span
                                    class="text-secondary text-decoration-line-through mr-1">{{ number_format($itemData->org_price, 0, ',', '.') }}đ</span>
                            @endif
                            <span class="text-success fw-bold">{{ number_format($itemData->price, 0, ',', '.') }}đ</span>

                        </h3>
                        <p class="">
                            <i class=" text-success fa fa-{{ $author->role == 'teacher' ? 'user' : 'university' }}"></i> <a
                                href="{{ route('classes', [
                                    'role' => $author->role,
                                    'id' => $author->id,
                                ]) }}"
                                class="text-decoration-none text-success">{{ $author->name }}</a>
                        </p>
                        <div>
                            <ul class="list-unstyled list-inline">
                                @foreach ($categories as $category)
                                    <li class="list-inline-item border border-success rounded text-success p-1 fw-light">
                                        {{ $category->title }}
                                    </li>
                                @endforeach
                            </ul>
                        </div>
                        @if ($itemData->rating)
                            <div>
                                @include('anylearn.widget.rating', ['score' => $itemData->rating ?? 0])
                            </div>
                        @endif
                        @if ($itemData->ages_min > 0 && $itemData->ages_max > 0)
                            <p>@lang('Độ tuổi'): {{ $itemData->ages_min . '-' . $itemData->ages_max }}</p>
                        @endif
                        @if (!auth()->check())
                            <a class="border-0 btn btn-success form-control rounded"
                                href="{{ route('login') . '?cb=' . urlencode($itemServ->classUrl($itemData->id)) }}">@lang('Đăng ký học')</a>
                        @else
                            <form action="{{ route('add2cart') }}" method="get" id="pdpAdd2Cart">
                                <input type="hidden" name="class" value="{{ $itemData->id }}">
                                <button name="action" value="add2cart"
                                    class="border-0 btn btn-success form-control rounded">@lang('Đăng ký học')</button>
                            </form>
                        @endif
                    </div>
                </div>
            @endif
            <div class="accordion shadow" id="accordionVideos">
                @foreach ($videos as $chapter)
                    @if (count($chapter['lessons']) > 0)
                        <div class="accordion-item ">
                            <h2 class="accordion-header" id="heading{{ $chapter['chapter']->chapter_no }}">
                                <button class="accordion-button @if ($lessonData->item_video_chapter_id != $chapter['chapter']->id) collapsed @endif"
                                    type="button" data-bs-toggle="collapse"
                                    data-bs-target="#collapse{{ $chapter['chapter']->chapter_no }}" aria-expanded="true"
                                    aria-controls="collapse{{ $chapter['chapter']->chapter_no }}">
                                    <strong>@lang('Chương') {{ $chapter['chapter']->chapter_no }}:
                                        {{ $chapter['chapter']->title }}</strong>
                                </button>
                            </h2>
                            <div id="collapse{{ $chapter['chapter']->chapter_no }}"
                                class="accordion-collapse collapse @if ($lessonData->item_video_chapter_id == $chapter['chapter']->id) show @endif"
                                aria-labelledby="heading{{ $chapter['chapter']->chapter_no }}"
                                data-bs-parent="#accordionVideos">
                                <div class="tab-content">
                                    <table class="fs--1 text-end table table-striped mb-0">
                                        <tbody>
                                            @foreach ($chapter['lessons'] as $les)
                                                <tr class="btn-reveal-trigger bg-light">
                                                    <td class="align-middle white-space-nowrap text-start">
                                                        <div class="d-flex row">
                                                            <div class="col-md-3">
                                                                <h6 class="text-success fs--1">Bài {{ $les->lesson_no }}
                                                                </h6>
                                                            </div>
                                                            <div class="col-md-7">
                                                                <h6 class="fs--2 text-black">
                                                                    {{ $les->title }}
                                                                </h6>
                                                            </div>
                                                            <div class="col-md-2">
                                                                @if (auth()->check())
                                                                    @if (!$videoServ->checkOrder($itemData->id))
                                                                        @if ($les->is_free == 1)
                                                                            <a href="{{ $itemServ->classVideoUrl($les->item_id, $les->id) }}"
                                                                                class="float-end btn btn-outline-danger btn-sm">FREE</a>
                                                                        @else
                                                                            <form action="{{ route('add2cart') }}"
                                                                                method="get" id="pdpAdd2Cart">
                                                                                <input type="hidden" name="class"
                                                                                    value="{{ $itemData->id }}">
                                                                                <button name="action" value="add2cart"
                                                                                    class="float-end btn btn-outline-success btn-sm"><i
                                                                                        class="fa fa-cart-plus"></i></button>
                                                                            </form>
                                                                        @endif
                                                                    @else
                                                                        <a href="{{ $itemServ->classVideoUrl($les->item_id, $les->id) }}"
                                                                            class="float-end btn btn-outline-success btn-sm"><i
                                                                                class="fa fa-play"></i></a>
                                                                    @endif
                                                                @elseif($les->is_free == 1)
                                                                    <a href="{{ $itemServ->classVideoUrl($les->item_id, $les->id) }}"
                                                                        class="float-end btn btn-outline-danger btn-sm">FREE</a>
                                                                @endif

                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    @endif
                @endforeach
            </div>
        </div>
    </div>
    @if (count($authorClasses) > 0)
        <div class="mb-5">
            @include('anylearn.home.classes', [
                'title' => 'KHÓA HỌC CÙNG ĐỐI TÁC',
                'carouselId' => 'learn-classes',
                'data' => $authorClasses,
                'linkAll' => route('classes', ['role' => $author->role, 'id' => $author->id]),
            ])
        </div>
    @endif
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
    </script>
@endsection
