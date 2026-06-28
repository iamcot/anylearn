<section class="mt-5">
    <div class="container">
        <p class="fs-4 text-center">
            Đối tác của anyLEARN
        </p>
        <div class="text-center">
            <ul class="school-logo">
                @foreach(config('home_schools', []) as $school)
                <li class="col-xs-4 col-sm-3 col-md-2 col-lg-1">
                    <img src="{{ $school['image'] }}" alt="">
                </li>
                @endforeach
            </ul>
            <a href="/ref/anylearn?role=school" class="fw-bold btn btn-success border-white shadow rounded-pill ps-4 pe-4">ĐĂNG KÝ ĐỐI TÁC</a>
        </div>
    </div>

</section>