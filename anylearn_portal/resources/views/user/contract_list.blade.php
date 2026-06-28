@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('body')
<div class="card shadow">
    <div class="card-body">
        <form class="row">
            <div class="col-xs-12 col-lg-2 mr-1 mb-1">
                <input type="checkbox" class="" name="ic" id="is_cancel" {{ app('request')->input('ic') == 'on' ? 'checked' : '' }}>
                <label for="is_cancel">@lang('Hiện HD Đã Huỷ')</label>
            </div>
            <div class="col-xs-12 col-lg-3 mr-1 mb-1">
                <select class="form-control" name="t" id="">
                    <option {{ app('request')->input('t') == 'name' ? 'selected' : '' }} value="name">@lang('Tên Thành viên')</option>
                    <option {{ app('request')->input('t') == 'phone' ? 'selected' : '' }} value="phone">@lang('Số điện thoại')</option>
                </select>
            </div>
            <div class="col-xs-12 col-lg-5 mr-1 mb-1">
                <input value="{{ app('request')->input('s') }}" type="text" class="form-control" name="s" placeholder="{{ __('Tìm kiếm') }}" />
            </div>
            <div class="col-xs-12 col-lg-1 mr-1 mb-1">
                <button class="btn btn-primary btn form-control"><i class="fas fa-search"></i></button>
            </div>
        </form>
    </div>
</div>
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-striped table-hover table-bordered">
            <thead class="">
                <tr>
                    <th class="text-center" width="5%" scope="col">#ID</th>
                    <th>@lang('Thành viên')</th>
                    <th>@lang('SDT')</th>
                    <th>@lang('Trạng thái')</th>
                    <th class="text-center">@lang('Cập nhật')</th>
                    <th class="text-right" scope="col">@lang('Thao tác')</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($list))
                @foreach($list as $contract)
                <tr>
                    <th class="text-center" scope="row">{{ $contract->id }}</th>
                    <td>{{ $contract->name }}</td>
                    <td>{{ $contract->phone }}</td>
                    <td><label class="badge badge-{{ $userServ->contractColor($contract->status) }}">{{ $userServ->contractStatus($contract->status)  }}</label></td>
                    <td class="text-center">{{ date('H:i d/m/y', strtotime($contract->updated_at)) }}</td>
                    <td class="text-right">
                        <a class="btn btn-sm btn-primary" href="{{ route('user.contract.info', ['id' => $contract->id]) }}"><i class="fas fa-edit"></i> @lang('Xem')</a>
                    </td>
                </tr>
                @endforeach
                @endif
            </tbody>
        </table>

    </div>
    <div class="card-footer">
        <div>{{ $list->links() }}</div>
    </div>
</div>
@endsection