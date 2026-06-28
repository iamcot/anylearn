@inject('itemServ','App\Services\ItemServices')
@extends('page_layout')
@section('spmb')
teachers
@endsection
@section('body')
<div class="row">
    <!-- <div class="col-md-3">
    <form action="" method="get" id="schoolsearch">
        <div class="card">
            <div class="card-body">
             
            </div>
        </div>
    </div> -->
    <div class="col-md-12">
        @include('layout.breadcrumb', ['breadcrumb' => $breadcrumb])
        @if(count($list) <= 0) 
        @else 
        <ul class="row list-unstyled grid">
            @foreach($list as $school)
            <li class="col mb-5">
                <div class="imagebox">
                    <img class="img-fluid img-thumbnail" src="{{ $school->image ?? '/cdn/img/school-no-image.png' }}">
                </div>
               
               <div class="description">
                    <div class="mb-2">@include('pdp.rating', ['score' => 5])</div>
                    <h5  class="grid_title"><strong>{{ $school->name }}</strong></h5>
                    <div class="">
                    <a href="{{ route('classes', ['role' => 'teacher', 'id' => $school->id ]) }}" class="btn btn-sm btn-primary form-control">@lang('CÁC KHOÁ HỌC') <i class="fa fa-chevron-right"></i></a>
                    </div>
               </div>
            </li>
            @endforeach
            </ul>
            {{ $list->appends(request()->query())->links() }}
            @endif
    </div>
</div>

@endsection
@section('jscript')
@parent
@endsection