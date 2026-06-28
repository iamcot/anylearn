@inject('itemServ','App\Services\ItemServices')
@extends('page_layout')
@section('body')
<div class="row mb-2">
    <div class="col-md-3">
        <div class="card">
            <div class="card-body">
                @if ($author->role == 'school')
                @include('list.school_sidebar')
                @else
                @include('list.teacher_sidebar')
                @endif
            </div>
        </div>
    </div>
    <div class="col-md-9 grid-box">
        @include('layout.breadcrumb', ['breadcrumb' => $breadcrumb])
        @if(count($classes) <= 0) 
        <p>
            {{ $author->role == 'school' ? 'Trung tâm' : 'Chuyên gia' }} @lang('này tạm thời chưa có khoá học nào đang mở.')
        </p>
        @else <ul class="row list-unstyled grid">
            @foreach($classes as $class)
            <li class="col mb-5">
                <div class="imagebox">
                    <img class="img-fluid img-thumbnail" src="{{ $class->image ?? '/cdn/img/school-no-image.png' }}">
                </div>

                <div class="description">
                    <div class="mb-2">@include('pdp.rating', ['score' => 5])</div>
                    <h5 class="grid_title">{{ $class->title }}</h5>
                    <div class="">
                        <a href="{{ $itemServ->classUrl($class->id) }}" class="btn btn-sm btn-primary form-control">@lang('XEM THÊM') <i class="fa fa-chevron-right"></i></a>
                    </div>
                </div>
            </li>
            @endforeach
            </ul>
            {{ $classes->appends(request()->query())->links() }}
            @endif
    </div>
</div>

@endsection
@section('jscript')
@parent

@endsection