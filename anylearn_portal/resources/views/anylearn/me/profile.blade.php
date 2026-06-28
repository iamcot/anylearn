@extends('anylearn.me.layout')
@section('rightFixedTop')
<div class="col-xs-2 mr-1">
    <a class="btn btn-success btn-sm border-0 rounded-pill" href="/me/edit"><i class="fas fa-edit">
        </i> <span class="mobile-no-text"> @lang('Cập nhật thông tin')</span></a>
</div>
@endsection
@section('body')
<style>
    .bg-holder {
        height: 150px;
        width: 100%;
    }

    .avatar-box {
        height: 150px;
    }

    button[aria-expanded="false"]:after {
        content: 'XEM THÊM';
    }

    button[aria-expanded="true"]:after {
        content: 'THU GỌN';
    }
</style>
<div class="row">
    <div class="col-lg-4">
        <div class="mb-3 card">
            <div class="card-body">
                <div>
                    @if($user->banner)
                    <div class="bg-holder rounded-3 rounded-bottom-0 shadow-sm text-center">
                        <img class="" src="{{ $user->banner }}" alt="">
                    </div>
                    @endif

                    <div class="avatar-box text-center mt-3">
                        @if($user->image)
                        <img class="rounded-circle img-thumbnail" src="{{ $user->image }}" alt="">
                        @else
                        <img class="rounded-circle img-thumbnail" src="/cdn/img/no-image.png" alt="">
                        @endif
                    </div>
                </div>
                <div class="text-center mt-3">
                    <h4 class="mb-2 text-success text-bold">{{ $user->name }}<span></span></h4>
                    <p>{!! nl2br($user->introduce) !!}</p>
                    <br>
                </div>
            </div>
        </div>
    </div>
    <div class="col-lg-8">
        <div class="mb-3 card ">
            <div class="bg-light card-header">
                <h5 class="mb-0">Thông tin</h5>
            </div>
            <div class="text-justify text-1000 card-body">
                <div class="">
                    <label class="form-label" for="lastName">Họ và tên:</label> {{ $user->name }}

                </div>
                <div class="">
                    <label class="form-label" for="lastName">Ngày sinh:</label> {{ $user->dob }}

                </div>
                <div class="">
                    <label class="form-label" for="lastName">Giới tính:</label> {{ $user->sex }}

                </div>
                <div class="">
                    <label class="form-label" for="lastName">CMND/CCCD:</label> {{ $user->cert_id }}

                </div>
                <div class="">
                    <label class="form-label" for="lastName">Mã giới thiệu:</label> {{ $user->refcode }}

                </div>
                <div class="">
                    <label class="form-label" for="lastName">Số điện thoại:</label> {{ $user->phone }}

                </div>
                <div class="">
                    <label class="form-label" for="lastName">Địa Chỉ:</label> {{ $user->address }}

                </div>
                @if($user->full_content)
                <div class="collapse" id="collapseExample">
                    <p>{!! $user->full_content !!}</p>
                </div>
                @endif
            </div>
            @if($user->full_content)
            <div class="bg-light p-0 border-top d-grid card-footer">
                <button class="ps-4 pe-4 border-0 btn btn-white shadow fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#collapseExample" aria-expanded="false" aria-controls="collapseExample">
                </button>
            </div>
            @endif
        </div>

        @endsection