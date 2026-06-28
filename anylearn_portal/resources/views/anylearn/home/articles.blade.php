@if(!empty($data) && count($data) > 0)
@inject('itemServ','App\Services\ItemServices')
<section class="carousel3 mt-3">
    <div class="mx-auto my-auto justify-content-center">
        <div id="{{ $carouselId }}">
            <h2 class="m-2 fw-bold text-uppercase">{{ __($title) }}</h2>
            <div class="owl-carousel owl-theme" role="listbox">
                @foreach($data as $article)
                <div class="p-1">
                    <a class="card border-0 text-decoration-none text-secondary" href="{{ $itemServ->articleUrl($article->id) }}" data-spm="article.{{ $article->id }}">
                        <div class="card-img">
                            @php
                            $img = $article->image;
                            if ($article->type == 'video') {
                            parse_str( parse_url( $article->video, PHP_URL_QUERY ), $youtubeUrl );
                            $img = empty($youtubeUrl['v']) ? $img : ("https://img.youtube.com/vi/" . $youtubeUrl['v'] . "/0.jpg");
                            }
                            @endphp
                            <img src="{{ $img }}" class="img-fluid">
                        </div>
                        <h6 class="mt-1 fw-bold">{{ $article->title }}</h6>
                    </a>
                </div>
                @endforeach
            </div>
        </div>
    </div>
</section>
@endif
