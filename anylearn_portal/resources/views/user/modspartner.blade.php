@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('rightFixedTop')
    <a class="btn btn-sm btn-success" href="{{ route('user.mods.create') }}"><i class="fas fa-plus"></i> @lang('Thêm mới')</a>
@endsection

@section('body')
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-striped table-hover table-bordered">
            <thead class="">
                <tr>
                    <th width="5%" scope="col">#ID</th>
                    <th width="10%" scope="col">Vai trò</th>
                    <th width="20%" scope="col">Họ tên</th>
                    <th width="20%" scope="col">SDT</th>
                    <th width="20%" scope="col">Email</th>
                    <th width="15%" class="text-right" scope="col">Thao tác</th>
                </tr>
            </thead>
            <tbody>
                @foreach($mods as $mod)
                <tr>
                    <th scope="row">{{ $mod->id }}</th>
                    <td>{{ $mod->role }}</td>
                    <td>{!! $userServ->statusIcon($mod->status) !!} {{ $mod->name }}</td>
                    <td>{{ $mod->phone }}</td>
                    <td>{{ $mod->email }}</td>
                    <td class="text-right">
                        @if($mod->id != 1)
                        {!! $userServ->statusOperation($mod->id, $mod->status) !!}
                        <a class="btn btn-sm btn-info" href="{{ route('user.mods.edit', ['userId' => $mod->id]) }}"><i class="fas fa-edit"></i> Sửa</a>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
        <div class="small ml-3">
            <p><i class="fas fa-check-circle text-success"></i> Thành viên đang hoạt động. <i class="fas fa-stop-circle text-danger"></i> Thành viên đang bị khóa.</p>
        </div>
    </div>
    <div class="card-footer">
        <div>{{ $mods->links() }}</div>
    </div>
</div>
@endsection
