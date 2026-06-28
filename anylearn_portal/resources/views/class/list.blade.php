@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')
@extends('layout')
@section('rightFixedTop')
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success btn-sm border-0 rounded-pill" href="{{ route('class.create') }}"><i class="fas fa-plus">
            </i> <span class="mobile-no-text"> @lang('Thêm mới')</span></a>
    </div>
@endsection

@section('body')
    <form>
        <div class="card shadow mb-2">
            <div class="card-body row">
                <div class="col-xs-6 col-lg-4 ">
                    <div class="form-group row">
                        <label class="col-12" for="">ID(s) <span class="small">@lang('Để trống đến ID nếu chỉ tìm 1')</span></label>
                        <div class="col-lg-6 mb-1">
                            <input value="{{ app('request')->input('id_f') }}" type="text" class="form-control"
                                name="id_f" placeholder="từ ID " />
                        </div>
                        <div class="col-lg-6">
                            <input value="{{ app('request')->input('id_t') }}" type="text" class="form-control"
                                name="id_t" placeholder="đến ID" />
                        </div>
                    </div>

                </div>
                <div class="col-xs-6 col-lg-4">
                    <div class="form-group">
                        <label for="">@lang('Tên khóa học')</label>
                        <input value="{{ app('request')->input('name') }}" type="text" class="form-control"
                            name="name" placeholder="Tên khóa học" />
                    </div>
                </div>

                <div class="col-xs-6 col-lg-4">
                    <div class="form-group">
                        <label for="">@lang('ID Tác giả')</label>
                        <input value="{{ app('request')->input('ref_id') }}" type="text" class="form-control"
                            name="ref_id" placeholder="ID tác giả" />
                    </div>
                </div>
                <div class="col-xs-6 col-lg-4">
                    <div class="form-group">
                        <label for="">@lang('Thời gian tạo từ')</label>
                        <input value="{{ app('request')->input('date') }}" type="date" class="form-control"
                            name="date" placeholder="Thời gian tạo" />
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary btn-sm" name="action" value="search"><i class="fas fa-search"></i>
                    @lang('Tìm kiếm')</button>
                <!-- <button class="btn btn-success btn-sm" name="action" value="file"><i class="fas fa-file"></i> Xuất file</button> -->
                <button class="btn btn-warning btn-sm" name="action" value="clear"> @lang('Xóa tìm kiếm')</button>
            </div>
        </div>
    </form>
    <div class="card shadow">
        <div class="card-header">
            Tổng tìm kiếm: <strong class="text-danger">{{ $courseList->total() }}</strong>
        </div>
        <div class="card-body p-0 table-responsive">
            <table class="table table-bordered table-striped">
                <thead>
                    <thead>
                        <th class="text-center">#</th>
                        @if ($userServ->isMod())
                            <th width="5%" class="text-center">Hot</th>
                        @endif
                        @if ($userServ->isMod())
                            <th width="5%" class="text-center">Trường</th>
                        @endif
                        <th>@lang('Khóa học')</th>
                        <th>@lang('Thời gian')</th>
                        <th>@lang('Học phí')</th>
                        <!-- <th>Quan tâm</th> -->
                        <th>@lang('Đăng ký')</th>
                        @if (!$isSale)
                            <th>@lang('Lần sửa cuối')</th>
                            <th>@lang('Status đối tác')</th>
                            <th>@lang('Status AL')</th>
                            <th>@lang('Thao tác')</th>
                        @endif
                        <th>@lang('Số lượng cần bán')</th>
                        <th>@lang('Thời gian bán')</th>
                    </thead>
                <tbody>
                    @foreach ($courseList as $course)
                        <tr>
                            <th class="text-center">{{ $course->id }}
                                @if ($userServ->isMod() && $course->sum_reg == 0 && !$isSale)
                                    <a href="{{ route('class.del', ['id' => $course->id]) }}"><i
                                            class="fa fa-trash text-danger"></i></a>
                                @endif
                            </th>
                            @if ($userServ->isMod())
                                <td class="text-center">
                                    @if (!$isSale)
                                        <a
                                            href="{{ route('ajax.touch.ishot', ['table' => 'items', 'id' => $course->id]) }}">
                                            {!! $userServ->hotIcon($course->is_hot) !!}</a>
                                    @else
                                        {!! $userServ->hotIcon($course->is_hot) !!}
                                    @endif
                                </td>
                            @endif
                            @if ($userServ->isMod())
                                <td class="text-center" width="15%">
                                    {{ $course->user->name }}
                                </td>
                            @endif
                            @if (!$isSale)
                                <td width="20%">
                                    <a href="{{ route('class.edit', ['id' => $course->id]) }}"><i
                                            class="fas fa-edit"></i>[{{ $course->subtype }}] {{ $course->title }}</a>
                                </td>
                            @else
                                <td width="20%">
                                    <a href="{{ $itemServ->classUrl($course->id) }}">[{{ $course->subtype }}]
                                        {{ $course->title }}</a>
                                </td>
                            @endif

                            <td>{{ date('d/m/y', strtotime($course->date_start)) }} @if ($course->date_end)
                                    - {{ date('d/m/y', strtotime($course->date_end)) }}
                                @endif
                                <a href="{{ route('notif.remind_join', ['id' => $course->id]) }}"><i
                                        class="fas fa-bell"></i></a>
                            </td>
                            <td>{{ number_format($course->price) }}</td>
                            <!-- <td></td> -->
                            <td>{{ $course->sum_reg }} <a
                                    href="{{ route('notif.remind_confirm', ['id' => $course->id]) }}"><i
                                        class="fas fa-bell"></i></a></td>
                            @if (!$isSale)
                                <td width="15%">{{ $course->updated_at }}</td>
                                <td class="text-center ">
                                    {!! $itemServ->statusText($course->user_status) !!}
                                    @if ($userServ->isMod(\Auth::user()->role) && !$isSale)
                                        {!! $itemServ->userStatusOperation($course->id, $course->user_status) !!}
                                    @endif
                                </td>
                                <td class="text-center ">
                                    {!! $itemServ->statusText($course->status) !!}
                                    @if ($userServ->isMod(\Auth::user()->role) && !$isSale)
                                        {!! $itemServ->statusOperation($course->id, $course->status) !!}
                                    @endif
                                </td>
                                <td>
                                    <a
                                        href="javascript:navigator.clipboard.writeText('{{ $itemServ->classUrl($course->id) }}').then(function() { alert('Copy')})"><i
                                            class="fa fa-link"></i></a>
                                    <a class="ratingFormClick" href="#" data-class-id="{{ $course->id }}"><i
                                            class="fa fa-star"></i>({{ $course->sum_rating }})</a>
                                </td>
                            @endif
                            <td>{{ $course->seats }}</td>
                            @if ($course->nolimit_time == 1)
                                <td>@lang('Không giới hạn')</td>
                            @else
                                <td>{{ $course->date_start }}</td>
                            @endif


                        </tr>
                    @endforeach
                </tbody>
                </thead>
            </table>
        </div>
        <div class="card-footer">
            {{ $courseList->appends(request()->query())->links() }}
        </div>
    </div>
@endsection
@include('dialog.rating')
@section('jscript')
    @parent
    <script>
        $('.ratingFormClick').click(function() {
            var classId = $(this).data("class-id");
            $("#rating_class_id").val(classId);
            $('#ratingFormModal').modal('show');
        });
    </script>
@endsection
