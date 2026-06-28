<div class="anylearn_rating">
    <ul class="list-unstyled list-inline">
        @for($i = 1; $i <= 5; $i++)
        <li class="p-0">
            @if($i <= $score)
            <i class="fa fa-star text-orange"></i>
            @elseif ($score < $i && $score > $i - 1) 
            <i class="fa fa-star-half text-orange"></i>
            @else
                <!-- <i class="fa fa-star"></i> -->
            @endif
       </li>
        @endfor
    </ul>
</div>