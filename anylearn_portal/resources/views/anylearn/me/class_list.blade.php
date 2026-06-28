@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')
@extends('anylearn.me.layout')
@section('spmb')
class_list
@endsection
@section('rightFixedTop')
<div class="col-xs-2 mr-1">
    <a class="btn btn-success btn-sm border-0 rounded-pill" href="{{ route('me.class.create') }}"><i class="fas fa-plus">
        </i> <span class="mobile-no-text"> @lang('Thêm mới')</span></a>
</div>
@endsection

@section('body')
@if (sizeof($courseList) == 0 && !request()->get('s'))
<div class=" mt-5 pt-5">
    @lang('Chưa có lớp học nào. <a href=":url"><i class="fas fa-plus"></i> Thêm mới</a>', ['url' => route('me.class.create')])
</div>
@else
<form class="pb-3 d-flex">
    <div class="position-relative">
        <div>
            <input value="{{ app('request')->input('s') }}" type="text" class="rounded-pill form-control" name="s" placeholder="{{ __('Tìm kiếm lớp học') }}" />
        </div>
        <div class="ms-1 position-absolute top-0 end-0">
            <button class="btn btn-success btn border-0 rounded-circle form-control"><i class="fas fa-search"></i></button>
        </div>
    </div>
</form>
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-hover table-striped">
            <thead class="table-secondary text-secondary">
                <tr>
                    <th>ID</th>
                    <th>@lang('KHOÁ HỌC')</th>
                    <th>@lang('THỜI GIAN')</th>
                    <th>@lang('HỌC PHÍ')</th>
                    <!-- <th>Quan tâm</th> -->
                    <th>@lang('HỌC VIÊN')</th>
                    <th>@lang('LẦN SỬA CUỐI')</th>
                    <th>@lang('STATUS ANYLEARN')</th>
                    <th>@lang('STATUS ĐỐI TÁC')</th>
                    <th>@lang('THAO TÁC')</th>
                </tr>
            </thead>
            <tbody>
                @foreach ($courseList as $course)
                <tr class="text-secondary">
                    <td>{{ $course->id }}</td>
                    <td class="col-3">[{{ $course->subtype }}] {{ $course->title }}</td>
                    <td>{{ date('d/m/y', strtotime($course->date_start)) }}
                        @if ($course->date_end)
                        - {{ date('d/m/y', strtotime($course->date_end)) }}
                        @endif
                        <a href="{{ route('notif.remind_join', ['id' => $course->id]) }}"><i class="fas fa-bell  text-success"></i></a>
                    </td>
                    <td>{{ number_format($course->price) }}</td>
                    <!-- <td></td> -->
                    <td>{{ $course->sum_reg }} <a href="{{ route('notif.remind_confirm', ['id' => $course->id]) }}"><i class="fas fa-bell text-success" title="Nhắc lịch học"></i></a>
                        <a href="{{ route('me.class.edit', ['id' => $course->id]) }}?tab=registers"><i class="fas fa-users text-primary" title="Xem học viên"></i></a>
                    </td>
                    <td>{{ date('H:i d/m/y', strtotime($course->updated_at)) }}</td>
                    <td>
                        {!! $itemServ->statusText($course->status) !!}
                    </td>
                    <td>
                        {!! $itemServ->statusText($course->user_status) !!}
                        {!! $itemServ->userStatusOperation($course->id, $course->user_status) !!}
                    </td>
                    <td>

                        <a href="javascript:navigator.clipboard.writeText('{{ $itemServ->classUrl($course->id) }}').then(function() { alert('Copy')})"><i class="fa fa-link text-success"></i></a>
                        <a class="btn btn-success btn-sm border-0" href="{{ route('me.class.edit', ['id' => $course->id]) }}"><i class="fas fa-pen"></i></a>

                        <!-- {!! $itemServ->typeOperation($course) !!} -->

                    </td>
                </tr>
                @endforeach
            </tbody>
            </thead>
        </table>
        <div class="text-success me-2 ml-2">{{ $courseList->links() }}</div>
    </div>

</div>
@endif

@endsection