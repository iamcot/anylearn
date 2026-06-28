@inject('itemServ','App\Services\ItemServices')
@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('rightFixedTop')
<form class="row">
    <div class="col-xs-3 mr-1 d-none">
        <select class="form-control" name="t" id="">
            <option {{ app('request')->input('t') == 'title' ? 'selected' : '' }} value="title">@lang('Tiêu đề')</option>
        </select>
    </div>

    <div class="col-xs-7 mr-1">
        <input value="{{ app('request')->input('s') }}" type="text" class="form-control" name="s" placeholder="{{ __('Tìm kiếm') }}" />
    </div>
    <div class="col-xs-1 mr-1">
        <button class="btn btn-primary btn"><i class="fas fa-search"></i></button>
    </div>

    <div class="col-xs-2 mr-1">
        <a class="btn btn-success" href="{{ route('article.create') }}"><i class="fas fa-plus"></i> @lang('Thêm mới')</a>
    </div>
</form>
@endsection

@section('body')
@if(sizeof($list) == 0)
<div class="text-center mt-5 pt-5">
    @lang('Chưa có bài viết nào. <a href=":url"><i class="fas fa-plus"></i> Thêm mới</a>', ['url' => route('article.create')])
</div>
@else
<div class="card shadow">
    <div class="card-body p-0  table-responsive">
        <table class="table table-bordered table-striped">
            <thead>
                <thead>
                    <th class="text-center">#</th>
                    @if($userServ->isMod()) <th width="5%" class="text-center">Hot</th>@endif
                    @foreach(App\Models\I18nContent::$supports as $locale)
                    <th>@lang('Tiêu đề') [{{ $locale }}]</th>
                    @endforeach
                    <th>@lang('Loại')</th>
                    <th>@lang('Lần sửa cuối')</th>
                    <th>@lang('Thao tác')</th>
                </thead>
            <tbody>
                @foreach($list as $article)
                <tr>
                    <th class="text-center">{{ $article->id }}</th>
                    @if($userServ->isMod()) <td class="text-center"><a href="{{ route('ajax.touch.ishot', ['table' => 'articles', 'id' =>  $article->id ]) }}">{!! $userServ->hotIcon($article->is_hot) !!}</a></td>@endif
                    @foreach(App\Models\I18nContent::$supports as $locale)
                    <td>{{ $article->title[$locale]}}</td>
                    @endforeach
                    <td>{{ $article->type }}</td>
                    <td>{{ $article->updated_at }}</td>
                    <td>
                        <a href="{{ route('article.edit', ['id' => $article->id  ]) }}"><i class="fa fa-edit"></i></a>
                        {!! $itemServ->articleStatusOperation($article->id, $article->status) !!}
                    </td>
                </tr>
                @endforeach
            </tbody>
            </thead>
        </table>
    </div>
    <div class="card-footer">
        {{ $list->links() }}
    </div>
</div>

@endif

@endsection
