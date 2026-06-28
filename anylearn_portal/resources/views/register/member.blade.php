@extends('register.form')
@section('header1')
    @lang('Cùng anyLEARN học tập không giới hạn')
@endsection
@section('header2')
    @lang('Đăng ký anyMEMBER')
@endsection
@section('introduce')
    @if (Session::get('locale') == null || Session::get('locale') == 'vi')
        <div>
            <img src="/cdn/img/register/form_header.png" alt="">
        </div>
        <div class="m2">
            <img src="/cdn/img/register/form_functions.png" alt="">
        </div>
        <div class="row p1">
            <div class="col-4">
                <img src="/cdn/img/register/member_func1.png" alt="">
            </div>
            <div class="col-4">
                <img src="/cdn/img/register/member_func2.png" alt="">
            </div>
            <div class="col-4">
                <img src="/cdn/img/register/member_func3.png" alt="">
            </div>
        </div>
        <div class="m2">
            <img src="/cdn/img/register/member_benefit.png" alt="">
        </div>
        <div class="row p1">
            <div class="col-4">
                <img src="/cdn/img/register/member_benefit1.png" alt="">
            </div>
            <div class="col-4">
                <img src="/cdn/img/register/member_benefit2.png" alt="">
            </div>
            <div class="col-4">
                <img src="/cdn/img/register/member_benefit3.png" alt="">
            </div>
        </div>
    @else
        <div>
            <img src="/cdn/img/register/form_header_en.png" alt="">
        </div>
        <div class="m2">
            <img src="/cdn/img/register/form_functions_en.png" alt="">
        </div>
        <div class="row p1">
            <div class="col-4">
                <img src="/cdn/img/register/member_func1_en.png" alt="">
            </div>
            <div class="col-4">
                <img src="/cdn/img/register/member_func2_en.png" alt="">
            </div>
            <div class="col-4">
                <img src="/cdn/img/register/member_func3_en.png" alt="">
            </div>
        </div>
        <div class="m2">
            <img src="/cdn/img/register/member_benefit_en.png" alt="">
        </div>
        <div class="row p1">
            <div class="col-4">
                <img src="/cdn/img/register/member_benefit1_en.png" alt="">
            </div>
            <div class="col-4">
                <img src="/cdn/img/register/member_benefit2_en.png" alt="">
            </div>
            <div class="col-4">
                <img src="/cdn/img/register/member_benefit3_en.png" alt="">
            </div>
        </div>
    @endif
@endsection
