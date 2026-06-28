@extends('anylearn.layout')

@section('body')
    @include('anylearn.widget.breadcrumb', ['breadcrumb' => $breadcrumb])
    <div class="row mb-5">
        <div class="col-xs-12 col-md-8">
            <h3>{{ $topic->title }}</h3>
            @foreach ($catWithKnowledge as $item)
                <h5 class="mt-3">{{ $item['cat'] }}</h5>
                @foreach ($item['knowledges'] as $knowledge)
                    <li class=""><a class=" text-black"
                            href="{{ route('helpcenter.knowledge', ['id' => $knowledge->id, 'url' => $knowledge->url]) }}">{{ $knowledge->title }}</a>
                    </li>
                @endforeach
            @endforeach
        </div>
        <div class="col-xs-12 col-md-4">
            <h5>@lang('Chủ đề khác')</h5>
            <ul class="list-unstyled">
                @foreach ($topics as $othertopic)
                    <li class="border rounded p-2 mb-2"><a class="text-decoration-none text-black"
                            href="{{ route('helpcenter.topic', ['url' => $othertopic->url]) }}">{{ $othertopic->title }}</a>
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
