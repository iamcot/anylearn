@inject('userServ','App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
notification
@endsection
@section('body')
@if(empty($notifications))
<p>@lang('Bạn chưa có thông báo nào!')</p>
@else
<div class="card shadow">
<table class="table table-borderless table-striped">
    <tbody>
        @foreach($notifications as $notif)
            <tr>
                <td>{{ $userServ->timeAgo($notif->created_at) }}</td>
                <td>
                    <p class="fw-bold text-success">{{ $notif->title }}</p>
                    <p>{{ $notif->content }}</p>
                </td>
            </tr>
        @endforeach
    </tbody>
</table>
<div class="p-3">
{{ $notifications->links() }}
</div>
</div>
@endif
@endsection