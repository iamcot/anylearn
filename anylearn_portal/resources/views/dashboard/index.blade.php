@inject('dashServ','App\Services\DashboardServices')
@php
$dashServ->init(@request('dateF') ?? date('Y-m-d', strtotime('-30 days')), @request('dateT') ?? date('Y-m-d'));
@endphp

@extends('layout')
@section('rightFixedTop')
<form>
    <div class="d-flex flex-row pt-3">
        <div class="form-group mr-2">
            <input type="date" class="form-control" name="dateF" value="{{ @request('dateF') ?? date('Y-m-d', strtotime('-30 days')) }}" placeholder="Từ">
        </div>
        <div class="form-grou mr-2">
            <input type="date" class="form-control" name="dateT" value="{{ @request('dateT') ?? date('Y-m-d') }}" placeholder="Đến">
        </div>
        <div class="form-group">
            <button class="btn btn-success">Xem</button>
        </div>
    </div>
</form>
@endsection
@section('body')
<div class="row">
    @include('dashboard.count_box', ['title' => 'Khóa học trong kỳ', 'data' => number_format($dashServ->itemCount(false),0,',','.'),
    'icon' => 'fa-fire', 'color' => 'danger'])
    @include('dashboard.count_box', ['title' => 'Thành viên trong kỳ', 'data' => number_format($dashServ->userCount('member', false),0,',','.'),
    'icon' => 'fa-users', 'color' => 'success' ])
    @include('dashboard.count_box', ['title' => 'Doanh thu trong kỳ', 'data' => number_format($dashServ->gmv(false),0,',','.'),
    'icon' => 'fa-dollar-sign', 'color' => 'primary' ])
    @include('dashboard.count_box', ['title' => 'Tổng Giảng Viên', 'data' => number_format($dashServ->userCount('teacher'),0,',','.'),
    'icon' => 'fa-chalkboard-teacher', 'color' => 'info'])

    @include('dashboard.count_box', ['title' => 'Tổng Khóa học', 'data' => number_format($dashServ->itemCount(),0,',','.'),
    'icon' => 'fa-fire', 'color' => 'danger'])
    @include('dashboard.count_box', ['title' => 'Tổng Thành viên', 'data' => number_format($dashServ->userCount('member'),0,',','.'),
    'icon' => 'fa-users', 'color' => 'success' ])
    @include('dashboard.count_box', ['title' => 'Tổng Doanh thu', 'data' => number_format($dashServ->gmv(),0,',','.'),
    'icon' => 'fa-dollar-sign', 'color' => 'primary' ])
    @include('dashboard.count_box', ['title' => 'Tổng Trường học', 'data' => number_format($dashServ->userCount('school'),0,',','.'),
    'icon' => 'fa-university', 'color' => 'info'])

</div>
<div class="row mb-3">
    <div class="col-md-12">
        <div class="card border-bottom-primary shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">@lang('Sale activities')</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">

                <table class="table table-responsive table-striped table-freeze-col table-bordered">
                    @foreach($dashServ->saleReport() as $index => $row)
                    <tr>
                        @foreach($row as $day => $col)
                        <td>@if ($index == 0)
                            {{ $col }}
                            @else 
                                @if($day == 0)
                                @php $saleName = json_decode($col, true)['name']; $saleId = json_decode($col, true)['id']; @endphp {{ $saleName }}
                                @else
                                <a href="{{ route('user.members') . '?sale_id=' . $saleId . '&adate=' . $day }}">{{ $col }}</a>
                                @endif
                            @endif
                        </td>
                        @endforeach
                    </tr>
                    @endforeach
                </table>
            </div>
        </div>
    </div>
</div>
<div class="row">
    <div class="col-md-6">
        <div class="card border-bottom-primary shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">@lang('Người dùng đăng ký mới')</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <canvas id="myAreaChart"></canvas>
            </div>
        </div>
        <div class="card border-bottom-success shadow mt-3">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-success">@lang('Doanh thu gộp (GMV)')</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <canvas id="gmvChart"></canvas>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card border-bottom-success shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">@lang('Top GV/Trường được mua')</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <table class="table">
                    <tbody>
                        @foreach($dashServ->topUser() as $user)
                        <tr>
                            <th>{{ $user->name }}</th>
                            <td>{{ $user->reg_num }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card border-bottom-danger shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">@lang('Top Khóa học được mua')</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <table class="table">
                    <tbody>
                        @foreach($dashServ->topItem() as $item)
                        <tr>
                            <th>{{ $item->title }}</th>
                            <td>{{ $item->reg_num }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>


</div>
@endsection
@if($dashServ != null)
@section('jscript')
<script src="/cdn/vendor/chart.js/Chart.min.js"></script>
<script>
    var chartData = JSON.parse("{{ json_encode($dashServ->userCreatedByDay()) }}".replace(/&quot;/g, '"'));
    var gmvChartData = JSON.parse("{{ json_encode($dashServ->revenuechartDataset()) }}".replace(/&quot;/g, '"'));
    var ctx = document.getElementById("myAreaChart");
    var ctxGmvChart = document.getElementById("gmvChart");
    var myLineChart = drawChart(ctx, chartData, 'Người dùng mới', {});
    var gmvChart = drawChart(ctxGmvChart, gmvChartData, "Doanh thu gộp", { style: 'currency', currency: 'VND' });

    function drawChart(ctx, chartData, mlabel, mFormat) {
        return new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData['labels'],
            datasets: [{
                label: mlabel,
                lineTension: 0.3,
                backgroundColor: "rgba(78, 115, 223, 0.05)",
                borderColor: "rgba(78, 115, 223, 1)",
                pointRadius: 3,
                pointBackgroundColor: "rgba(78, 115, 223, 1)",
                pointBorderColor: "rgba(78, 115, 223, 1)",
                pointHoverRadius: 3,
                pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                pointHitRadius: 10,
                pointBorderWidth: 2,
                data: chartData['data'],
            }],
        },
        options: {
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 10,
                    right: 25,
                    top: 25,
                    bottom: 0
                }
            },
            scales: {
                xAxes: [{
                    time: {
                        unit: 'Ngày'
                    },
                    gridLines: {
                        display: false,
                        drawBorder: true
                    },
                    ticks: {
                        maxTicksLimit: 12
                    }
                }],
                yAxes: [{
                    ticks: {
                        maxTicksLimit: 5,
                        padding: 10,
                        callback: function(value, index, values) {
                            return Intl.NumberFormat('vi-VN', mFormat).format(value);
                        }
                    },
                    gridLines: {
                        color: "rgb(234, 236, 244)",
                        zeroLineColor: "rgb(234, 236, 244)",
                        drawBorder: false,
                        borderDash: [2],
                        zeroLineBorderDash: [2]
                    }
                }],
            },
            legend: {
                display: false
            },
            tooltips: {
                backgroundColor: "rgb(255,255,255)",
                bodyFontColor: "#858796",
                titleMarginBottom: 10,
                titleFontColor: '#6e707e',
                titleFontSize: 14,
                borderColor: '#dddfeb',
                borderWidth: 1,
                xPadding: 15,
                yPadding: 15,
                displayColors: false,
                intersect: false,
                mode: 'index',
                caretPadding: 10,
                callbacks: {
                    label: function(tooltipItem, chart) {
                        var datasetLabel = chart.datasets[tooltipItem.datasetIndex].label || '';
                        return datasetLabel + ': ' +  Intl.NumberFormat('vi-VN', mFormat).format(tooltipItem.yLabel);
                    }
                }
            }
        }
    });
    }
</script>
@endsection
@endif