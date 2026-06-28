@inject('transServ','App\Services\TransactionService')
@extends('layout')

@section('body')
<form>
    <div class="card shadow mb-2">
        <div class="card-body row">
            <div class="col-xs-6 col-lg-4 ">
                <div class="form-group row">
                    <label class="col-12" for="">ID(s) <span class="small">@lang('Để trống đến ID nếu chỉ tìm 1')</span></label>
                    <div class="col-lg-6 mb-1">
                        <input value="{{ app('request')->input('id_f') }}" type="text" class="form-control" name="id_f" placeholder="từ ID " />
                    </div>
                    <div class="col-lg-6">
                        <input value="{{ app('request')->input('id_t') }}" type="text" class="form-control" name="id_t" placeholder="đến ID" />
                    </div>
                </div>

            </div>
            <div class="col-xs-6 col-lg-4">
                <div class="form-group">
                    <label for="">@lang('Tên thành viên')</label>
                    <input value="{{ app('request')->input('name') }}" type="text" class="form-control" name="name" placeholder="Tên thành viên" />
                </div>
            </div>

            <div class="col-xs-6 col-lg-4">
                <div class="form-group">
                    <label for="">@lang('SDT')</label>
                    <input value="{{ app('request')->input('phone') }}" type="text" class="form-control" name="phone" placeholder="SDT" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-4">
                <div class="form-group">
                    <label for="">@lang('Loại')</label>
                    <select class="form-control" name="type" id="">
                        <option value="">---</option>
                        <option {{ app('request')->input('type') == 'commission' ? 'selected' : '' }} value="commission">Commission</option>
                        <option {{ app('request')->input('type') == 'foundation' ? 'selected' : '' }} value="foundation">Foundation</option>
                        <option {{ app('request')->input('type') == 'order' ? 'selected' : '' }} value="order">Order</option>
                        <option {{ app('request')->input('type') == 'exchange' ? 'selected' : '' }} value="exchange">Exchange</option>
                        <option {{ app('request')->input('type') == 'deposit' ? 'selected' : '' }} value="deposit">Deposit</option>
                        <option {{ app('request')->input('type') == 'deposit_refund' ? 'selected' : '' }} value="deposit_refund">Deposit Refund</option>
                        <option {{ app('request')->input('type') == 'withdraw' ? 'selected' : '' }} value="withdraw">Withdraw</option>
                        <option {{ app('request')->input('type') == 'commission_add' ? 'selected' : '' }} value="commission_add">Commission Add</option>
                        <option {{ app('request')->input('type') == 'fin_salary' ? 'selected' : '' }} value="fin_salary">Fin Salary</option>

                    </select>
                </div>
            </div>
            <div class="col-xs-6 col-lg-3">
                <div class="form-group">
                    <label for="">@lang('Thời gian tạo từ')</label>
                    <input value="{{ app('request')->input('date') }}" type="date" class="form-control" name="date" placeholder="Thời gian tạo" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-3">
                <div class="form-group">
                    <label for="">@lang('Thời gian tạo đến')</label>
                    <input value="{{ app('request')->input('datet') }}" type="date" class="form-control" name="datet" placeholder="Thời gian tạo đến" />
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-primary btn-sm" name="action" value="search"><i class="fas fa-search"></i> @lang('Tìm kiếm')</button>
            <button class="btn btn-success btn-sm" name="action" value="file"><i class="fas fa-file"></i> Xuất file</button>
            <button class="btn btn-warning btn-sm" name="action" value="clear"> @lang('Xóa tìm kiếm')</button>
        </div>
    </div>
</form>
<div class="card shadow">
    <div class="card-body p-0 table-responsive">
        <table class="table table-striped table-hover table-bordered">
            <thead class="">
                <tr>
                    <th class="text-center" width="5%" scope="col">#ID</th>
                    <th class="text-center">User (SDT)</th>
                    <th class="text-center">Loại</th>
                    <th class="text-center">Số tiền</th>
                    <th class="text-center">Số tiền tham chiếu</th>
                    <th class="text-center">Nội dung</th>
                    <th class="text-center">Trạng thái</th>

                    <th class="text-center">Cập nhật</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($transaction))
                @foreach($transaction as $row)
                <tr>
                    <th class="text-center" scope="row">{{ $row->id }}</th>
                    <td class="text-center" scope="row">@if(!empty($row->name)) <a href="/admin/user/members/{{ $row->user_id }}" target="_blank">{{ $row->name }} ({{ $row->phone }}) </a>@endif</td>
                    <td class="text-center" scope="row">{{ $row->type }}</td>
                    <td class="text-center" scope="row">{{ number_format($row->amount) }}</td>
                    <td class="text-center" scope="row">{{ number_format($row->ref_amount) }}</td>
                    <td class="text-center" scope="row">{{ $row->content }} @if($row->item_id) <a href="/admin/class/{{ $row->item_id }}/edit" target="_blank">Xem lớp học</a> @endif</td>
                    <td class="text-center text-{{ $transServ->statusColor( $row->status ) }}" scope="row">{{ $transServ->statusText( $row->status )  }}</td>
                    <td class="text-center">{{ date('H:i d/m/y', strtotime($row->updated_at)) }}</td>
                </tr>
                @endforeach
                @endif
            </tbody>
        </table>
        <!-- <div class="small ml-3">
            <p><i class="fas fa-fire text-danger" title="Nổi bật"></i> Thành viên nổi bật. <i class="fas fa-check-circle text-success"></i> Thành viên đang hoạt động. <i class="fas fa-stop-circle text-danger"></i> Thành viên đang bị khóa.
                <i class="fas fa-cloud-upload-alt text-gray"></i> Giấy tờ chưa hợp lệ. <i class="fas fa-cloud-upload-alt text-success"></i> Đã cập nhật chứng chỉ, giấy tờ >>> Click để xem chi tiết.

            </p>
        </div> -->

    </div>
    <div class="card-footer">
        <div>{{ $transaction->appends(request()->query())->links() }}</div>
    </div>
</div>
@endsection
