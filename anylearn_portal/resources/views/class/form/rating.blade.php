<div class="row">
    <div class="col-12 p-5">
        <h4>@lang('Cách đánh giá của khóa học')
        </h4>
        <hr />
        @if(!empty($ratings) && count($ratings) > 0)
        <ul class="list-unstyled">
            @foreach($ratings as $rating)
            <li class="row @if($loop->index < count($ratings) - 1)  border-bottom @endif mb-3">
                    <div class="col-9">
                        <h5>{{ $rating->name }}</h5>
                        @include('anylearn.widget.rating', ['score' => $rating->value ?? 0])
                        <p>{{ $rating->extra_value }}</p>
                    </div>

                </li>
            @endforeach
        </ul>
        @else
        <p>@lang('Khóa học chưa có đánh giá nào')</p>
        @endif
    </div>
</div>