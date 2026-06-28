@extends('layout')

@section('body')
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table mb-0 table-hover">
            @foreach($tags as $tag)
                <tr>
                    <th>{{ $tag->tag }}</th>
                    <td><span class="badge {{  $tag->status == 1 ? ' badge-success' : 'badge-danger'}} ">{{ $tag->status == 1 ? "đang mở" : "đang khoá" }}</span></td>
                    <td width="20%"><a class="btn btn-primary btn-sm rounded-pill" href="{{ route('config.tag.statustouch', ['tag' => $tag->tag]) }}">{{ $tag->status == 1 ? "KHOÁ" : "MỞ" }}</a></td>
                </tr>
            @endforeach
        </table>
    </div>
</div>
@endsection