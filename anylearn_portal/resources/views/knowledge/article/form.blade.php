@extends('layout')
@section('body')
<form method="POST">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($article) ? $article->id : null }}">
    <div class="card shadow">
        <div class="card-body">
            <div class="form-group row">
                <label for="title" class="col-md-2 col-form-label text-md-right">{{ __('Tiêu đề') }}</label>
                <div class="col-md-6">
                    <input id="title" type="text" class="form-control @error('title') is-invalid @enderror" name="title" value="{{ old('title', !empty($article) ? $article->title : '') }}"  required>
                </div>
            </div>
            <div class="form-group row">
                <label for="category_id" class="col-md-2 col-form-label text-md-right">{{ __('Thư mục') }}</label>
                <div class="col-md-6">
                    <select name="knowledge_category_id" id="category_id" required class="form-control">
                        @foreach($categories as $cat)
                        <option value="{{ $cat->id }}" {{ isset($article) && $cat->id == $article->knowledge_category_id ? 'selected' : ''}}>{{ $cat->title }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="form-group row">
                <label for="type" class="col-md-2 col-form-label text-md-right">{{ __('Đối tượng') }}</label>
                <div class="col-md-6">
                    <select name="type" id="type" required class="form-control">
                        @foreach(["buyer", "seller"] as $type)
                            <option value="{{ $type }}" {{ !empty($article) && $article->type  == $type ? 'selected' : '' }}>{{ $type }}</option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="form-group row">
                    <label for="editor" class="col-md-2 col-form-label text-md-right @error('content') is-invalid @enderror">{{ __('Nội dung') }}</label>
                    <div class="col-md-8">
                        <textarea class="editor" id="editor" name="content">{!! old('content', !empty($article) ? $article->content : '') !!}</textarea>
                    </div>
            </div>
            <div class="form-group row">
                    <label for="editor_bot" class="col-md-2 col-form-label text-md-right @error('content_bot') is-invalid @enderror">{{ __('Nội dung riêng cho bot') }}
                        <p class="small">Bỏ trống nếu giống nội dung chính</p></label>
                    <div class="col-md-8">
                        <textarea class="editor" id="editor_bot" name="content_bot">{!! old('content_bot', !empty($article) ? $article->content_bot : '') !!}</textarea>
                    </div>
            </div>
        </div>
        <div class="card-footer">
            <button name="save" value="save" class="btn btn-primary }}"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </div>
    </div>
</form>
@endsection
@section('jscript')
<script src="/cdn/vendor/ckeditor5/ckeditor.js"></script>
<script>
    var allEditors = document.querySelectorAll('.editor');
    var editorConfig = {
        mediaEmbed: {
                previewsInData: true
            },
        simpleUpload: {
            uploadUrl: "{{ @route('upload.ckimage5') }}",
            withCredentials: true,
            headers: {
                'X-CSRF-TOKEN': "{{ csrf_token() }}",
            }
        }
    };
    for (var i = 0; i < allEditors.length; ++i) {
        ClassicEditor.create(allEditors[i], editorConfig)
            .catch(error => {
                console.log(error);
            });
    }
</script>
@endsection
