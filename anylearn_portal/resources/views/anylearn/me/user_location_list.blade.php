@inject('userServ','App\Services\UserServices')
@extends($layout)
@section('spmb')
locations
@endsection
@section('morestyle')
@parent
<link href="/cdn/vendor/select2/select2.min.css" rel="stylesheet">
@endsection
@section('rightFixedTop')
<form class="row">
    @if($userServ->isMod() && !empty($partners))
    <div class="col-xs-8 me-2 mr-2">
        <select class="form-control location-tree" name="user_id" id="user_id" onchange="this.form.submit()">
            <option value="">@lang('Chọn một đối tác')</option>
            @foreach($partners as $partner)
            <option value="{{ $partner->id }}" {{ Request::get('user_id') == $partner->id ? 'selected' : '' }}>{{ $partner->name }}</option>
            @endforeach
        </select>
    </div>
    @endif
    @if(Request::get('user_id') || !$userServ->isMod())
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success btn-sm rounded-pill border-0" href="{{ route('location.create') }}?user_id={{ Request::get('user_id') }}"><i class="fas fa-plus"></i> <span class="mobile-no-text">@lang('Thêm mới')</span></a>
    </div>
    @endif
</form>
@endsection

@section('body')
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-hover">
            <thead class="table-secondary text-secondary">
                <tr class="">
                    <th class="text-center fw-normal border-0">ID</th>
                    <th class="fw-normal border-0" width="10%" scope="col">@lang('HỘI SỞ')</th>
                    <th class="fw-normal border-0">@lang('TÊN VĂN PHÒNG')</th>
                    <th class="fw-normal border-0" width="40%">@lang('ĐỊA CHỈ')</th>
                    <th class="fw-normal border-0">@lang('GEO')</th>
                    <th class="fw-normal border-0 text-right" scope="col">@lang('THAO TÁC')</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($locations))
                @foreach($locations as $location)
                <tr>
                    <th class="text-center" scope="row">{{ $location->id }}</th>
                    <td>@if($location->is_head) <i class="fa fa-check text-success"></i> @endif</td>
                    <td>{{ $location->title }}</td>
                    <td>{{ $location->address }}, {{ $location->ward_path}}</td>
                    <td>
                        <a href="https://www.google.com/maps/search/?api=1&query={{ $location->latitude }},{{ $location->longitude }}" target="_blank" rel="noopener noreferrer">@lang('Xem bản đồ')</a>
                    </td>
                    <td class="text-right">
                        <a class="btn btn-success btn-sm border-0" href="{{ route('location.edit', ['id' => $location->id ]) }}"><i class="fa fa-edit"></i></a>
                    </td>
                </tr>
                @endforeach
                @endif
            </tbody>
        </table>
        <div>{{ $locations->links() }}</div>
    </div>
</div>
@endsection
@section('jscript')
@parent
<script src="/cdn/vendor/select2/select2.min.js"></script>

<script>
    $(function() {
        $(".location-tree").select2();
    });
</script>
@endsection