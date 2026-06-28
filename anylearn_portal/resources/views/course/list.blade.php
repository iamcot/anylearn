@inject('userServ','App\Services\UserServices')
@inject('itemServ','App\Services\ItemServices')
@extends('layout')

@section('rightFixedTop')
<form class="row">
    <div class="col-xs-3 mr-1">
        <select class="form-control" name="t" id="">
            <option {{ app('request')->input('t') == 'title' ? 'selected' : '' }} value="title">@lang('Tên khóa học')</option>
            <option {{ app('request')->input('t') == 'series' ? 'selected' : '' }} value="series">@lang('Chuỗi khóa học')</option>
        </select>
    </div>
    <div class="col-xs-6 mr-1">
        <input value="{{ app('request')->input('s') }}" type="text" class="form-control" name="s" placeholder="{{ __('Tìm kiếm') }}" />
    </div>
    <div class="col-xs-1 mr-1">
        <button class="btn btn-primary btn"><i class="fas fa-search"></i></button>
    </div>

    <div class="col-xs-2 mr-1">
        <a class="btn btn-success" href="{{ route('course.create') }}"><i class="fas fa-plus"></i> @lang('Thêm mới')</a>
    </div>
</form>
@endsection

@section('body')
@if(sizeof($courseList) == 0)
<div class="text-center mt-5 pt-5">
    @lang('Chưa có khóa học nào. <a href=":url"><i class="fas fa-plus"></i> Thêm mới</a>', ['url' => route('course.create')])
</div>
@else
<div class="card shadow">
    <div class="card-body p-0  table-responsive">
        <table class="table table-bordered table-striped">
            <thead>
                <thead>
                    <th class="text-center">#ID</th>
                    @if($userServ->isMod()) <th width="5%" class="text-center">Hot</th>@endif
                    @if($userServ->isMod()) <th width="5%" class="text-center">@lang('Người tạo')</th>@endif
                    <th>@lang('Khóa học')</th>
                    <th>@lang('Chuỗi')</th>
                    <th>@lang('Thời gian')</th>
                    <th>@lang('Học phí')</th>
                    <!-- <th>Quan tâm</th> -->
                    <th>@lang('Đăng ký')</th>
                    <th>@lang('Lần sửa cuối')</th>
                    <th>@lang('Thao tác')</th>
                </thead>
            <tbody>
                @foreach($courseList as $course)
                <tr>
                    <th class="text-center">{{ $course->id }}</th>
                    @if($userServ->isMod()) <td class="text-center"><a href="{{ route('ajax.touch.ishot', ['table' => 'items', 'id' =>  $course->id ]) }}">{!! $userServ->hotIcon($course->is_hot) !!}</a></td>@endif
                    @if($userServ->isMod()) <td class="text-center">
                        {{ $course->user->name }}
                    </td>@endif
                    {{-- @if (auth()->user()->role != 'sale')
                    <td><a href="{{ route('course.edit', ['id' => $course->id]) }}"><i class="fas fa-edit"></i> {{ $course->title }}</a></td>
                    @else
                    <td><a href="{{ $itemServ->classUrl($class->id) }}"> {{ $course->title }}</a></td>
                    @endif --}}
                    <td><a href="{{ route('course.edit', ['id' => $course->id]) }}"><i class="fas fa-edit"></i> {{ $course->title }}</a></td>
                    <td>@if($course->series)
                        <a href="?t=series&s={{ $course->series->id }}">{{ $course->series->title }}</a>
                        @endif</td>
                    <td>{{ $course->time_start }}-{{ $course->time_end }} {{ date('d/m/y', strtotime($course->date_start))}}
                     <a href="{{ route('notif.remind_join', ['id' => $course->id]) }}"><i class="fas fa-bell"></i></a>

                    </td>
                    <td>{{ number_format($course->price) }}</td>
                    <!-- <td></td> -->
                    <td>{{ $course->sum_reg }}
                     <a href="{{ route('notif.remind_confirm', ['id' => $course->id]) }}"><i class="fas fa-bell"></i></a>
                    </td>
                    <td>{{ $course->updated_at }}</td>
                    <td>
                    {{ $itemServ->classUrl($course->id) }}
                    @if($userServ->isMod(\Auth::user()->role))
                    {!! $itemServ->statusOperation($course->id, $course->status) !!}
                    {!! $itemServ->typeOperation($course) !!}
                    @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
            </thead>
        </table>
    </div>
    <div class="card-footer">
        {{ $courseList->links() }}
    </div>
</div>

@endif

@endsection
