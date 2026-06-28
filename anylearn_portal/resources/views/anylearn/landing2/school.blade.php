<section class="bg-light">
    <div class="container">
        <div id="carouselSchools" class="carousel slide" data-bs-ride="carousel">
            <div class="carousel-indicators">
                @foreach($schools as $school)
                <button type="button" data-bs-target="#carouselSchools" data-bs-slide-to="{{ $loop->index }}" class="bg-black {{ $loop->index == 0 ? 'active' : '' }}" aria-current="{{ $loop->index == 0 ? 'true' : '' }}"></button>
                @endforeach
            </div>

            <div class="carousel-inner  pt-5 pb-5">
                @foreach($schools as $school)
                <div class="carousel-item {{ $loop->index == 0 ? 'active' : '' }}" data-bs-interval="3000">
                    <div class="row">
                        <div class="col-sm-5 p-5 imagebox">
                            <img src="{{ $school->image }}" class="d-block  img-fluid rounded-circle" alt="...">
                        </div>
                        <div class="col-sm-7 pt-sm-5 mt-sm-5">
                            <p class="fs-4">{{ $school->name }} @lang('hân hạnh đồng hành cũng anyLEARN')</p>
                            <p class="text-black-50">{{ $school->introduce }}</p>
                            <p class="">{{ $school->name }} - @lang('đối tác anyLEARN')</p>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
            <!-- <button class="carousel-control-prev" type="button" data-bs-target="#carouselReviews" data-bs-slide="prev">
                <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Previous</span>
            </button>
            <button class="carousel-control-next" type="button" data-bs-target="#carouselReviews" data-bs-slide="next">
                <span class="carousel-control-next-icon" aria-hidden="true"></span>
                <span class="visually-hidden">Next</span>
            </button> -->
        </div>
    </div>
</section>