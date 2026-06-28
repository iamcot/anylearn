@extends('layout')
@section('body')
<form method="POST" action="{{ route('config.guide', ['type' => $guideType]) }}">
@csrf
<div class="card shadow">
    <div class="card-body p-0">
    <div class="document-editor__toolbar"></div>
        <textarea id="editor" name="data">{{ !empty($data) ? $data : "" }}</textarea>
    </div>
    <div class="card-footer">
        <button type="submit" id="submit" class="btn  btn-sm btn-{{ env('MAIN_COLOR', 'primary') }}"><i class="fas fa-save"></i> Lưu thay đổi</button>
    </div>
</div>
</form>
@endsection
@section('jscript')
<script src="/cdn/vendor/ckeditor/ckeditor.js"></script>
<script>
    CKEDITOR.replace( 'editor' );
</script>
@endsection
