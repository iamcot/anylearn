@inject('dashServ','App\Services\DashboardServices')

@extends('layout')
@section('body')
<form>
<div class="row mb-2">
    <div class="col-xs-6 col-sm-2">
        <input type="date" name="from" class="form-control" value="{{ @request('from') }}">
    </div>
    <div class="col-xs-6 col-sm-2">
        <input type="date" name="to" class="form-control" value="{{ @request('to') }}">
    </div>
    <div class="col-xs-6 col-sm-4">
        <select name="partner" class="form-control">
            <option value="">- ALL -</option>
            @foreach($partners as $partner)
                <option value="{{ $partner->id }}" {{ @request('partner') == $partner->id ? 'selected' : '' }}>{{ $partner->name }}</option>
            @endforeach
        </select>
    </div>
    <button class="btn btn-success btn-sm"><i class="fa fa-search"></i></button>
</div>
</form>
<div class="row">
    @include('dashboard.count_box', ['title' => 'Doanh thu', 'data' => number_format($grossRevenue,0,',','.'),
    'icon' => 'fa-fire', 'color' => 'primary'])
    @include('dashboard.count_box', ['title' => 'Doanh thu thuần', 'data' =>  number_format($netRevenue,0,',','.'),
    'icon' => 'fa-fire', 'color' => 'primary'])
    @include('dashboard.count_box', ['title' => 'Lãi gộp', 'data' =>  number_format($grossProfit,0,',','.'),
    'icon' => 'fa-fire', 'color' => 'success'])
    @include('dashboard.count_box', ['title' => 'Lãi ròng', 'data' =>  number_format($netProfit,0,',','.'),
    'icon' => 'fa-fire', 'color' => 'success'])
</div>
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-striped table-hover table-bordered">
            <thead class="">
                <tr>
                    <th class="text-center" width="10%" scope="col">#ID</th>
                    <th class="text-center">@lang('User (SDT)')</th>
                    <th class="text-center">@lang('Nội dung')</th>
                    <th class="text-center">@lang('Loại')</th>
                    <th class="text-center">@lang('Số tiền')</th>
                    <th class="text-center">@lang('Thông tin')</th>
                    <th class="text-center">@lang('Cập nhật')</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($transaction))
                @foreach($transaction as $row)
                <tr class="text-{{ $row->type == 'order' ? 'success' : 'danger' }}">
                    <th class="text-center" scope="row">{{ $row->id }}</th>
                    <td class="text-center" scope="row">@if(!empty($row->user)) {{ $row->user->name }} ({{ $row->user->phone }}) @endif</td>
                    <td>{{ $row->content }}</td>
                    <td class="text-center" scope="row">{{ $row->type }}</td>
                    <td class="text-center" scope="row">{{ number_format($row->amount * -1) }}</td>
                    <td class="text-center" scope="row">{{ $row->pay_info }}</td>
                    <td class="text-center">{{ date('H:i d/m/y', strtotime($row->created_at)) }}</td>
                   
                </tr>
                @endforeach
                @endif
            </tbody>
        </table>
    </div>
    <div class="card-footer">
        <div>{{ $transaction->appends(request()->query())->links() }}</div>
    </div>
</div>
@endsection