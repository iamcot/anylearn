@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('rightFixedTop')
<form class="row">
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success" href="{{ route('location.create') }}"><i class="fas fa-plus"></i> <span class="mobile-no-text">@lang('Thêm mới')</span></a>
    </div>
</form>
@endsection

@section('body')
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-striped table-hover table-bordered">
            <thead class="">
                <tr>
                    <th class="text-center" width="5%" scope="col">#ID</th>
                    <th width="5%" scope="col">Head</th>
                    <th>@lang('Tên văn phòng')</th>
                    <th>@lang('Địa chỉ')</th>
                    <th>GEO</th>
                    <th class="text-right" scope="col">@lang('Thao tác')</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($locations))
                @foreach($locations as $location)
                <tr>
                    <th class="text-center" scope="row">{{ $location->id }}</th>
                    <td>@if($location->is_head) <i class="fa fa-check"></i> @endif</td>
                    <td>{{ $location->title }}</td>
                    <td>{{ $location->address }}, {{ $location->ward_path}}</td>
                    <td>
                        <a href="https://www.google.com/maps/search/?api=1&query={{ $location->latitude }},{{ $location->longitude }}" target="_blank" rel="noopener noreferrer">@lang('Xem bản đồ')</a>
                    </td>
                    <td class="text-right">
                        <a href="{{ route('location.edit', ['id' => $location->id ]) }}"><i class="fa fa-edit"></i></a>
                    </td>
                </tr>
                @endforeach
                @endif
            </tbody>
        </table>
    </div>
    <div class="card-footer">
        <div>{{ $locations->links() }}</div>
    </div>
</div>
@endsection