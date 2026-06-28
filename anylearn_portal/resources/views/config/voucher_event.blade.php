@extends('layout')
@section('rightFixedTop')
<form class="row">
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success" href="{{ route('config.voucherevent.create') }}"><i class="fas fa-plus"></i> @lang('Thêm mới')</a>
    </div>
</form>
@endsection


@section('body')
@if(sizeof($events) == 0)
<div class="text-center mt-5 pt-5">
    @lang('Chưa có Sự kiện nào.')
</div>
@else
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-bordered table-striped">
            <thead>
                <thead>
                    <th class="text-center">#ID</th>
                    <th>Tiêu đề</th>
                    <th>Loại Sự kiện</th>
                    <th>ID khởi tạo</th>
                    <th>ID bộ voucher</th>
                    <th>Số lượng</th>
                    <th>ID giới thiệu</th>
                    <th>Tỷ lệ H/H</th>
                    <th>Tạo lúc</th>
                    <th>Thao tác</th>
                </thead>
            <tbody>
                @foreach($events as $event)
                <tr>
                    <th class="text-center">{{ $event->id }}</th>
                    <td>{{ $event->title }}</td>
                    <td>{{ $event->type }}</td>
                    <td>{{ $event->trigger }}</td>
                    <td>{{ $event->targets }}</td>
                    <td>{{ $event->qtt }}</td>
                    <td>{{ $event->ref_user_id }}</td>
                    <td>{{ $event->commission_rate }}</td>
                    <td>{{ $event->updated_at }}</td>
                    <td>
                        <a class="btn btn-sm btn-info" href="{{ route('config.voucherevent.log', ['id' => $event->id]) }}">
                            DS đã phát
                        </a>
                        <a class="btn btn-sm btn-warning" href="{{ route('config.voucherevent.edit', ['id' => $event->id]) }}">
                            <i class="fa fa-edit"></i>
                        </a>
                        <a class="btn btn-sm btn-{{ $event->status == 1 ? 'danger' : 'success' }}" href="{{ route('config.voucherevent.close', ['id' => $event->id]) }}">
                        {{ $event->status == 1 ? 'Khóa' : 'Mở' }}
                        </a>
                    </td>
                </tr>
                @endforeach
            </tbody>
            </thead>
        </table>
    </div>
    <div class="card-footer">
        {{ $events->links() }}
    </div>
</div>

@endif

@endsection