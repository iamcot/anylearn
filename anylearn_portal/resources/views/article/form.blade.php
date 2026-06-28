@extends('layout')

@section('body')
<form method="POST" enctype="multipart/form-data">
    @csrf
    <input type="hidden" name="id" value="{{ !empty($article) ? $article->id : null }}">
    <div class="card shadow">
        <div class="card-body">
            <div class="">
                <div class="form-group row">
                    <label for="title{{App\Models\I18nContent::DEFAULT}}" class="col-md-2 col-form-label text-md-right">{{ __('Tiêu đề') }}</label>
                    <div class="col-md-8">
                        <input id="title{{App\Models\I18nContent::DEFAULT}}" type="text" class="form-control @error('title') is-invalid @enderror" name="title[{{App\Models\I18nContent::DEFAULT}}]" value="{{ old('title', !empty($article) ? $article->title[App\Models\I18nContent::DEFAULT] : '') }}" required>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="type" class="col-md-2 col-form-label text-md-right">{{ __('Chuyên mục') }}</label>
                    <div class="col-md-8">
                        <select class="form-control" name="type" id="type">
                            @foreach (['read', 'video', 'event', 'promotion'] as $type)
                            <option value="{{ $type }}" {{ !empty($article) && $article->type == $type ? 'selected' : '' }}>
                                {{ $type }}
                            </option>
                            @endforeach
                        </select>
                    </div>
                </div>
                <div class="form-group row">
                    <label for="video" class="col-md-2 col-form-label text-md-right">{{ __('Link youtube / Số giảm promotion') }}</label>
                    <div class="col-md-8">
                        <input id="video" type="text" class="form-control @error('video') is-invalid @enderror" name="video" value="{{ old('video', !empty($article) ? $article->video : '') }}">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="tags" class="col-md-2 col-form-label text-md-right">{{ __('Tags') }}</label>
                    <div class="col-md-8">
                        <input id="tags" type="text" class="form-control @error('tags') is-invalid @enderror" name="tags" value="{{ old('tags', !empty($article) ? $article->tags : '') }}">
                    </div>
                </div>
                <div class="form-group row">
                    <label for="image" class="col-md-2 col-form-label text-md-right">{{ __('Hình ảnh') }}</label>
                    <div class="col-md-4">
                        <input name="image" type="file" id="image" />
                    </div>
                    <div class="col-md-4">
                        @if ($article && $article->image)
                        <img src="{{ $article->image }}" alt="" style="height: 50px;">
                        @endif
                    </div>
                </div>
                <ul class="nav nav-tabs" id="i18ntab" role="tablist">
                    @foreach (App\Models\I18nContent::$supports as $locale)
                    <li class="nav-item" role="presentation">
                        <button class="nav-link {{ $locale == App\Models\I18nContent::DEFAULT ? 'active' : '' }}" id="{{ $locale }}-tab" data-toggle="tab" data-bs-toggle="tab" data-target="#{{ $locale }}box" data-bs-target="#{{ $locale }}box" type="button" role="tab" aria-controls="{{ $locale }}" aria-selected="{{ $locale == App\Models\I18nContent::DEFAULT ? 'true' : 'false' }}">{{ $locale }}</button>
                    </li>
                    @endforeach
                </ul>
                <div class="tab-content" id="i18ntabContent">
                    @foreach (App\Models\I18nContent::$supports as $locale)
                    <div class="p-3 tab-pane fade {{ $locale == App\Models\I18nContent::DEFAULT ? 'show active' : '' }}" id="{{ $locale }}box" role="tabpanel" aria-labelledby="{{ $locale }}-tab">
                        @if ($locale != App\Models\I18nContent::DEFAULT)
                        <div class="form-group row">
                            <label for="title{{ $locale }}" class="col-md-2 col-form-label text-md-right font-weight-bold @error('title') is-invalid @enderror">{{ __('Tiêu đề') }}[{{ $locale }}]</label>
                            <div class="col-md-8">
                                <input id="title{{ $locale }}" type="text" class="form-control @error('title') is-invalid @enderror" name="title[{{ $locale }}]" value="{{ old('title', !empty($article) ? $article->title[$locale] : '') }}">
                            </div>
                        </div>
                        @endif
                        <div class="form-group row">
                            <label for="short_content{{ $locale }}" class="col-md-2 col-form-label text-md-right font-weight-bold @error('content') is-invalid @enderror">{{ __('Giới thiệu ngắn') }}[{{ $locale }}]</label>
                            <div class="col-md-8">
                                <textarea class="form-control" id="short_content{{ $locale }}" name="short_content[{{ $locale }}]">{!! old('short_content', !empty($article) ? $article->short_content[$locale] : '') !!}</textarea>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="editor{{ $locale }}" class="col-md-2 col-form-label text-md-right font-weight-bold @error('content') is-invalid @enderror">{{ __('Nội dung bài viết') }}[{{ $locale }}]</label>
                            <div class="col-md-8">
                                <textarea class="editor" id="editor{{ $locale }}" name="content[{{ $locale }}]">{!! old('content', !empty($article) ? $article->content[$locale] : '') !!}</textarea>
                            </div>
                        </div>
                    </div>
                    @endforeach
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button name="save" value="save" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </div>
    </div>
</form>
@endsection
@section('jscript')
@parent
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