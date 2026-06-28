<nav aria-label="breadcrumb" style="--bs-breadcrumb-divider: '>';">
  <ol class="breadcrumb bg-white text-secondary">
    <li class="breadcrumb-item"><a href="/"><i class="fa fa-home text-success"></i></a></li>
    @for($i = 0; $i < count($breadcrumb); $i++)
        @if ($i == count($breadcrumb) - 1)
            <li class="breadcrumb-item active text-secondary" aria-current="page">{{ __($breadcrumb[$i]['text']) }}</li>
        @else
            <li class="breadcrumb-item active"><a href="{{ __($breadcrumb[$i]['url']) }}" class="text-success text-decoration-none">{{ __($breadcrumb[$i]['text']) }}</a></li>
        @endif
    @endfor
  </ol>
</nav>