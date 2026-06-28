@inject('userServ', 'App\Services\UserServices')
@inject('dashServ', 'App\Services\DashboardServices')
@extends('anylearn.me.layout')
@php
$dashServ->init(@request('dateF') ?? date('Y-m-d', strtotime('-30 days')), @request('dateT') ?? date('Y-m-d'));
@endphp
@section('spmb')
dashboard
@endsection
@section('rightFixedTop')
<form class="row mr-1 mt-4">
    <div class="col-xs-2 ">
        <a href="{{ route('me.withdraw') }}" type="button" class="btn btn-outline-success" data-mdb-ripple-color="dark">@lang('Rút Tiền')</a>
    </div>
</form>
<form id="filter-form" class="mr-1 mt-4">
    <div class="form-group row mt-3">
        <div class="col-sm-5">
            <input type="date" class="form-control" id="from-date" name="dateF" value="{{ @request('dateF') ?? date('Y-m-d', strtotime('-30 days')) }}">
        </div>
        <div class="col-sm-5">
            <input type="date" class="form-control" id="to-date" name="dateT" value="{{ @request('dateT') ?? date('Y-m-d') }}">
        </div>
        <div class="col-sm-2">
            <button name="filter" value="filter" class="btn btn-success" id="filter-button">Xem</button>
        </div>
    </div>
</form>
@endsection
@section('body')
<div class="row">
    @include('dashboard.count_box_partner', [
    'title' => 'TỔNG DOANH THU',
    'data' => number_format($dashServ->gmvpartner(), 0, ',', '.'),
    'icon' => 'fa-dollar-sign',
    'color' => 'primary',
    ])
    @include('dashboard.count_box_partner', [
    'title' => 'DOANH THU TRONG KỲ',
    'data' => number_format($dashServ->gmvpartner(false), 0, ',', '.'),
    'icon' => 'fa-dollar-sign',
    'color' => 'primary',
    ])
    @include('dashboard.count_box_partner', [
    'title' => 'TỔNG HỌC VIÊN',
    'data' => number_format($dashServ->userCountpanert(), 0, ',', '.'),
    'icon' => 'fa-users',
    'color' => 'success',
    ])
    @include('dashboard.count_box_partner', [
    'title' => 'HỌC VIÊN TRONG KỲ',
    'data' => number_format($dashServ->userCountpanert(false), 0, ',', '.'),
    'icon' => 'fa-users',
    'color' => 'success',
    ])
</div>
<div class="row">
    <div class="col-md-7">
        <div class="card border-bottom-primary shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">@lang('Biểu đồ doanh thu')</h6>

            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <canvas id="myAreaChart"></canvas>
            </div>
        </div>
    </div>
    <div class="col-md-5">
        <div class="card border-bottom-success shadow">
            <div class="card-header">
                <h6 class="m-0 font-weight-bold text-primary">@lang('Khóa học bán chạy')</h6>
            </div>
            <div class="card-body p-0" style="min-height: 300px;">
                <table class="table">
                    <tbody>
                        @foreach ($dashServ->topItempartner() as $row)
                        <tr>
                            <td class="pl-3 text-secondary">{{ $row->title }}</td>
                            {{-- <td>{{ $row->reg_num }}</td> --}}
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
@parent
<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js" type="text/javascript"></script>

<script src="/cdn/vendor/chart.js/Chart.min.js"></script>
<script>
    var chartData = JSON.parse("{{ json_encode($chartDataset) }}".replace(/&quot;/g, '"'));
    var ctx = document.getElementById("myAreaChart");
    var myLineChart = drawChart(ctx, chartData, "Doanh thu gộp", {
        style: 'currency',
        currency: 'VND'
    });

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
                                return datasetLabel + ': ' + Intl.NumberFormat('vi-VN', mFormat).format(tooltipItem.yLabel);
                            }
                        }
                    }
                }
            });

        }
</script>
@endsection