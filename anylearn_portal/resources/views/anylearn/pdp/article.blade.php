@inject('itemServ','App\Services\ItemServices')
@extends('anylearn.layout')
@section('body')
<div class="row mb-5">
    <div class="col-md-8">
        <div class="text-center">
            @if ($article->type == 'video')
            @php
            parse_str( parse_url( $article->video, PHP_URL_QUERY ), $youtubeUrl );
            @endphp
            <iframe width="560" height="315" src="https://www.youtube.com/embed/{{ $youtubeUrl['v'] }}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            @else
            <img src="{{ $article->image }}" class="img-fluid">
            @endif
        </div>
        <div id="article_content">
            <h4 class="text-success text-center mt-2">{{ $article->title }}</h4>
            {!! $article->content !!}
        </div>
    </div>
    <div class="col-md-4">
        <div class="card shadow">
            <div class="card-body">
                <ul class="list-unstyled">
                    @foreach($moreArticles as $item)
                    <li class="mb-2 article-sidebar">
                        <a data-spm="relate-item.{{ $item->id }}" class="row text-decoration-none text-secondary" href="{{ $itemServ->articleUrl($item->id) }}">
                            <div class="col-4">
                                @php
                                $img = $item->image;
                                if ($item->type == 'video') {
                                parse_str( parse_url( $item->video, PHP_URL_QUERY ), $youtubeUrl );
                                $img = empty($youtubeUrl['v']) ? $img : ("https://img.youtube.com/vi/" . $youtubeUrl['v'] . "/0.jpg");
                                }
                                @endphp
                                <img src="{{ $img }}" class="img-fluid">
                            </div>
                            <div class="col-8">
                                <p class="fw-bold">{{ $item->title }}</p>
                            </div>
                        </a>

                    </li>
                    @endforeach
                </ul>
            </div>
        </div>
    </div>
</div>

@endsection
@section('jscript')
@parent
@endsection