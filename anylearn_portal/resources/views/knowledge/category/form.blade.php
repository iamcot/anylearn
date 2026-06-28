@extends('layout')
@section('body')
<form method="POST">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($category) ? $category->id : null }}">
    <div class="card shadow">
        <div class="card-body">
            <div class="form-group row">
                <label for="title" class="col-md-2 col-form-label text-md-right">{{ __('Tên thư mục') }}</label>
                <div class="col-md-6">
                    <input id="title" type="text" class="form-control @error('title') is-invalid @enderror" name="title" value="{{ old('title', !empty($category) ? $category->title : '') }}" required>
                </div>
            </div>
            <div class="form-group row">
                <label for="type" class="col-md-2 col-form-label text-md-right">{{ __('Đối tượng') }}</label>
                <div class="col-md-6">
                    <select name="type" id="type" required class="form-control">
                        @foreach(["buyer", "seller"] as $type)
                            <option value="{{ $type }}" {{ !empty($category) && $category->type  == $type ? 'selected' : '' }}>{{ $type }}</option>
                        @endforeach
                    </select>
                </div>
            </div>

        </div>
        <div class="card-footer">
            <button name="save" value="save" class="btn btn-primary }}"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </div>
    </div>
</form>
@endsection
