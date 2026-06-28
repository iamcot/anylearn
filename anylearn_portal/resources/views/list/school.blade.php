@inject('itemServ','App\Services\ItemServices')
@extends('page_layout')
@section('spmb')
schools
@endsection
@section('body')
<div class="row">
    <div class="col-md-3">
    <form action="" method="get" id="schoolsearch">
        <div class="card">
            <div class="card-body">
                <h5>Tìm kiếm theo vị trí</h5>
                <div class="form-group">
                    <select class="form-control location-tree" data-next-level="district" name="p">
                        <option value="">--Tỉnh/Thành Phố--</option>
                        @foreach($provinces as $province)
                        <option value="{{ $province->code }}" {{ !empty($location) && $province->code == $location->province_code ? "selected" : ""}}>{{ $province->name }}</option>
                        @endforeach
                    </select>
                </div>
                <div class="form-group">
                    <select class="form-control location-tree" id="select-district" name="d">
                        @if(empty($wards))
                        <option value="">@lang('--Quận/Huyện--')</option>
                        @else
                        @foreach($wards as $ward)
                        <option value="{{ $ward->code }}" {{ $ward->code == $location->ward_code ? "selected" : ""}}>{{ $ward->name }}</option>
                        @endforeach
                        @endif
                    </select>
                </div>
                <hr>
                <button id="searchbtn" name="a" value="search" class="form-control btn btn-success btn-sm">@lang('TÌM KIÉM')</button>
            </div>
        </div>
    </div>
    <div class="col-md-9">
        @include('layout.breadcrumb', ['breadcrumb' => $breadcrumb])
        @if($hasSearch && $searchNotFound)
        <p>@lang('Không tìm thấy trung tâm bạn đang tìm kiếm, hãy tìm thử các trung tâm dưới đây nhé.')</p>
        <hr>
        @endif
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
                    <h5 class="grid_title"><strong>{{ $school->name }}</strong></h5>
                    <div class="">
                    <a href="{{ route('classes', ['role' => 'school', 'id' => $school->id ]) }}" class="btn btn-sm btn-primary form-control">@lang('CÁC KHOÁ HỌC') <i class="fa fa-chevron-right"></i></a>
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
<script src="/cdn/js/location-tree.js"></script>
@endsection