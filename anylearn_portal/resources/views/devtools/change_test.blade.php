@extends('layout')

@section('body')
<form method="POST" action="{{ route('devtools.change-test') }}">
@csrf
<div class="card shadow">
    <div class="card-body">
        <input type="text" class="form-control" name="branch" value="{{ old('branch') }}" placeholder="Branch to switch">
       
    </div>
    <div class="card-footer">
        <button type="submit" id="submit" class="btn btn-sm btn-{{ env('MAIN_COLOR', 'primary') }}" name="action" value="change-test"><i class="fas fa-save"></i> Lưu thay đổi</button>
    </div>
</div>
</form>
@endsection