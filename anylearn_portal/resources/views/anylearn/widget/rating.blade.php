<div class="anylearn_rating">
    <ul class="list-unstyled list-inline">
        @for($i = 1; $i <= 5; $i++) <li class="m-0 list-inline-item text-warning">
            @if($i <= $score) <i class="fas fa-star "></i>
                @elseif ($score < $i && $score> $i - 1)
                    <i class="fas fa-star-half-alt"></i>
                    @else
                    <i class="far fa-star "></i>
                    @endif
                    </li>
                @endfor
    </ul>
</div>