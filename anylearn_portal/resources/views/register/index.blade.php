@extends('register.layout')
@section('body')
    <div class="card shadow mt-5 pb-5 mb-5 border rounded rounded-3">
        <div class="card-body">
            <div class="text-center mt-5">
                <h1 class="primary">@lang('Chào mừng bạn đến với')</h1>
                <p><img src="/cdn/img/register/index_logo.png" class="index_logo"></p>
            </div>
            @if (Session::get('locale') == null || Session::get('locale') == 'vi')
                <div class="row mt-5 ml-5 mr-5 text-center index_block">
                    <div class="col-lg-4 mb-3">
                        <a href="?r=member&s={{ request('sale') }}">
                            <img src="/cdn/img/register/index_member.png">
                        </a>
                    </div>
                    <div class="col-lg-4 mb-3">
                        <a href="?r=school">
                            <img src="/cdn/img/register/index_school.png">
                        </a>
                    </div>
                    <div class="col-lg-4 mb-3">
                        <a href="?r=teacher">
                            <img src="/cdn/img/register/index_teacher.png">
                        </a>
                    </div>
                </div>
            @else
                <div class="row mt-5 ml-5 mr-5 text-center index_block">
                    <div class="col-lg-4 mb-3">
                        <a href="?r=member&s={{ request('sale') }}">
                            <img src="/cdn/img/register/index_member_en.png">
                        </a>
                    </div>
                    <div class="col-lg-4 mb-3">
                        <a href="?r=school">
                            <img src="/cdn/img/register/index_school_en.png">
                        </a>
                    </div>
                    <div class="col-lg-4 mb-3">
                        <a href="?r=teacher">
                            <img src="/cdn/img/register/index_teacher_en.png">
                        </a>
                    </div>
                </div>
            @endif
        </div>
    </div>
@endsection
