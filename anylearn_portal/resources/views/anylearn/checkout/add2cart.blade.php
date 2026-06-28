@inject('itemServ', 'App\Services\ItemServices')
@extends('anylearn.layout')
@section('spmb')
add2cart
@endsection
@section('body')
<!-- <h5 class="text-success mb-5">@lang('Vui lòng hoàn tất các bước sau để đăng ký khóa học')</h5> -->
<form class="" method="get" id="spmc" data-spm="{{ $item->id }}">
    <input type="hidden" name="class" value="{{ $item->id }}">
    <input type="hidden" name="api_token" value="{{ $api_token }}">

    <div class="card mb-3 border-left-primary shadow">
        <div class="card-header">
            <h5 class="modal-title m-0 font-weight-bold text-secondary"><i class="fa fa-shopping-cart"></i>
                @lang('Khóa học bạn đang đăng ký')</h5>
        </div>
        <div class="card-body">
            <h3 class="fw-bold text-success">{{ $item->title }}</h3>
            <p>Đối tác: {{ $author->name }}</p>
            <p>@lang('Học phí:') <strong>{{ number_format($item->price, 0, ',', '.') }}</strong></p>
            @if ($item->activiy_trial || $item->activiy_trial || $item->activiy_trial)
            @else
            <p>@lang('Bạn sẽ nhận') <strong>{{ number_format($commission, 0, ',', '.') }}</strong> @lang('anyPoint cho giao dịch này')
            </p>
            @endif

        </div>
    </div>
    <div class="card mb-3 border-left-primary shadow">
        <div class="card-header">
            <h5 class="modal-title m-0 font-weight-bold text-secondary"><i class="fa fa-user"></i> @lang('Bạn đang đăng ký cho')
            </h5>
        </div>
        <div class="card-body">

            <div class="form-check">
                <input type="radio" class="form-check-input" id="child0" name="child" value="{{ $user->id }}" checked><label for="child0">{{ $user->name }} (@lang('Tôi'))</label>
            </div>

            @if (count($children) > 0)
            @foreach ($children as $child)
            <div class="form-check">
                <input type="radio" class="form-check-input" id="child{{ $child->id }}" name="child" value="{{ $child->id }}"> <label for="child{{ $child->id }}">{{ $child->name }}</label>
            </div>
            @endforeach
            @endif
            <div class="float-right nav-link">
                <button type="button" class="btn btn-success border-0 rounded rounded-pill btn-sm my-2 my-sm-0 ml-2" data-bs-toggle="modal" data-bs-target="#exampleModal">Thêm người học mới</button>
            </div>
        </div>
    </div>
    @if (!in_array($item->subtype, ['digital', 'video']))
    @if ($checkActiviy)
    @else
    <div class="card mb-3 border-left-primary shadow">
        <div class="card-header">
            <h5 class="modal-title m-0 font-weight-bold text-secondary"><i class="fa fa-calendar"></i>
                @lang('Chọn Lịch học')
            </h5>
        </div>
        <div class="card-body p-0">
            @if (count($plans) > 0)
            <div class="accordion" id="plans">
                @foreach ($plans as $location)
                <div class="accordion-item">
                    <h2 class="accordion-header bg-success" id="headingLocation{{ $location['location']['id'] }}">
                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseLocation{{ $location['location']['id'] }}" aria-expanded="true" aria-controls="collapseLocation{{ $location['location']['id'] }}">
                            {{ $location['location']['location_title'] }}
                        </button>
                    </h2>
                    <div id="collapseLocation{{ $location['location']['id'] }}" class="accordion-collapse collapse @if ($loop->first) show @endif" aria-labelledby="headingLocation{{ $location['location']['id'] }}" data-bs-parent="#plans">
                        <div class="accordion-body">
                            <ul class="list-unstyled">
                                @foreach ($location['plans'] as $plan)
                                <li class="mt-3">
                                    <label for="plan_{{ $plan['id'] }}">
                                        <input required id="plan_{{ $plan['id'] }}" type="radio" name="plan" value="{{ $plan['id'] }}">
                                        <strong>{{ $plan['title'] }}</strong>
                                        <br>Lịch học: @foreach (explode(',', $plan['weekdays']) as $day)
                                        {{ $day == 1 ? __('Chủ Nhật') : __('Thứ ' . $day) }}
                                        {{ !$loop->last ? ', ' : '. ' }}
                                        @endforeach
                                        Bắt đầu từ
                                        {{ date('d/m/Y', strtotime($plan['date_start'])) }}
                                        , Giờ học: {{ $plan['time_start'] }} @if (!empty($plan['time_end']))
                                        - {{ $plan['time_end'] }}
                                        @endif
                                    </label>
                                </li>
                                @endforeach
                            </ul>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
            @else
            <p class="p-3">Lịch học bắt đầu từ ngày {{ date('d/m/Y', strtotime($item->date_start)) }}
                @if ($item->time_start)
                <br>Giờ học {{ $item->time_start }}.
                @endif
            </p>
            @endif
        </div>
    </div>
    @endif
    @endif
    @if (!empty($extras) && count($extras) > 0)
    @if ($checkActiviy)
    @else
    <div class="card mb-3 border-left-primary shadow">
        <div class="card-header">
            <h5 class="modal-title m-0 font-weight-bold text-secondary"><i class="fa fa-user"></i>
                @lang('Chọn phụ phí')
            </h5>
        </div>
        <div class="card-body">
            @foreach ($extras as $extra)
            <div class="form-check">
                <input type="checkbox" class="form-check-input" id="extra{{ $extra->id }}" name="extrafee[]" value="{{ $extra->id }}">
                <label for="extra{{ $extra->id }}" class="form-check-label">{{ $extra->title }} -
                    {{ number_format($extra->price) }}₫ </label>
            </div>
            @endforeach
        </div>
    </div>
    @endif

    @endif
    @if ($item->subtype == 'extra' || $item->subtype == 'offline')

    <div class="card mb-3 border-left-primary shadow">
        <div class="card-header">
            <h5 class="modal-title m-0 font-weight-bold text-secondary"><i class="fas fa-people-carry"></i>
                @lang('Các hoạt động trải nghiệm miễn phí')
            </h5>
        </div>
        <div class="card-body">
            <div class="form-check form-inline">
                <div class="row">
                    <div class="col-md-4">
                        <input class="form-check-input" type="checkbox" name="activiy_trial" id="checkbox1" @if (isset($activiy) && $activiy=='activiy_trial' ) checked @endif>
                        <label class="form-check-label" for="checkbox1">
                            @lang('Học thử')
                        </label>
                    </div>
                    <div class="col-md-4">
                        <input type="date" class="form-control ml-2" id="trial_date" name="trial_date" placeholder="Ngày">
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control ml-2" id="trial_note" name="trial_note" placeholder="Ghi chú">
                    </div>
                </div>
            </div>
            <div class="form-check form-inline">
                <div class="row">
                    <div class="col-md-4">
                        <input class="form-check-input" type="checkbox" name="activiy_visit" id="checkbox2" \ @if (isset($activiy) && $activiy=='activiy_visit' ) checked @endif>
                        <label class="form-check-label" for="checkbox2">
                            @lang('Tham quan trường')
                        </label>
                    </div>
                    <div class="col-md-4">
                        <input type="date" class="form-control ml-2" id="visit_date" name="visit_date" placeholder="Ngày">
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control ml-2" id="visit_note" name="visit_note" placeholder="Ghi chú">
                    </div>
                </div>

            </div>
            <div class="form-check form-inline">
                <div class="row">
                    <div class="col-md-4">
                        <input class="form-check-input" type="checkbox" name="activiy_test" id="checkbox3" @if (isset($activiy) && $activiy=='activiy_test' ) checked @endif>
                        <label class="form-check-label" for="checkbox3">
                            @lang('Đăng Kí Thi Đầu Vào')
                        </label>
                    </div>
                    <div class="col-md-4">
                        <input type="date" class="form-control ml-2" id="test_date" name="test_date" placeholder="Ngày">
                    </div>
                    <div class="col-md-4">
                        <input type="text" class="form-control ml-2" id="test_note" name="test_note" placeholder="Ghi chú">
                    </div>
                </div>
            </div>
        </div>
    </div>
    @endif
    <div class="text-center mb-5 mt-5">
        @if (!isset($activiy))
        <button name="action" value="saveCart" class="btn btn-success w-50 border-0 font-weight-bold mb-3">@lang('ĐĂNG KÝ HỌC')</button>

        @if ($item->subtype == 'extra' || $item->subtype == 'offline')
        <button name="action" value="saveActivity" class="btn btn-info w-50 border-0 font-weight-bold mb-3">@lang('CHỈ ĐĂNG KÝ TRẢI NGHIỆM')</button>
        @endif
        @else
        <button name="action" value="saveActivity" class="btn btn-success w-50 border-0 font-weight-bold">@lang('ĐĂNG KÝ TRẢI NGHIỆM')</button>
        @endif

    </div>
</form>
<!-- Modal -->
<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title center" id="exampleModalLabel">@lang('Tạo tài khoản con')</h5>
                <!-- <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button> -->
            </div>
            <div class="modal-body">
                <!-- Form  -->
                <form method="POST">
                    @csrf
                    <input type="hidden" name="api_token" value="{{ $api_token }}">
                    <div class="">
                        <div class="form-group row">
                            <h6><b>@lang('Thông tin cá nhân')</b></h6>
                            <label for="name" class="col-md-3 col-form-label text-md-right">{{ __('Họ và tên*') }}</label>
                            <div class="col-md-8">
                                <input id="name" value="{{ !empty($userC) ? $userC->name : null }}" name="username" type="text" class="form-control @error('name') is-invalid @enderror" required>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="title" class="col-md-3 col-form-label text-md-right">{{ __('Ngày sinh*') }}</label>
                            <div class="col-md-8">
                                <input id="title" value="{{ !empty($userC) ? $userC->dob : null }}" type="date" class="form-control @error('dob') is-invalid @enderror" name="dob">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="name" class="col-md-3 col-form-label text-md-right">{{ __('Giới tính') }}</label>
                            <div class="col-md-8 mt-2">
                                <div class="row">
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" value="male" name="sex" id="sex" <?php if (empty($userC->sex) || $userC->sex == 'male') {
                                                                                                                                echo "checked='checked'";
                                                                                                                            } ?>>
                                            <label class="form-check-label" for="male">
                                                @lang('Nam')
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" value="female" name="sex" id="sex" <?php if (!empty($userC->sex) && $userC->sex == 'female') {
                                                                                                                                echo "checked='checked'";
                                                                                                                            } ?>>
                                            <label class="form-check-label" for="female">
                                                @lang('Nữ')
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">

                                    </div>
                                </div>
                            </div>
                            <div class="form-group row">
                                <h6><b>@lang('Thông tin khác')</b></h6>
                                <label for="introduce" class="col-md-4 col-form-label text-md-right @error('content') is-invalid @enderror">{{ __('Giới thiệu ngắn') }}</label>
                                <br>
                                <div class="col-md-12">
                                    <textarea class="form-control" id="introduce" name="introduce">{!! old('introduce', !empty($userC) ? $userC->introduce : '') !!}</textarea>
                                </div>
                            </div>
                        </div>

                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">@lang('Hủy')</button>
                            <button type="Submit" class="btn btn-success" name="action" value="createChild">@lang('Lưu')</button>
                        </div>
                </form>
            </div>

        </div>
    </div>
</div>
@endsection
@section('jscript')
@parent
@endsection