@if(!empty($banners) && count($banners) > 0)
<section id="banners" class="carousel3">
    <div id="carousebanners" class="mx-auto my-auto">
        <div class="owl-carousel owl-theme">
            @foreach($banners as $banner)
            <div class="p-1">
                    <div class="card-img">
                        <img src="{{ $banner['file'] }}" class="img-fluid">
                    </div>
            </div>
            @endforeach
        </div>
    </div>
</section>
@else
<section id="banners">
    <img class="img-fluid" src="/cdn/anylearn/img/banner_1.svg" alt="">
</section>
@endif