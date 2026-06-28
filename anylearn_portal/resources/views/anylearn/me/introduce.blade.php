@extends('anylearn.me.layout')
@section('spmb')
    introduce
@endsection
@section('body')

  <style>
    /* CSS cho banner */
    .banner {
      width: 100%;
      height: 300px;
      background-image: url('{{ $user->banner}}');
      background-size: cover;
      position: relative;
      overflow: hidden;
    }

    /* CSS cho logo */
    .logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 150px;
      height: 150px;
      border-radius: 50%;
      object-fit: cover;
      border: 5px solid #fff;
      box-shadow: 0 0 10px rgba(0,0,0,0.5);
      z-index: 1;
    }

    /* CSS cho tiêu đề */
    .title {
      color: #fff;
      font-weight: bold;
      margin-top: 20px;
      position: absolute;
      bottom: -55px;
      left: 0;
      padding: 20px;
      background-color: rgba(0, 0, 0, 0.5);
      width: 100%;
    }

    /* CSS cho phần nội dung */
    .content {
      padding: 20px;
      position: relative;
    }
  </style>
  <div class="container-fluid">
    <div class="row">
      <div class="col-md-12">
        <div class="banner">
          {{-- <img src="{{ $user->image}}" alt="Logo" class="logo"> --}}
        </div>
        <div class="content position-relative">
          <h1 class="title">{{ $user->name }}</h1>

        </div>

        <div class="card-body">
            <div class="text-justify text-1000 card-body">
                <p class="pt-5">{{ $user->introduce}}</p>
                <div class="row">
                    <div class="col-md-5">
                        <img src="{{ $user->image}}" alt="">
                    </div>
                    <div class="col-md-7">
                        <div class="row">
                            <div class="col-md-9">
                                <strong> Các địa điểm chi nhánh</strong>
                            </div>
                            <div class="col-md-3">
                                <a class="btn btn-success btn-sm float-right" href="{{ route('location.create') }}"><i class="fas fa-plus"></i> <span class="mobile-no-text">@lang('Thêm mới')</span></a>
                            </div>
                        </div>
                        <div class="card shadow">
                            <div class="card-body p-0 table-responsive">
                                    <table class="table table-hover">
                                        <thead class="table-secondary text-secondary">
                                            <tr class="">
                                                <th>ID</th>
                                                <th>@lang('HỘI SỞ')</th>
                                                <th>@lang('TÊN VĂN PHÒNG')</th>
                                                <th>@lang('ĐỊA CHỈ')</th>
                                                <th>@lang('GEO')</th>
                                                <th>@lang('THAO TÁC')</th>
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
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  </div>

@endsection
