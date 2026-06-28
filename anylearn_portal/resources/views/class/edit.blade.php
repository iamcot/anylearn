@inject('userServ','App\Services\UserServices')

@extends('layout')

@section('morestyle')
@parent
<link href="/cdn/vendor/select2/select2.min.css" rel="stylesheet">
@endsection


@section('body')
@if(!$userServ->isSale() || @auth()->user()->role == App\Constants\UserConstants::ROLE_SALE_CONTENT)
<form action="" method="post" id="courseEditForm" enctype="multipart/form-data">
    @csrf
    @endif
    <input type="hidden" name="id" value="{{ !empty($courseId) ? $courseId : 0 }}">
    <input type="hidden" name="action" value="{{ empty($courseId) ? 'create' : 'update' }}">
    <div class="card p-3 mb-3 shadow">
            @if($userServ->isMod())
            <div class="form-group row">
                <label for="user_id" class="col-md-3 col-form-label text-md-right  font-weight-bold">{{ __('Đối tác') }}</label>
                <div class="col-md-8">
                    <select class="form-control" name="user_id" id="user_id" required @if(!empty($course)) disabled @endif>
                        <option value="">@lang('Chọn một đối tác')</option>
                        @foreach($partners as $partner)
                        <option value="{{ $partner->id }}" {{ !empty($course) && $course['info']->user_id == $partner->id ? 'selected' : '' }}>{{ $partner->name }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            @endif
            <div class="form-group row">
                <label for="subtype" class="col-md-3 col-form-label text-md-right  font-weight-bold">{{ __('Loại khoá học') }}</label>
                <div class="col-md-8">
                    <select class="form-control" name="subtype" required @if(!empty($course) && $course['info']->subtype != "") @endif>

                    <option value="{{ \App\Constants\ItemConstants::SUBTYPE_OFFLINE }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_OFFLINE ? 'selected' : '' }}>@lang('Lớp học Phổ thông (K12, Đại học)')</option>
                    <option value="{{ \App\Constants\ItemConstants::SUBTYPE_PRESCHOOL }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_PRESCHOOL ? 'selected' : '' }}>@lang('Lớp học Mầm non')</option>
                        <option value="{{ \App\Constants\ItemConstants::SUBTYPE_EXTRA }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_EXTRA ? 'selected' : '' }}>@lang('Lớp học Ngoại khóa (các môn kỹ năng tại trường/ trung tâm)')</option>
                        <option value="{{ \App\Constants\ItemConstants::SUBTYPE_ONLINE }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_ONLINE ? 'selected' : '' }}>@lang('Lớp học Online')</option>
                        <option value="{{ \App\Constants\ItemConstants::SUBTYPE_DIGITAL }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_DIGITAL ? 'selected' : '' }}>@lang('Học trên Ứng dụng')</option>
                        <option value="{{ \App\Constants\ItemConstants::SUBTYPE_VIDEO }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_VIDEO ? 'selected' : '' }}>@lang('Học qua video')</option>
                    </select>
                </div>
            </div>
        </div>
    <div class="row nav-pills-custom">
        <div class="col-2">
            <div class="nav flex-column nav-pills" id="v-pills-tab" role="tablist" aria-orientation="vertical">
                <a class="shadow nav-link {{ session('tab', 'info') == 'info' ? 'active' : '' }}" id="info-tab" data-toggle="pill" href="#v-pills-info" role="tab" aria-controls="v-pills-info" aria-selected="true"><i class="fa fa-info-circle"></i> <span class="mobile-no-text">@lang('Thông tin')</span></a>
                <a class="shadow nav-link {{ session('tab', 'info') == 'price' ? 'active' : '' }}" id="price-tab" data-toggle="pill" href="#v-pills-price" role="tab" aria-controls="v-pills-price" aria-selected="true"><i class="fa fa-dollar-sign"></i> <span class="mobile-no-text">@lang('Học phí')</span></a>
                <a class="shadow nav-link {{ session('tab', 'info') == 'contenttab' ? 'active' : '' }}" id="content-tab" data-toggle="pill" href="#v-pills-content" role="tab" aria-controls="v-pills-content" aria-selected="true"><i class="fa fa-font"></i> <span class="mobile-no-text">@lang('Giới thiệu')</span></a>
                @if(!empty($course) && !in_array( $course['info']->subtype, [\App\Constants\ItemConstants::SUBTYPE_DIGITAL, \App\Constants\ItemConstants::SUBTYPE_VIDEO]))
                <a class="shadow nav-link {{ session('tab') == 'schedule' ? 'active' : '' }} {{ empty($courseId) ? 'disabled' : '' }}" id="schedule-tab" data-toggle="pill" href="#v-pills-schedule" role="tab" aria-controls="v-pills-schedule" aria-selected="false" aria-disabled="{{ empty($courseId) ? 'true' : 'false' }}"><i class="fa fa-calendar-alt"></i> <span class="mobile-no-text">@lang('Lịch học')</span></a>
                @endif
                @if((!empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_DIGITAL) || isset($action))
                <a class="shadow nav-link {{ session('tab') == 'code' ? 'active' : '' }} {{ empty($courseId) ? 'disabled' : '' }}" id="code-tab" data-toggle="pill" href="#v-pills-code" role="tab" aria-controls="v-pills-code" aria-selected="false" aria-disabled="{{ empty($courseId) ? 'true' : 'false' }}"><i class="fa fa-bolt"></i> <span class="mobile-no-text">@lang('Mã kích hoạt')</span></a>
                @endif
                @if(!empty($course['info']) && $course['info']->subtype == 'video')
                <a class="shadow nav-link {{ session('tab') == 'video' ? 'active' : '' }} {{ empty($courseId) ? 'disabled' : '' }}" id="video-tab" data-toggle="pill" href="#v-pills-video" role="tab" aria-controls="v-pills-video" aria-selected="false" aria-disabled="{{ empty($courseId) ? 'true' : 'false' }}"><i class="fa fa-play"></i> <span class="mobile-no-text">@lang('Videos')</span></a>
                @endif

                <a class="shadow nav-link {{ session('tab') == 'resource' ? 'active' : '' }} {{ empty($courseId) ? 'disabled' : '' }}" id="resource-tab" data-toggle="pill" href="#v-pills-resource" role="tab" aria-controls="v-pills-resource" aria-selected="false" aria-disabled="{{ empty($courseId) ? 'true' : 'false' }}"><i class="fa fa-image"></i> <span class="mobile-no-text">@lang('Hình ảnh')</span></a>
                @if($isSchool)
                <a class="shadow nav-link {{ session('tab') == 'teachers' ? 'active' : '' }} {{ empty($courseId) ? 'disabled' : '' }}" id="teachers-tab" data-toggle="pill" href="#v-pills-teachers" role="tab" aria-controls="v-pills-teachers" aria-selected="false" aria-disabled="{{ empty($courseId) ? 'true' : 'false' }}"><i class="fa fa-chalkboard-teacher"></i> <span class="mobile-no-text">@lang('Giảng viên')</span></a>
                @endif
                <a class="shadow nav-link {{ session('tab') == 'rating' ? 'active' : '' }}" id="rating-tab" data-toggle="pill" href="#v-pills-rating" role="tab" aria-controls="v-pills-rating" aria-selected="false"><i class="fa fa-star"></i> <span class="mobile-no-text">@lang('Đánh giá')</span></a>
                <a class="shadow nav-link {{ session('tab') == 'registered' ? 'active' : '' }}" id="registered-tab" data-toggle="pill" href="#v-pills-registered" role="tab" aria-controls="v-pills-registered" aria-selected="false"><i class="fa fa-users"></i> <span class="mobile-no-text">@lang('Học viên')</span></a>
            </div>
        </div>
        <div class="col-10 pl-0 mb-3">
            <div class="tab-content" id="v-pills-tabContent">
                <div class="tab-pane fade {{ session('tab', 'info') == 'info' ? 'show active' : '' }}" id="v-pills-info" role="tabpanel" aria-labelledby="v-pills-info-tab">
                    @include('class.form.info')
                </div>
                <div class="tab-pane fade {{ session('tab', 'info') == 'price' ? 'show active' : '' }}" id="v-pills-price" role="tabpanel" aria-labelledby="v-pills-price-tab">
                    @include('class.form.price')
                </div>
                <div class="tab-pane fade {{ session('tab', 'info') == 'contenttab' ? 'show active' : '' }}" id="v-pills-content" role="tabpanel" aria-labelledby="v-pills-content-tab">
                    @include('class.form.content')
                </div>
                <div class="tab-pane fade {{ session('tab', 'info') == 'code' ? 'show active' : '' }}" id="v-pills-code" role="tabpanel" aria-labelledby="v-pills-code-tab">
                    @include('class.form.code')
                </div>

                <div class="tab-pane fade {{ session('tab') == 'schedule' ? 'show active' : '' }}" id="v-pills-schedule" role="tabpanel" aria-labelledby="v-pills-schedule-tab">
                    @include('class.form.schedule')
                </div>
                <div class="tab-pane fade {{ session('tab') == 'video' ? 'show active' : '' }}" id="v-pills-video" role="tabpanel" aria-labelledby="v-pills-video-tab">
                    @include('class.form.video')
                </div>

                <div class="tab-pane fade {{ session('tab') == 'resource' ? 'show active' : '' }}" id="v-pills-resource" role="tabpanel" aria-labelledby="v-pills-resource-tab">
                    @include('class.form.resource')
                </div>
                @if($isSchool)
                <div class="tab-pane fade {{ session('tab') == 'teachers' ? 'show active' : '' }}" id="v-pills-teachers" role="tabpanel" aria-labelledby="v-pills-teachers-tab">
                    @include('class.form.teachers')
                </div>
                @endif
                <div class="tab-pane fade {{ session('tab') == 'rating' ? 'show active' : '' }}" id="v-pills-rating" role="tabpanel" aria-labelledby="v-pills-rating-tab">
                    @include('class.form.rating')
                </div>
                <div class="tab-pane fade {{ session('tab') == 'registered' ? 'show active' : '' }}" id="v-pills-registered" role="tabpanel" aria-labelledby="v-pills-registered-tab">
                    @include('class.form.registered')
                </div>
            </div>
        </div>
    </div>
    @if(!$userServ->isSale())
</form>
@endif
@endsection
@section('jscript')
<script src="/cdn/vendor/ckeditor5/ckeditor.js"></script>
<script src="/cdn/vendor/jquery/jquery.mask.js"></script>
<script src="/cdn/vendor/jquery/speakingurl.min.js"></script>
<script src="/cdn/vendor/select2/select2.min.js"></script>
<script>
    var allEditors = document.querySelectorAll('.editor');
    var editorConfig = {
        mediaEmbed: {
                previewsInData: true
            },
        simpleUpload: {
            uploadUrl: "{{ @route('upload.ckimage5') }}",
            withCredentials: true,
            headers: {
                'X-CSRF-TOKEN': "{{ csrf_token() }}",
            }
        }
    };
    for (var i = 0; i < allEditors.length; ++i) {
        ClassicEditor.create(allEditors[i], editorConfig)
            .catch(error => {
                console.log(error);
            });
    }

    function formatSlug(field, id) {
        $("#" + id).val(getSlug(field.value));
    }

    $(function() {
        $("#user_id").select2();

        $('.time').mask('00:00');

        $("#age-range").slider({
            range: true,
            min: 0,
            max: 60,
            values: [$("#age-amount").data('ages_min'), $("#age-amount").data('ages_max')],
            slide: function(event, ui) {
                $("#age-amount").val(ui.values[0] + "-" + ui.values[1]);
            }
        });
        $("#age-amount").val($("#age-range").slider("values", 0) +
            "-" + $("#age-range").slider("values", 1));
    });

    $('#courseSubmit').click(function() {
        $("#courseEditForm").submit();
    });

    $('#companyCommission-action').click(function() {
        $('#companyCommissionModal').modal('show');
    });

    $("select[name=subtype]").on("change", function(e) {
        var select = $(this).val();
        if (select == "online") {
            $("#locationbox").show();
        } else {
            $("#locationbox").hide();
        }
    });

    function changeTab(tabName) {
        $("#" + tabName).tab('show');
        window.scrollTo(0, 0);
    }
</script>
@endsection
