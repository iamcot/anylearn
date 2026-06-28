<section class="mt-5 mb-5">
    <div class="container text-center">
        <p class="fs-4 ">Ban cố vấn và đội ngũ chuyên gia</p>
        <div class="owl-carousel owl-theme">
            @foreach($teachers as $teacher)
            <div class="">
                <div class="p-5 imagebox">
                <img src="{{ $teacher->image }}" class="rounded-circle">
                </div>
                <p class="fw-bold">{{ $teacher->name }}</p>
                <p class="text-black-50">{{ $teacher->introduce }}</p>
            </div>
            @endforeach
        </div>
        <a href="/ref/anylearn?role=teacher" class="fw-bold btn btn-success border-white shadow rounded-pill ps-4 pe-4">ĐĂNG KÝ LÀM CHUYÊN GIA</a>
    </div>
</section>