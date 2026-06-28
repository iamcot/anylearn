@extends('layout')
@section('body')
<form method="POST">
    @csrf
    <div class="card shadow">
        <div class="card-header">
            Liên kết các thư mục cho chủ đề <span class="text-primary">{{ $topic->title }}</span>
        </div>
        <div class="card-body">
        @if(count($categories) > 0)
        <ul class="list-unstyled">
            @foreach($categories as $cat)
            <li>
                <input type="checkbox" name="categories[{{$cat->id}}]" id="categories_{{$cat->id}}" {{ in_array($cat->id, $topicCategories) ? 'checked' : ''}}>
                <label for="categories_{{$cat->id}}">{{ $cat->title }}</label>
            </li>
            @endforeach
        </ul>
        @else
        <p>Chưa có thư mục nào, vui lòng tạo thư mục trước</p>
        @endif
        </div>
        <div class="card-footer">
            <button name="save" value="save" class="btn btn-primary }}"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </div>
    </div>
</form>
@endsection
