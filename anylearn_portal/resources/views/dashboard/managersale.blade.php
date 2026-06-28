@inject('dashServ', 'App\Services\DashboardServices')
@extends('layout')
@section('body')
    <div class="container-fluid">
        <div class="card">
            <form>
                @csrf
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <h2><strong class="my-4 text-primary fw-bold">Quản lý SALE</strong></h2>
                        </div>
                        <div class="col-md-8">
                            <button class="btn btn-sm btn-outline-secondary mr-2 form-group" name="filter" value="time">
                                Theo
                                thời gian
                                <button class="btn btn-sm btn-outline-secondary mr-2 form-group" name="filter"
                                    value="seller"> Theo
                                    người
                                    bán
                                    <button class="btn btn-sm btn-outline-secondary mr-2 form-group" name="filter"
                                        value="product">
                                        Theo khóa học
                                        <button class="btn btn-sm btn-outline-secondary mr-2 form-group" name="filter"
                                            value="buyer">
                                            Theo khách hàng
                                            <button class="btn btn-sm btn-outline-secondary mr-2 form-group" name="filter"
                                                value="price"> Theo giá tiền


                        </div>
                    </div>
                    <!-- Filter -->
                    <div class="my-3">
                        <div class="row">
                            <div class="col-md-2">
                                <input type="date" class="form-control mx-1 form-group" name="start_date"
                                    id="start_date">
                            </div>
                            <div class="col-md-2">
                                <input type="date" class="form-control mx-1 form-group" name="end_date" id="end_date">
                            </div>
                            <button name="time" value="ip"
                                class="btn btn-outline-primary mx-1 form-group">Lọc</button>
                            <button name="time" value="week"
                                class="btn btn-outline-primary mx-1 form-group">Tuần</button>
                            <button name="time" value="month"
                                class="btn btn-outline-primary mx-1 form-group">Tháng</button>
                            <button name="time" value="quarter"
                                class="btn btn-outline-primary mx-1 form-group">Quý</button>
                            <a href="{{ route('dashboard') }}" class="btn btn-warning mx-1 form-group">Xóa Bộ Lọc</a>
                        </div>
                    </div>
                    <!-- Nội dung -->
                    <div class="row">
                        <div class="col-xl-3 col-md-6 mb-4">
                            <div class="card border-left-primary shadow h-100 py-2">
                                <div class="card-body">
                                    <div class="row no-gutters align-items-center">
                                        <div class="col mr-2">
                                            <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Tiền bán
                                                hàng
                                            </div>
                                            <div class="h5 mb-0 font-weight-bold text-gray-800">
                                                <strong id="total_sales">
                                                    @if (isset($totalUnitPrice))
                                                    {{ number_format($totalUnitPrice)}}
                                                    @endif
                                                </strong>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <i class="fas fa-dollar-sign fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-md-6 mb-4">
                            <div class="card border-left-primary shadow h-100 py-2">
                                <div class="card-body">
                                    <div class="row no-gutters align-items-center">
                                        <div class="col mr-2">
                                            <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">Số khách
                                                hàng
                                            </div>
                                            <div class="h5 mb-0 font-weight-bold text-gray-800">
                                                <strong id="total_customer">
                                                    @if ($data2 != null)
                                                        {{ number_format($data2->buyer_names) }}
                                                    @endif
                                                </strong>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <i class="fas fa-users fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-md-6 mb-4">
                            <div class="card border-left-success shadow h-100 py-2">
                                <div class="card-body">
                                    <div class="row no-gutters align-items-center">
                                        <div class="col mr-2">
                                            <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Số Đơn
                                                hàng
                                            </div>
                                            <div class="h5 mb-0 font-weight-bold text-gray-800">
                                                <strong id="total_order">
                                                    @if ($data3 != null)
                                                        {{ number_format($data3) }}
                                                    @endif
                                                </strong>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <i class="fas fa-shopping-cart fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-xl-3 col-md-6 mb-4">
                            <div class="card border-left-success shadow h-100 py-2">
                                <div class="card-body">
                                    <div class="row no-gutters align-items-center">
                                        <div class="col mr-2">
                                            <div class="text-xs font-weight-bold text-success text-uppercase mb-1">Tổng số
                                                đơn
                                            </div>
                                            <div class="h5 mb-0 font-weight-bold text-gray-800">
                                                <strong id="total">
                                                    @if ($data4 != null)
                                                        {{ number_format($data4) }}
                                                    @endif
                                                </strong>
                                            </div>
                                        </div>
                                        <div class="col-auto">
                                            <i class="fas fa-shopping-cart fa-2x text-gray-300"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {{-- <div class="table-wrapper-scroll-y my-custom-scrollbar"> --}}
                    <!-- Bảng hiển thị thông tin -->
                    <table class="table table-bordered table-striped my-3" id="my-table">
                        <thead>
                            <tr>
                                <th scope="col">Người bán</th>
                                <th scope="col">Tên khóa học</th>
                                <th scope="col">Số tiền</th>
                                <th scope="col">Tên khách hàng</th>
                                <th scope="col">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($data as $row)
                                <tr>
                                    <td>{{ $row->seller_name }}</td>
                                    <td>{{ $row->title }}</td>
                                    <td>{{ $row->unit_price }}</td>
                                    <td>{{ $row->buyer_name }}</td>
                                    <td>{{ $row->created_at }}</td>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </form>
            <div class="card-footer">
                {{ $data->links() }}
            </div>
            {{-- </div> --}}
        </div>
    </div>
@endsection
