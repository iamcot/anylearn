<section class="mt-5">
    <div class="container">
        <p class="fs-4 text-center">
            @lang('Khoá học trong nhiều lĩnh vực')
        </p>
        <div class="text-center">
            <ul class="school-logo">
                @foreach($categories as $cat)
                <li class="rounded-pill border border-success text-success me-2 mb-2">
                    {{ $cat->title }}
                </li>
                @endforeach
            </ul>
            <a href="/ref/anylearn?role=member" class="mt-3 mb-5 fw-bold btn btn-success border-white shadow rounded-pill ps-4 pe-4">@lang('ĐĂNG KÝ THÀNH VIÊN')</a>
        </div>
    </div>

</section>