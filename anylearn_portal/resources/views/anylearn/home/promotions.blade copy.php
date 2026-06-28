@if(!empty($promotions)  && count($promotions) > 0)
<section class="carousel3">
    <div class="row mx-auto my-auto justify-content-center">
        <div id="{{ $carouselId }}" class="carousel slide" data-bs-interval="false">
            <a class="carousel-control-next bg-gradient" href="#{{ $carouselId }}" role="button" data-bs-slide="next">
                <span class="carousel-control-icon rounded-circle border"><i class="fas fa-2x fa-angle-right text-secondary"></i></span>
            </a>
            <div class="carousel-inner" role="listbox">
                <h5 class="m-2 fw-bold text-uppercase">{{ __($title) }}</h5>
                @foreach($promotions as $promotion)
                <div class="carousel-item {{ $loop->index == 0 ? 'active' : '' }}">
                    <div class="col-md-4">
                        <div class="card border-0">
                            <div class="card-img">
                                <img src="{{ $promotion->image }}" class="img-fluid">
                                <div class="promotion-tag">{{ $promotion->video }}</div>
                            </div>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
        </div>
    </div>
    <script>
        // var items = document.querySelectorAll('#{{ $carouselId }} .carousel-item')
        // items.forEach((el) => {
        //     var minPerSlide = screen.width <= 768 ? 1 : 3;
        //     let next = el.nextElementSibling
        //     for (var i = 1; i < minPerSlide; i++) {
        //         if (!next) {
        //             next = items[0]
        //         }
        //         let cloneChild = next.cloneNode(true)
        //         el.appendChild(cloneChild.children[0])
        //         next = next.nextElementSibling
        //     }
        // })
    </script>
</section>
@endif
