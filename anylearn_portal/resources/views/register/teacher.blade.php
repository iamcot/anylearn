@extends('register.form')
@section('header1')
    @lang('Cùng anyLEARN xây dựng cộng đồng học tập không giới hạn')
@endsection
@section('header2')
    @lang('Đăng ký anyPROFESSOR')
@endsection
@section('introduce')
    @if (Session::get('locale') == null || Session::get('locale') == 'vi')
        <div>
            <img src="/cdn/img/register/form_header.png" alt="">
        </div>
        <div class="m2">
            <img src="/cdn/img/register/teacher_step.png" alt="">
        </div>
        <div class="row p1">
            <div class="col-3">
                <img src="/cdn/img/register/teacher_step1.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_step2.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_step3.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_step4.png" alt="">
            </div>
        </div>
        <div class="m2">
            <img src="/cdn/img/register/reason.png" alt="">
        </div>
        <div class="row p1">
            <div class="col-3">
                <img src="/cdn/img/register/teacher_r1.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_r2.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_r3.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_r4.png" alt="">
            </div>
        </div>
    @else
        <div>
            <img src="/cdn/img/register/form_header_en.png" alt="">
        </div>
        <div class="m2">
            <img src="/cdn/img/register/teacher_step_en.png" alt="">
        </div>
        <div class="row p1">
            <div class="col-3">
                <img src="/cdn/img/register/teacher_step1_en.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_step2_en.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_step3_en.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_step4_en.png" alt="">
            </div>
        </div>
        <div class="m2">
            <img src="/cdn/img/register/reason_en.png" alt="">
        </div>
        <div class="row p1">
            <div class="col-3">
                <img src="/cdn/img/register/teacher_r1_en.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_r2_en.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_r3_en.png" alt="">
            </div>
            <div class="col-3">
                <img src="/cdn/img/register/teacher_r4_en.png" alt="">
            </div>
        </div>
    @endif
@endsection
