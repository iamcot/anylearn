@if(!empty($promotions) && count($promotions) > 0)
@inject('itemServ','App\Services\ItemServices')
<section id="promotion" class="carousel3">
    <div id="{{ $carouselId }}" class="mx-auto my-auto">
        <h2 class="m-2 fw-bold text-uppercase">{{ __($title) }}</h2>
        <div class="owl-carousel owl-theme">
            @foreach($promotions as $promotion)
            <div class="p-1">
                <a class="card border-0 text-decoration-none text-secondary" href="{{ $itemServ->articleUrl($promotion->id) }}"  data-spm="promotion.{{ $promotion->id }}">
                    <div class="card-img">
                        <img src="{{ $promotion->image }}" class="img-fluid">
                        <div class="promotion-tag">{{ $promotion->video }}</div>
                    </div>
                </a>
            </div>
            @endforeach
        </div>
    </div>
</section>
@endif