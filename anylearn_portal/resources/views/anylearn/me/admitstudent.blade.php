@extends('anylearn.me.layout')
@section('spmb')
    admitstudent
@endsection
@section('body')

    <div class="container">
        <h1 class="text-center">Tiếp nhận học sinh</h1>
        <form>
            <div class="input-group mb-3 mt-3">
                <input type="text" class="form-control" name="id" placeholder="Nhập mã nhập học"
                    aria-label="Nhập mã nhập học" aria-describedby="button-addon2" />
                <button class="btn btn-primary" name="check" value="check" id="button-addon2"
                    data-mdb-ripple-color="dark">
                    Xác nhận
                </button>
            </div>
        </form>
        @if ($data == null)
        <p class="p-3">Mã tiếp nhận không đúng.</p>
        @else
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-3">
                                    <img src="{{ isset($data->iimage) ? $data->iimage : null }}" class="card-img-top"
                                        alt="..." />
                                </div>
                                <div class="col-md-9">
                                    <h5 class="card-title">{{ $data->title }}</h5>
                                    <p>@lang('Khai giảng:') {{ date('d/m/Y', strtotime($data->date_start)) }}
                                    </p>
                                    <p>@lang('Học phí:') <strong>{{ number_format($data->price, 0, ',', '.') }}</strong></p>

                                    <p class="card-text">
                                        {{ $data->short_content }}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        @endif

    </div>
    @if ($data == null)
    @else
        <!-- Profile Header -->
        <div class="container mt-3">
            <div class="card">
                <div class="card-body">
                    <div class="row">
                        @if ($data->uimage != null)
                            <div class="col-md-2">
                                <img src="{{ $data->uimage }}" alt="Profile Picture" class="img-fluid">
                            </div>
                        @endif
                        <div class="col-md-10">
                            <h2 class="fw-bold mb-0">Thông tin học viên: {{ $data->name }}</h2>
                            <div class="row mt-2">
                                <div class="col-md-12">
                                    <p>Họ và tên: {{ $data->name }}</p>
                                    <p>Ngày sinh: {{ $data->dob }}</p>
                                    <p>Số điện thoại: {{ $data->phone }}</p>
                                    <p>Email: {{ $data->email }}</p>
                                    <p>Địa chỉ: {{ $data->address }}</p>
                                    <p class="card-text">{!! $data->introduce !!}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer text-center">
                    @if ($data->confirm_count == 0)
                        <a href="{{ route('class.author.confirmjoin', ['itemId' => $data->itemId]) }}?join_user={{ $data->userId }}&join=1"
                            class="btn btn-success text-white">Tiếp nhận
                            học viên</a>
                    @else
                        <a class="btn btn-success text-white" disabled>Đã
                            tiếp
                            nhận</a>
                    @endif
                </div>
            </div>
        </div>
    @endif

@endsection
