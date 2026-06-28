@inject('itemServ','App\Services\ItemServices')
@extends('page_layout')
@section('body')
<h1>@lang('Vui lòng hoàn tất các bước sau để đăng ký khóa học')</h1>
<div class="card mb-2 border-left-primary shadow">
    <div class="card-header">
        <h5 class="modal-title m-0 font-weight-bold text-primary"><i class="fa fa-shopping-cart"></i> @lang('Khóa học bạn đang đăng ký')</h5>
    </div>
    <div class="card-body p-0">
        <h3 class="fw-bold text-success">{{ $class->title }}</h3>
        <p>{{ $author->role == 'teacher' ? __('Giảng viên') : __('Trung tâm') }}: {{ $author->name }}</p>
        <p>@lang('Khai giảng:') {{ date('d/m/Y', strtotime($class->date_start)) }}
            {{ $num_schedule <= 1 ? '' : '(có ' . $num_schedule . ' buổi học)' }}
        </p>
        <p>@lang('Học phí:') <strong>{{ number_format($item->price, 0, ',', '.') }}</strong></p>
        <p>@lang('Bạn sẽ nhận') <strong>{{ number_format($commission, 0, ',', '.') }}</strong>
    </div>
</div>

@section('jscript')
@parent
@endsection
