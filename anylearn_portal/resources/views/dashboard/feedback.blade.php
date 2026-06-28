@extends('layout')
@section('body')
@if(sizeof($feedbacks) == 0)
<div class="text-center mt-5 pt-5">
    Chưa có phản hồi nào
</div>
@else
<div class="card shadow">
    <div class="card-body p-0  table-responsive">
        <table class="table table-bordered table-striped">
            <thead>
                <thead>
                    <th class="text-center">#ID</th>
                    <th>@lang('Thành viên')</th>
                    <th>@lang('Nội dung')</th>
                    <th>Screenshot</th>
                    <th>@lang('Thời gian')</th>
                </thead>
            <tbody>
                @foreach($feedbacks as $feedback)
                <tr>
                    <th class="text-center">{{ $feedback->id }}</th>
                    <td>{{ $feedback->user->name }}</td>
                    <td width="25%">{{ $feedback->content }}</td>
                    <td><img class="view-image" data-url="{{ $feedback->file }}" style="height: 50px;" src="{{ $feedback->file }}" alt=""></td>
                    <td>{{ $feedback->created_at }}</td>
                </tr>
                @endforeach
            </tbody>
            </thead>
        </table>
    </div>
    <div class="card-footer">
        {{ $feedbacks->links() }}
    </div>
</div>
<div id="imageModal" class="modal fade shadow" tabindex="-1" role="dialog">
    <div class="modal-dialog ">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}">@lang('Ảnh chụp màn hình')</h5>
                <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            </div>
            <div class="modal-body">
            </div>
        </div>
    </div>
</div>

@endif

@endsection
@section('jscript')
<script>
    $('.view-image').click(function() {
        var url = $(this).data("url");
        $('#imageModal').find('.modal-body').html('<img style="" src="' + url + '">');
        $('#imageModal').modal('show');
    });
</script>
@endsection