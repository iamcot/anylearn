@extends('layout')

@section('body')
<form method="POST" action="{{ route('config.activitybonus') }}">
@csrf
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table mb-0 table-hover">
            @foreach($configs as $key => $config)
                <tr>
                    <th width="25%" style="vertical-align: middle" class="border-left-{{ $loop->index % 2 == 0 ? 'primary' : 'warning' }} text-right" >{{ $config['title'] }}</th>
                    <td><input class="form-control text-center" type="{{ $config['type'] }}" name="config[{{ $key }}]" value="{{ $config['value'] }}"></td>
                    <td width="45%" style="vertical-align: middle" class="text-left small">{{ $config['hint'] }}</td>
                </tr>
            @endforeach
        </table>
    </div>
    <div class="card-footer">
        <button type="submit" id="submit" class="btn btn-sm btn-{{ env('MAIN_COLOR', 'primary') }}" name="save" value="config"><i class="fas fa-save"></i> Lưu thay đổi</button>
    </div>
</div>
</form>
@endsection
