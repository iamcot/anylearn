@inject('dashServ','App\Services\DashboardServices')
@php
$dashServ->init(@request('dateF') ?? date('Y-m-d', strtotime('-90 days')), @request('dateT'));
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

{{-- @extends('layout') --}}
@section('body')
<div class="row">
    @php
    $saleActivities = $dashServ->saleActivities($user->id);
    $saleAsigned = $dashServ->userCount(null,true,$user->id);
    @endphp

    @include('dashboard.count_box', ['title' => 'Tổng khách tiếp cận', 'data' => number_format($saleActivities,0,',','.'),
    'icon' => 'fa-briefcase', 'color' => 'success' ])
    @include('dashboard.count_box', ['title' => 'Tổng Khóa học bán', 'data' => number_format($dashServ->saleCount($user->id),0,',','.'),
    'icon' => 'fa-fire', 'color' => 'danger'])
    @include('dashboard.count_box', ['title' => 'Tổng Doanh thu', 'data' => number_format($dashServ->gmv(true, $user->id),0,',','.'),
    'icon' => 'fa-dollar-sign', 'color' => 'success' ])
    @include('dashboard.count_box', ['title' => 'Tập khách hàng', 'data' => number_format($saleAsigned,0,',','.'),
    'icon' => 'fa-users', 'color' => 'danger'])

    @include('dashboard.count_box', ['title' => 'Khách tiếp cận trong kì', 'data' => number_format($dashServ->saleActivities($user->id, false),0,',','.'),
    'icon' => 'fa-briefcase', 'color' => 'success' ])
    @include('dashboard.count_box', ['title' => 'Khóa học bán trong kì', 'data' => number_format($dashServ->saleCount($user->id, false),0,',','.'),
    'icon' => 'fa-fire', 'color' => 'danger'])
    @include('dashboard.count_box', ['title' => 'Doanh thu trong kì', 'data' => number_format($dashServ->gmv(false, $user->id),0,',','.'),
    'icon' => 'fa-dollar-sign', 'color' => 'success' ])

    @include('dashboard.count_box', ['title' => 'Tỉ lệ tiếp cận',
    'data' => number_format(($saleAsigned > 0 ? ($saleActivities / $saleAsigned ) * 100 : 0),0,',','.') . '%',
    'icon' => 'fa-users', 'color' => 'danger'])

</div>
<div class="row">
    <div class="col-md-6">
        <div class="card border-bottom-primary shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">Tiếp cận theo ngày</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <canvas id="myAreaChart"></canvas>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card border-bottom-primary shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">Top khách hàng</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <table class="table">
                    <tbody>
                        @foreach($dashServ->saleTopBuyer($user->id) as $buyer)
                        <tr>
                            <th>{{ $buyer->name }}</th>
                            <td>{{ number_format($buyer->gmv, 0, ',', '.') }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card border-bottom-primary shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">Top Khóa học bán</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <table class="table">
                    <tbody>
                        @foreach($dashServ->saleTopItems($user->id) as $item)
                        <tr>
                            <th>{{ $item->title }}</th>
                            <td>{{ number_format($item->num, 0, ',', '.') }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
    </div>


</div>
@endsection
@section('jscript')
<script src="/cdn/vendor/chart.js/Chart.min.js"></script>
<script>
    var chartData = JSON.parse("{{ json_encode($dashServ->saleActivitiesByDay($user->id)) }}".replace(/&quot;/g, '"'));
    var ctx = document.getElementById("myAreaChart");
    var myLineChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: chartData['labels'],
            datasets: [{
                    label: "Khách hàng tiếp cận",
                    lineTension: 0.3,
                    backgroundColor: "rgba(78, 115, 223, 0.05)",
                    borderColor: "rgba(78, 115, 223, 1)",
                    pointRadius: 1,
                    pointBackgroundColor: "rgba(78, 115, 223, 1)",
                    pointBorderColor: "rgba(78, 115, 223, 1)",
                    pointHoverRadius: 1,
                    pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                    pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                    pointHitRadius: 10,
                    pointBorderWidth: 1,
                    data: chartData['data'],
                    type: 'line',
                },
                {
                    label: 'Doanh thu (x1000)',
                    data: chartData['gmv'],
                    type: 'bar',
                    backgroundColor: "rgba(78, 115, 223, 0.5)",
                    borderColor: "rgba(78, 115, 223, 1)",
                    // this dataset is drawn below
                    order: 2
                }
            ],
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
                            return value;
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
                display: true
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
                        return datasetLabel + ': ' + tooltipItem.yLabel;
                    }
                }
            }
        }
    });
</script>
@endsection
