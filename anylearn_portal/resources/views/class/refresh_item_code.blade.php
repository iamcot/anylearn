@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')
@extends('layout')
@section('rightFixedTop')
    <!--div class="col-xs-2 mr-1">
        <a class="btn btn-success btn-sm border-0 rounded-pill" href="#"><i class="fas fa-plus">
            </i> <span class="mobile-no-text"> @lang('Thêm mới')</span></a>
    </div-->
@endsection
@section('body')
    <div class="card shadow">
        <div class="card-header"> 
            <strong>Thông tin kích hoạt</strong>
        </div> 
        <div class="card-body p-0">
            <form method="post" class="py-2">
                @csrf
                <div class="form-group row">
                    <label for="user_id" class="col-md-3 col-form-label text-md-right ">{{ __('UserID') }}</label>
                    <div class="col-md-8">
                        <input id="user_id" type="text" class="form-control @error('user_id') is-invalid @enderror" name="user_id" value="{{ old('user_id', $itemCode->user_id) }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="order_detail_id" class="col-md-3 col-form-label text-md-right ">{{ __('Đơn hàng') }}</label>
                    <div class="col-md-8">
                        <input id="order_detail_id" type="text" class="form-control @error('order_detail_id') is-invalid @enderror" name="order_detail_id" value="{{ old('order_detail_id', $itemCode->order_detail_id) }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="code" class="col-md-3 col-form-label text-md-right ">{{ __('Mã kích hoạt') }}</label>
                    <div class="col-md-8">
                        <input id="code" type="text" class="form-control @error('code') is-invalid @enderror" name="code" value="{{ $itemCode->code }}" readonly>
                    </div>
                </div>
                <div class="form-group row">
                    <label class="col-md-3 col-form-label text-md-right "></label>
                    <div class="col-md-8">
                        <button class="btn btn-primary border-0 rounded" name="action" value="update">@lang('Sử dụng mã')</button>
                    </div>
                </div>             
            </form>
        </div>
    </div>
@endsection