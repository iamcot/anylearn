@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')
@extends('layout')
@section('rightFixedTop')
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success btn-sm border-0 rounded-pill" href="#"><i class="fas fa-plus">
            </i> <span class="mobile-no-text"> @lang('Thêm mới')</span></a>
    </div>
@endsection
@section('body')
    <form>
        <div class="card shadow">
            <div class="card-body row">
                <div class="col-xs-6 col-lg-3">
                    <div class="form-group">
                        <input value="{{ app('request')->input('codeName') }}" type="text" class="form-control"
                            placeholder="Nhập mã" name="codeName"/>
                    </div>
                </div>
                <div class="col-xs-6 col-lg-3">
                    <div class="form-group">
                        <input value="{{ app('request')->input('itemName') }}" type="text" class="form-control"
                            placeholder="Nhập tên khóa học" name="itemName"/>
                    </div>
                </div>
                <div class="col-xs-6 col-lg-3">
                    <div class="form-group">
                        <input value="{{ app('request')->input('userName') }}" type="text" class="form-control"
                            placeholder="Nhập tên người dùng" name="userName"/>
                    </div>
                </div>
                <div class="col-xs-6 col-lg-3">
                    <div class="form-group">
                        <select class="form-control" name="codeStatus">
                            <option value="">Trạng thái</option>                            
                            <option value="0" {{ app('request')->input('codeStatus') == '0' ? 'selected' : '' }} >Chưa sử dụng</option>
                            <option value="1" {{ app('request')->input('codeStatus') == 1 ? 'selected' : '' }} >Đã sử dụng</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary btn-sm" name="action" value="search"><i class="fas fa-search"></i>
                    @lang('Tìm kiếm')</button>
                <a href="{{ route('codes') }}" class="btn btn-warning btn-sm" name="action" value="clear"> @lang('Xóa tìm kiếm')</a>
            </div>
        </div>
    </form>
    <div class="card shadow">
        <div class="card-body p-0 table-responsive">
            <table class="table table-bordered table-striped">
                <thead>
                    <th class="text-center">Partner Id</th>
                    <th>ID#Khóa học</th>
                    <th>Mã kích hoạt</th>
                    <th>Người dùng</th>
                    <th>Đơn hàng</th>    
                    <th>Cập nhật</th>
                    <th width="16%">Thao tác</th>
                </thead>
                <tbody>
                    @foreach ($itemCodes as $code)
                        <tr>
                            <th class="text-center">{{ $code->partner_id }}</th>
                            <td>{{ $code->item_id }}#{{ $code->class }}</td>
                            <td>{{ $code->code }}</td>
                            <td>{{ $code->user_id  ? ($code->name . "(" . $code->phone . ")") : "" }}</td>
                            <td>{{ $code->order_detail_id }}</td>
                            <td>{{ $code->updated_at }}</td>
                            <td>
                                @if(isset($code->user_id))
                                <a class="btn btn-sm btn-primary mt-1" href="{{ route('codes.resend', ['id' => $code->id]) }}"><i class="fa fa-paper-plane"></i> Gửi lại</a>
                                @else
                                <a class="btn btn-sm btn-success mt-1" href="{{ route('codes.refresh', ['id' => $code->id]) }}"><i class="	fa fa-bolt"></i> Sử dụng</a> 
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        <div class="card-footer">
            {{ $itemCodes->appends(request()->query())->links() }}
        </div>
    </div>
@endsection