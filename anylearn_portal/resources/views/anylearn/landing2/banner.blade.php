<section id="landing-banner">
    <div class="container">
        <div class="text-white fs-2 fw-bold">@lang('Tìm kiếm trường học, lớp học phù hợp')</div>
        <div class="mt-2 text-white w-100 d-lg-none ">
            <div>{{ __($quote['quoteText']) }}</div>
            <p class="text-end">- {{ $quote['quoteAuthor'] }}</p>
        </div>
        <div class="mt-3 text-white w-50 d-none d-lg-block">
            <div>{{ __($quote['quoteText']) }}</div>
            <p class="text-end">- {{ __($quote['quoteAuthor']) }}</p>
        </div>
        <div class="mt-3" id="search2">
            <form action="/classes" method="get" id="schoolsearch">
                <button class="border-0" name="a" value="search"><i class="fa fa-search text-white"></i></button>
                <input type="text" name="s" class="form-control rounded-pill border-0 " placeholder="{{ __('Tìm khoá học...') }}">
            </form>
        </div>
    </div>
</section>