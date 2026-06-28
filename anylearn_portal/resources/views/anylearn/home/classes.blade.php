@inject('itemServ','App\Services\ItemServices')
<section class="carousel4">
    <div class="mx-auto my-auto justify-content-center">
        <div id="{{ $carouselId }}">
            <h2 class="m-2 fw-bold text-uppercase">{{ $title }} @if(!empty($linkAll)) <a class="small" href="{{ $linkAll }}">XEM TOÀN BỘ ></a> @endif</h2>
            <div class="owl-carousel owl-theme" >
                @foreach($data as $class)
                <a class="p-1 classBox" href="{{ $itemServ->classUrl($class->id) }}" data-spm="topclass.{{ $class->id }}">
                    <div class="card border-0 shadow-sm">
                        <div class="card-img">
                            <div class="imagebox">
                                <img src="{{ $class->image }}" class="img-fluid">
                            </div>
                            <div class="class-title mt-1 fw-bold p-1 text-success">@if($class->is_hot) <span class="badge bg-danger "><i class="fas fa-fire"></i> HOT</span> @endif {{ $class->title }}</div>
                            <div class="p-1">
                                <span class="text-danger fw-bold">{{ number_format($class->price, 0, ',', '.') }} đ</span>
                            </div>
                            <div class="">@include('anylearn.widget.rating', ['score' => $class->rating ?? 0])</div>
                            <div class="class-price ps-1 pe-1">
                                <span class=" text-secondary">{{ $class->short_content }}</span>
                            </div>
                            <div class="p-2 text-center mb-2">
                                <button class="btn btn-white rounded-pill shadow border-0 w-75 text-success fw-bold">@lang('CHI TIẾT')</button>
                            </div>
                        </div>
                    </div>
                </a>
                @endforeach
            </div>
        </div>
    </div>
</section>
