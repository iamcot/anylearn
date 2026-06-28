@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')
@extends('anylearn.layout')

@section('body')
    @include('anylearn.widget.breadcrumb', ['breadcrumb' => $breadcrumb])
    <div class="mb-5">
        <section class="text-center">
            <h5 class="mt-3 fw-bold text-secondary">
                @lang('Xin chào, anyLEARN giúp gì được cho bạn?')
            </h5>
            <div class="mt-3 text-center" id="search">
                <form action="/helpcenter/s" method="get" id="helpcenterSearch">
                    <button class="border-0 bg-white" name="a" value="search"><i
                            class="fa fa-search text-success"></i></button>
                    <input type="text" name="s" class="form-control rounded-pill shadow"
                        placeholder="@lang('Bạn muốn hỏi gì...')">
                </form>
            </div>
        </section>
        <section class="mt-5">
            <h5>@lang('Các câu hỏi được quan tâm')</h5>
            <ul class="row">
                @foreach ($topKnowledge as $knowledge)
                    <li class="col-xs-12 col-md-6"><a class=" text-black"
                            href="{{ route('helpcenter.knowledge', ['id' => $knowledge->id, 'url' => $knowledge->url]) }}">{{ $knowledge->title }}</a>
                    </li>
                @endforeach
            </ul>
        </section>
        <section class="mt-5">
            <h5>@lang('Các chủ đề')</h5>
            <div class="row">
                @foreach ($topics as $topic)
                    <div class="col-xs-6 col-md-3 text-center mb-2">
                        <div
                            class="border rounded-3 text-center p-5 topic_box d-flex align-items-center  justify-content-center">
                            <a class="fw-bold text-success text-decoration-none"
                                href="{{ route('helpcenter.topic', ['url' => $topic->url]) }}">{{ $topic->title }}</a>
                        </div>
                    </div>
                @endforeach
            </div>
        </section>
    </div>
@endsection
@section('jscript')
    @parent
    <script src='/cdn/anylearn/chatbot/js/widget.js'></script>
@endsection
