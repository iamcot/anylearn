<section class="team_section big_padding text-center " id="team">
    <div class="container">
        <div class="col-xs-12">
            <h2 class="default_section_heading text-center font-600 text-blue">
                @lang('Ban cố vấn và đội ngũ chuyên gia')
            </h2>
            <hr class="default_divider default_divider_blue default_divider_big">
            <ul class="teacher_list">
                @foreach(config('home_teachers', []) as $teacher)
                <li class="team_detail">
                    <div class="team_detail_inner">
                        <img src="{{ $teacher['avatar'] }}" alt="team_img">
                    </div>
                </li>
                @endforeach

            </ul>
        </div>
    </div>
</section>