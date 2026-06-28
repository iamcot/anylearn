@extends('layout')

@section('body')
<form method="POST" action="{{ route('config.email') }}">
    @csrf
    @foreach($emailConfigs as $key => $config)
    <div class="card shadow mt-3">
        <div class="card-header">{{ $config['title'] }}</div>
        <div class="card-body ">
            <textarea class="editor" name="config[{{ $config['key'] }}]">{{ $config['value'] }}</textarea>
            @if(!empty( $config['hint']))<p>{!! $config['hint'] !!}</p>@endif
        </div>
    </div>
    @endforeach
<div class="mt-3">
<button type="submit" id="submit" class="btn btn-sm btn-{{ env('MAIN_COLOR', 'primary') }}" name="save" value="config"><i class="fas fa-save"></i> Lưu thay đổi</button>

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