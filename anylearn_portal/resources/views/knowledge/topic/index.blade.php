@extends('layout')
@section('rightFixedTop')
<form class="row">
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success" href="{{ route('knowledge.topic.edit') }}"><i class="fas fa-plus"></i> @lang('Thêm mới')</a>
    </div>
</form>
@endsection


@section('body')
@if(sizeof($categories) == 0)
<div class="text-center mt-5 pt-5">
    @lang('Chưa có nhóm chủ đề nào.')
</div>
@else
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-bordered table-striped">
            <thead>
                <thead>
                    <th class="text-center">#ID</th>
                    <th>Tiêu đề</th>
                    <th>Tạo lúc</th>
                    <th>Đối tượng</th>
                    <th>Thao tác</th>
                </thead>
            <tbody>
                @foreach($categories as $category)
                <tr>
                    <th class="text-center">{{ $category->id }}</th>
                    <td>{{ $category->title }}
                        <a href="{{ route('knowledge.topic.edit', ['id' => $category->id]) }}"><i class="fa fa-edit"></i></a>
                    </td>
                    <td>{{ $category->updated_at }}</td>
                    <td>{{ $category->type }}</td>
                    <td>
                        <a class="btn btn-sm btn-{{ $category->status == 1 ? 'danger' : 'success' }}" href="{{ route('service.touch.status', ['table' => 'knowledge_topics', 'id' => $category->id]) }}">
                            {{ $category->status == 1 ? 'Khóa' : 'Mở' }}
                        </a>
                        <a class="btn btn-sm btn-primary" href="{{ route('knowledge.topic.category', ['id' => $category->id]) }}">
                            Các thư mục
                        </a>
                    </td>
                </tr>
                @endforeach
            </tbody>
            </thead>
        </table>
    </div>
    <div class="card-footer">
        {{ $categories->links() }}
    </div>
</div>

@endif

@endsection
