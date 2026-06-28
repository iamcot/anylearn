<section class="blog_section big_padding" id="blog">
    <h2 class="default_section_heading text-center text-green">
        @lang('Nhiều khóa học trong các lĩnh vực')
    </h2>
    <hr class="default_divider default_divider_blue default_divider_big">
    <div class="blog_slider_main swiper-container">
        <ul class="course-tags">
            @foreach(config('home_courses', []) as $course)
            <li>{{ $course }}</li>
            @endforeach
        </ul>
    </div>
</section>