<span class="me-1">5.0</span>
<span style="display: inline-block; direction: ltr;">
    @for ($i = 1; $i <= 5; $i++)
        @if ($i <= $score)
        <i class=" text-warning fas fa-star "></i>
        @elseif ($score < $i && $score > $i - 1)
        <i class=" text-warning far fa-star "></i>
        @else
            <!-- <i class="fa fa-star"></i> -->
        @endif
    @endfor
    {{-- <span class="text-info ms-2">(34.567 đánh giá)</span> --}}
</span>
