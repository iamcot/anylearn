@inject('userServ', 'App\Services\UserServices')

@extends('anylearn.me.layout')
@section('spmb')
class_edit
@endsection
@section('rightFixedTop')
<a class="btn btn-sm btn-success border-0 rounded-pill" href="{{ route('me.class.create') }}"><i class="fas fa-plus"></i>
    <span class="mobile-no-text">@lang('Thêm mới')</span></a>
@endsection

@section('body')
@if (!empty($course) && $course['info']->subtype == 'offline' && count($userLocations) == 0)
<p class="bg-danger p-2 text-white">@lang('Bạn chưa khởi tạo một địa chỉ cho khoá học offline, Vui lòng') <a class="text-white" href="/location/create">@lang('cập nhật tại đây')</a></p>
@endif
<form action="" method="post" id="courseEditForm" enctype="multipart/form-data">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($courseId) ? $courseId : 0 }}">
    <input type="hidden" name="action" value="{{ empty($courseId) ? 'create' : 'update' }}">
    <div class="card p-3 mb-3 shadow">
        <div class="form-group row">
            <label for="subtype" class="col-md-3 col-form-label text-md-right  font-weight-bold">{{ __('Loại Lớp học') }}</label>
            <div class="col-md-8">
                <select class="form-control" name="subtype" required @if(!empty($course) && $course['info']->subtype != "") @endif>
                    <option value="">@lang('Vui lòng chọn Loại Lớp Học để khởi tạo')</option>
                    <option value="{{ \App\Constants\ItemConstants::SUBTYPE_OFFLINE }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_OFFLINE ? 'selected' : '' }}>@lang('Lớp học Phổ thông (K12, Đại học)')</option>
                    <option value="{{ \App\Constants\ItemConstants::SUBTYPE_PRESCHOOL }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_PRESCHOOL ? 'selected' : '' }}>@lang('Lớp học Mầm non')</option>
                    <option value="{{ \App\Constants\ItemConstants::SUBTYPE_EXTRA }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_EXTRA ? 'selected' : '' }}>@lang('Lớp học Ngoại khóa (các môn kỹ năng tại trường/ trung tâm)')</option>
                    <option value="{{ \App\Constants\ItemConstants::SUBTYPE_ONLINE }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_ONLINE ? 'selected' : '' }}>@lang('Lớp học trực tuyến')</option>
                    <option value="{{ \App\Constants\ItemConstants::SUBTYPE_DIGITAL }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_DIGITAL ? 'selected' : '' }}>@lang('Học trên Ứng dụng')</option>
                    <option value="{{ \App\Constants\ItemConstants::SUBTYPE_VIDEO }}" {{ !empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_VIDEO ? 'selected' : '' }}>@lang('Học qua video')</option>
                </select>
            </div>
        </div>
    </div>
    <ul class="nav nav-tabs " style="@if(empty($course)) display:none; @endif" id="classtab" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'info' ? 'active' : '' }}" id="info-tab" data-bs-toggle="tab" data-bs-target="#info" type="button" role="tab" aria-controls="info" aria-selected="true"><i class="fa fa-info-circle"></i> <span class="d-none d-sm-block">@lang('Thông tin')</span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'price' ? 'active' : '' }}" id="price-tab" data-bs-toggle="tab" data-bs-target="#price" type="button" role="tab" aria-controls="price" aria-selected="true"><i class="fa fa-dollar-sign"></i> <span class="d-none d-sm-block">@lang('Học Phí')</span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'contenttab' ? 'active' : '' }}" id="content-tab" data-bs-toggle="tab" data-bs-target="#contenttab" type="button" role="tab" aria-controls="contenttab" aria-selected="true"><i class="fa fa-font"></i> <span class="d-none d-sm-block">@lang('Giới thiệu')</span></button>
        </li>
        @if((!empty($course) && $course['info']->subtype == \App\Constants\ItemConstants::SUBTYPE_DIGITAL) || isset($action))
        <li class="nav-item" role="presentation" id="digital-code">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'code' ? 'active' : '' }}" id="code-tab" data-bs-toggle="tab" data-bs-target="#code" type="button" role="tab" aria-controls="code" aria-selected="true"><i class="	fa fa-bolt"></i> <span class="d-none d-sm-block">@lang('Kích hoạt')</span></button>
        </li>
        @endif
        @if(!empty($course) && !in_array( $course['info']->subtype, [\App\Constants\ItemConstants::SUBTYPE_DIGITAL, \App\Constants\ItemConstants::SUBTYPE_VIDEO]))
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'schedule' ? 'active' : '' }}" id="schedule-tab" data-bs-toggle="tab" data-bs-target="#schedule" type="button" role="tab" aria-controls="schedule" aria-selected="true"><i class="fa fa-calendar-alt"></i> <span class="d-none d-sm-block">@lang('Lịch học')</span></button>
        </li>
        @endif
        @if(!empty($course) && $course['info']->subtype == 'video')
        <li class="nav-item d-none" role="presentation" id="vdo">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'video' ? 'active' : '' }}" id="video-tab" data-bs-toggle="tab" data-bs-target="#video" type="button" role="tab" aria-controls="video" aria-selected="true"><i class="fas fa-play"></i> <span class="d-none d-sm-block">@lang('VIDEO')</span></button>
        </li>
        @endif
        @if(!empty($course))
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'resource' ? 'active' : '' }}" id="resource-tab" data-bs-toggle="tab" data-bs-target="#resource" type="button" role="tab" aria-controls="resource" aria-selected="true"><i class="fa fa-image"></i> <span class="d-none d-sm-block">@lang('Tài liệu')</span></button>
        </li>
        @endif
        @if (!empty($courseId))
        <!-- <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'templatemail' ? 'active' : '' }}" id="templatemail-tab" data-bs-toggle="tab" data-bs-target="#templatemail" type="button" role="tab" aria-controls="templatemail" aria-selected="true"><i class="fas fa-envelope"></i> <span class="d-none d-sm-block">@lang('Send Mail')</span></button>
        </li> -->
        @endif
        @if (!empty($course) && $isSchool)
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'teachers' ? 'active' : '' }}" id="teachers-tab" data-bs-toggle="tab" data-bs-target="#teachers" type="button" role="tab" aria-controls="teachers" aria-selected="true"><i class="fa fa-chalkboard-teacher"></i> <span class="d-none d-sm-block">@lang('Giảng viên')</span></button>
        </li>
        @endif
        @if(!empty($course))
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'rating' ? 'active' : '' }}" id="rating-tab" data-bs-toggle="tab" data-bs-target="#rating" type="button" role="tab" aria-controls="rating" aria-selected="true"><i class="fa fa-star"></i> <span class="d-none d-sm-block">@lang('Đánh giá')</span></button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary fw-light {{ session('tab', 'info') == 'registers' ? 'active' : '' }}" id="registers-tab" data-bs-toggle="tab" data-bs-target="#registers" type="button" role="tab" aria-controls="registers" aria-selected="true"><i class="fa fa-users-cog"></i> <span class="d-none d-sm-block">@lang('Học viên')</span></button>
        </li>
        @endif
    </ul>

    <div class="tab-content border-top-2 mb-5 bg-white" style="@if(empty($course)) display:none; @endif" id="myTabContent">
        <div class="tab-pane fade {{ session('tab', 'info') == 'info' ? 'show active' : '' }} p-2" id="info" role="tabpanel" aria-labelledby="info-tab">
            @include('class.form.info')
        </div>
        <div class="tab-pane fade {{ session('tab', 'info') == 'price' ? 'show active' : '' }} p-2" id="price" role="tabpanel" aria-labelledby="price-tab">
            @include('class.form.price')
        </div>
        <div class="tab-pane fade {{ session('tab', 'info') == 'contenttab' ? 'show active' : '' }} p-2" id="contenttab" role="tabpanel" aria-labelledby="content-tab">
            @include('class.form.content')
        </div>
        <div class="tab-pane fade {{ session('tab', 'info') == 'code' ? 'show active' : '' }} p-2" id="code" role="tabpanel" aria -labelledby="code-tab">
            @include('class.form.code')
        </div>
        <div class="tab-pane fade {{ session('tab', 'info') == 'schedule' ? 'show active' : '' }} p-2" id="schedule" role="tabpanel" aria-labelledby="schedule-tab">
            @include('class.form.schedule')
        </div>
        <div class="tab-pane fade {{ session('tab', 'info') == 'video' ? 'show active' : '' }} p-2" id="video" role="tabpanel" aria-labelledby="video-tab">
            @include('class.form.video')
        </div>
        @if (!empty($courseId))
        <!-- <div class="tab-pane fade {{ session('tab', 'info') == 'templatemail' ? 'show active' : '' }} p-2" id="templatemail" role="tabpanel" aria-labelledby="templatemail-tab"> -->
            <!-- @include('class.form.templatemail') -->
        <!-- </div> -->
        @endif
        <div class="tab-pane fade {{ session('tab', 'info') == 'resource' ? 'show active' : '' }} p-2" id="resource" role="tabpanel" aria-labelledby="resource-tab">
            @include('class.form.resource')
        </div>
        @if ($isSchool)
        <div class="tab-pane fade {{ session('tab', 'info') == 'teachers' ? 'show active' : '' }} p-2" id="teachers" role="tabpanel" aria-labelledby="teachers-tab">
            @include('class.form.teachers')
        </div>
        @endif
        <div class="tab-pane fade {{ session('tab', 'info') == 'rating' ? 'show active' : '' }} p-2" id="rating" role="tabpanel" aria-labelledby="seo-tab">
            @include('class.form.rating')
        </div>
        <div class="tab-pane fade {{ session('tab', 'info') == 'registers' ? 'show active' : '' }} p-2" id="registers" role="tabpanel" aria-labelledby="registers-tab">
            @include('class.form.registered')
        </div>
    </div>
</form>
@endsection
@section('jscript')
@parent
<script src="/cdn/vendor/ckeditor5/ckeditor.js"></script>
<script src="/cdn/vendor/jquery/jquery.mask.js"></script>
<script src="/cdn/vendor/jquery/speakingurl.min.js"></script>
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
    $('.time').mask('00:00');

    function formatSlug(field, id) {
        $("#" + id).val(getSlug(field.value));
    }

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

    $(document).ready(function() {
        var select = $("select[name=subtype]").val();
        if (select == "video") {
            $("#vdo").removeClass("d-none");
        }
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
    })

    $("#schedule_generate").click(function() {
        var type = $(this).data("type");
        var num = $("#schedule_auto").find('#num').val();
        var configDays = $("#schedule_auto input:checkbox:checked").map(function() {
            return $(this).attr('name');
        }).get();
        var startDate = $("#opening_date").val() ?? $("#date_start").val();
        var configStartTime = $("#time_start").val();
        var configEndTime = $("#time_end").val();
        var dt = new Date(startDate);

        var html = "";
        if (configDays.length > 0) {
            for (i = 0; i < num;) {
                var weekdayStr = "d" + dt.getDay();
                if (configDays.includes(weekdayStr)) {
                    var month = dt.getMonth() + 1;
                    if (type == "create") {
                        html += "<tr>" +
                            "<td><input type=\"date\" name=\"schedule[" + i +
                            "][date]\" class=\"form-control\" value=\"" + dt.getFullYear() + "-" + (month < 10 ?
                                "0" : "") + month + "-" + (dt.getDate() < 10 ? "0" : "") + dt.getDate() +
                            "\"/></td>" +
                            "<td><input name=\"schedule[" + i +
                            "][time_start]\" class=\"time form-control\" value=\"" + configStartTime +
                            "\"/></td>" +
                            "<td></td></tr>";
                    } else {
                        $("#schedule_" + i + "_date").val(dt.getFullYear() + "-" + (month < 10 ? "0" : "") +
                            month + "-" + (dt.getDate() < 10 ? "0" : "") + dt.getDate());
                        if (configStartTime) {
                            $("#schedule_" + i + "_time_start").val(configStartTime);
                        }
                    }

                    i++;
                }
                dt.setDate(dt.getDate() + 1);
            }
        } else {
            alert("Vui lòng nhập số buổi và chọn ít nhất 1 ngày trong tuần.");
        }

        if (html.length > 0) {
            $("#schedule_result").html(html);
            $('.time').mask('00:00');
        }

    });

    function changeTab(tabName) {
        $("#" + tabName).tab('show');
        window.scrollTo(0, 0);
    }

    $("select[name=subtype]").on("change", function(e) {
        if ($(this).val() != "") {
            $("#classtab").show();
            $("#myTabContent").show();
        }

        if ($(this).val() == "video" || $(this).val() == "digital") {
            $("#box_time").hide();
            $("#box_price").hide();
        } else {
            $("#box_time").show();
            $("#box_price").show();
        }
        if ($(this).val() == "offline" || $(this).val() == "extra") {
            $("#box_activities").show();
        } else {
            $("#box_activities").hide();
        }

        if ($(this).val() == "digital") {
            $('#digital-code').show();
        } else {
            $('#digital-code').hide();
        }
    });
</script>
@endsection
