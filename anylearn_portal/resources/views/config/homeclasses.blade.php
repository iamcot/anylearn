@extends('layout')

@section('body')
<form method="POST" enctype="multipart/form-data">
    @csrf
    <div class="card shadow">
        <!-- <div class="card-header">
        </div> -->
        <div class="card-body">
            <ul class="list-unstyled" id="configs">
                @if(count($configs) == 0)
                    @include('config.home_class_block', ['index' => 0, 'config' =>  null])
                @else
                    @foreach($configs as $index => $config)
                        @include('config.home_class_block', ['index' => $index, 'config' => $config])
                    @endforeach
                @endif
            </ul>

        </div>
        <div class="card-footer">
            <button name="save" value="save" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
            <!-- <a href="#" id="add_block" class="btn btn-success">Thêm block</a> -->
        </div>
    </div>
</form>
@endsection