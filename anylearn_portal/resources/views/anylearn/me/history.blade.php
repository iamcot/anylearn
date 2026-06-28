@extends('anylearn.me.layout')
@section('spmb')
history
@endsection
@section('body')
{{-- <div class="card p-3 mb-3">
        <div class="strong">anyPoint:</div>
        <div class="row">
            <div class="col-md-8">
                <h3 class="text-danger fs-3">{{ auth()->user()->wallet_c }}</h3>
</div>
<div class="col-md-4 text-end"><a target="_blank" href="https://anylearn.vn/helpcenter/tich-luy-diem">@lang('anyPoint là gì?')</a></div>
</div>
</div> --}}
{{-- <ul class="nav nav-tabs" id="classtab" role="tablist">
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary active" id="done-tab"
                data-bs-toggle="tab" data-bs-target="#done" type="button" role="tab" aria-controls="done"
                aria-selected="true">@lang('Lịch sử thanh toán')</button>
        </li>
        <li class="nav-item" role="presentation">
            <button class="nav-link text-secondary" id="open-tab"
                data-bs-toggle="tab" data-bs-target="#open" type="button" role="tab" aria-controls="open"
                aria-selected="true">@lang('Lịch sử anyPoint')</button>
        </li>
    </ul>
    <div class="tab-content border border-top-0 mb-5 shadow bg-white" id="myTabContent">
        <div class="tab-pane fade show active p-2" id="done"
            role="tabpanel" aria-labelledby="done-tab">
            <table class="table text-secondary table-hover">
                <tbody>
                    @foreach ($WALLETM as $row)
                    <tr>
                        <td class="text-start" scope="col-md-6"><b>{{ $row->content }}</b><br>
{{ $row->created_at }} <br>
@if ($row->status == 0)
<b>@lang('Đang chờ')</b>
@else
<b class="text-danger">@lang('Đã xác nhận')</b>
@endif
</td>
<td class="text-end text-danger" scope="col-md-6"><br>{{ abs($row->amount) }}</td>
</tr>
@endforeach
</tbody>
</table>
</div>
<div class="tab-pane fade p-2" id="open" role="tabpanel" aria-labelledby="open-tab">
    <table class="table  text-secondary table-hover">

        <tbody>
            @foreach ($WALLETC as $row)
            <tr>
                <td class="text-start" scope="col-md-6"><b>{{ $row->content }}</b><br>
                    {{ $row->created_at }} <br>
                    @if ($row->status == 0)
                    <b>@lang('Đang chờ')</b>
                    @else
                    <b class="text-danger">@lang('Đã xác nhận')</b>
                    @endif
                </td>
                @if ($row->amount >= 0)
                <td class="text-end text-danger" scope="col-md-6"><br>+{{ abs($row->amount) }}
                </td>
                @else
                <td class="text-end text-black" scope="col-md-6"><br>{{ abs($row->amount) }}
                </td>
                @endif
            </tr>
            @endforeach
        </tbody>
    </table>
</div>
</div> --}}
<h1 class="">Giao dịch của tôi</h1>
<div class="row">
    @include('dashboard.count_box_partner', [
    'title' => 'anyPOINT ĐÃ NHẬN',
    'data' => number_format($pointReiceived, 0, ',', '.'),
    'icon' => 'fa-dollar-sign',
    'color' => 'success',
    ])
    @include('dashboard.count_box_partner', [
    'title' => 'anyPOINT CHỜ NHẬN',
    'data' => number_format($pointWait, 0, ',', '.'),
    'icon' => 'fa-dollar-sign',
    'color' => 'primary',
    ])
</div>
<div class="card shadow">
    <div class="card-body">
        <ul class="nav nav-tabs" id="myTab" role="tablist">
            <li class="nav-item" role="presentation">
                <button class="nav-link active" id="points-tab" data-bs-toggle="tab" data-bs-target="#points" type="button" role="tab" aria-controls="points" aria-selected="false">Lịch sử điểm thưởng</button>
            </li>
            <li class="nav-item" role="presentation">
                <button class="nav-link " id="history-tab" data-bs-toggle="tab" data-bs-target="#history" type="button" role="tab" aria-controls="history" aria-selected="true">Lịch sử giao dịch</button>
            </li>

        </ul>
        <div class="tab-content" id="myTabContent">
            <div class="tab-pane fade" id="history" role="tabpanel" aria-labelledby="history-tab">

                <table class="table table-striped text-secondary">
                    <thead>
                        <tr class="text-secondary">
                            <th scope="col">Nội dung</th>
                            <th scope="col">Số tiền</th>
                            <th scope="col" class="text-end">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($WALLETM as $row)
                        <tr>
                            <td>{{ $row->content }}<br>{{ $row->created_at }}</td>
                            <td>{{ number_format(abs($row->amount)) }}</td>
                            <td class="text-end">
                                @if ($row->status == 0)
                                <b class="badge bg-secondary text-white">@lang('Đang chờ')</b>@else<b class="badge bg-success">@lang('Đã xác nhận')</b>
                                @endif
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
            <div class="tab-pane fade show active" id="points" role="tabpanel" aria-labelledby="points-tab">
                <table class="table table-striped table-hover">
                    <thead>
                        <tr class="text-secondary">
                            <th scope="col">Nội dung</th>
                            <th scope="col">Số điểm</th>
                            <th scope="col" class="text-end">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($WALLETC as $row)
                        <tr>
                            <td>{{ $row->content }}<br>{{ $row->created_at }}</td>
                            @if ($row->amount >= 0)
                            <td>+{{ abs($row->amount) }}</td>
                            @else
                            <td class="text-black">{{ abs($row->amount) }}</td>
                            @endif
                            <td class="text-end">
                                @if ($row->status == 0)
                                <b class="badge bg-secondary text-white">@lang('Đang chờ')</b>@else<b class="badge bg-success">@lang('Đã xác nhận')</b>
                                @endif
                            </td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
@endsection