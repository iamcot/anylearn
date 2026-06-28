@inject('userServ','App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
child_edit
@endsection
@section('body')

<form method="POST">
    @csrf
    <div class="card shadow">
        <div class="card-body">
            <div>
                <div class="form-group row">
                    <div class="row">
                        <div class="col-md-8">
                            <h6><b>@lang('Thông tin cá nhân')</b></h6>
                        </div>
                        <div class="col-md-4">
                            <div class="text-center">
                                <a href="" class="my-2 my-sm-0 ml-2" data-bs-toggle="modal" data-bs-target="#exampleModal"><i class="fas fa-edit"></i>@lang('Sửa thông tin')</a>
                            </div>
                        </div>
                    </div>
                    <label for="name" class="text-start col-md-3 col-form-label text-md-right">{{ __('Họ và tên*') }}</label>
                    <div class="col-md-8">
                        <input id="name" name="username" type="text" value="{{ !empty($userC) ? $userC->name : null }}" class="form-control @error('name') is-invalid @enderror" readonly>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="title" class="text-start col-md-3 col-form-label text-md-right">{{ __('Ngày sinh*') }}</label>
                    <div class="col-md-8">
                        <input id="title" type="date" value="{{ !empty($userC) ? $userC->dob : null }}" class="form-control @error('dob') is-invalid @enderror" name="dob" readonly>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="name" class="text-start col-md-3 col-form-label text-md-right">{{ __('Giới tính') }}</label>
                    <div class="col-md-8 mt-2">
                        <div class="row">
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" value="male" name="sex" id="sex" <?php if (empty($userC->sex) || $userC->sex == "male") echo "checked='checked'" ?> disabled>
                                    <label class="form-check-label" for="male">
                                        @lang('Nam')
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" value="female" name="sex" id="sex" <?php if (!empty($userC->sex) && $userC->sex == "female") echo "checked='checked'"; ?> disabled>
                                    <label class="form-check-label" for="female">
                                        @lang('Nữ')
                                    </label>
                                </div>
                            </div>
                            <div class="col-md-4">

                            </div>
                        </div>
                    </div>
                    <div class="form-group row ">
                        <h6><b>@lang('Thông tin khác')</b></h6>
                        <label for="introduce" class="text-start col-md-3 col-form-label text-md-right @error('content') is-invalid @enderror">{{ __('Giới thiệu ngắn') }}</label>
                        <br>
                        <div class="col-md-8">
                            <textarea class="form-control" id="introduce" name="introduce" readonly>{!! old('introduce', !empty($userC) ? $userC->introduce : '') !!}</textarea>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>

<h5 class="mt-3 strong">@lang('Khóa Học Đã Tham Gia')</h5>
<div class="card shadow">
    <div class="card-body">
        <div class="">
            <div class="form-group row">
                @if(count($courses) > 0)
                <a href="{{route('me.orders','search=&myselect='.$userC->id)}}" value="more" name="more" class="text-end"><i class="fas fa-angle-double-right"></i>@lang('Xem thêm...')</a>
                @else
                <p class="p-2">@lang('Tài khoản con này chưa tham gia bất kì khóa học nào')</p>
                @endif
                <div class="row">
                    @foreach($courses as $item)
                    <div class="col-md-3">
                        <div class="card-img">
                            <div class="imagebox">
                                <img src="{{ $item->image }}" class="img-fluid">
                            </div>
                            <div class="class-title mt-1 fw-bold p-1 text-success">{{ $item->title }}</div>
                        </div>
                    </div>
                    @endforeach

                </div>
            </div>
        </div>
    </div>
</div>
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
                                            <input class="form-check-input" type="radio" value="male" name="sex" id="sex" <?php if (empty($userC->sex) || $userC->sex == "male") echo "checked='checked'" ?>>
                                            <label class="form-check-label" for="male">
                                                @lang('Nam')
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" value="female" name="sex" id="sex" <?php if (!empty($userC->sex) && $userC->sex == "female") echo "checked='checked'"; ?>>
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
                            <button type="Submit" class="btn btn-success" name="save" value="save">@lang('Lưu')</button>
                        </div>
                </form>
            </div>

        </div>
    </div>
</div>

@endsection