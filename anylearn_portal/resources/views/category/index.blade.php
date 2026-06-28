@extends('layout')
@section('rightFixedTop')
<form class="row">
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success" href="{{ route('category.edit') }}"><i class="fas fa-plus"></i> @lang('Thêm mới')</a>
    </div>
</form>
@endsection


@section('body')
@if(sizeof($categories) == 0)
<div class="text-center mt-5 pt-5">
    @lang('Chưa có chuyên mục nào.')
</div>
@else
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-bordered table-striped">

            <thead>
                <thead>
                    <th class="text-center">#ID</th>
                    @foreach(App\Models\I18nContent::$supports as $locale)
                    <th>@lang('Tiêu đề')[{{$locale}}]</th>
                    @endforeach
                    <th>@lang('Tạo lúc')</th>
                    <th>@lang('Thao tác')</th>
                </thead>
            <tbody>
                @foreach($categories as $category)
                <tr>
                    <th class="text-center">{{ $category->id }}</th>
                    @foreach(App\Models\I18nContent::$supports as $locale)
                    <td>{{ $category->title[$locale] }}
                        {{-- <a href="{{ route('category.edit', ['id' => $category->id]) }}"><i class="fa fa-edit"></i></a> --}}
                    </td>
                    @endforeach

                    <td>{{ $category->updated_at }}</td>
                    <td>
                        <a class="btn btn-sm btn-{{ $category->status == 1 ? 'danger' : 'success' }}" href="{{ route('service.touch.status', ['table' => 'categories', 'id' => $category->id]) }}">
                            {{ $category->status == 1 ? 'Khóa' : 'Mở' }}
                        </a>
                        <a href="{{ route('category.edit', ['id' => $category->id]) }}"><i class="fa fa-edit"></i></a>
                    </td>
                </tr>

            </tbody>
            </thead>
            @endforeach
        </table>
    </div>
    <div class="card-footer">
        {{ $categories->links() }}
    </div>
</div>

@endif

@endsection
