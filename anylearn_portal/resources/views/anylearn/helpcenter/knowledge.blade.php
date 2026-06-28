@extends('anylearn.layout')

@section('body')
    @include('anylearn.widget.breadcrumb', ['breadcrumb' => $breadcrumb])
    <div class="row mb-5">
        <div class="col-xs-12 col-md-8">
            <h4>{{ $knowledge->title }}</h4>
            <p class="small text-secondary"><i class="fa fa-clock"></i> @lang('Cập nhật lúc')
                {{ date('d/m/Y', strtotime($knowledge->updated_at)) }}</p>
            {!! $knowledge->content !!}
            <hr>
            <div class="small">@lang('Bài viết này hữu ích cho bạn ?') <a href="#" class=" text-secondary p-2"><i
                        class="fa fa-thumbs-up"></i></a> <a href="#" class=" text-secondary p-2"><i
                        class="fa fa-thumbs-down"></i></a></div>
        </div>
        <div class="col-xs-12 col-md-4">
            <h5>@lang('Bài viết liên quan')</h5>
            <ul>
                @foreach ($others as $knowledge)
                    <li class=""><a class="text-decoration-none text-black"
                            href="{{ route('helpcenter.knowledge', ['id' => $knowledge->id, 'url' => $knowledge->url]) }}">{{ $knowledge->title }}</a>
                    </li>
                @endforeach
            </ul>
            <!-- <section class="mt-5">
            <h5>
                Bạn vẫn cần trợ giúp ?
            </h5>
            <p>anyLEARN sẽ có đội ngũ hỗ trợ bạn mọi lúc</p>
            <button class="btn btn-success border-0 rounded-pill">Trò chuyện ngay</button>
        </section> -->
        </div>
    </div>
@endsection
