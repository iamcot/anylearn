@inject('transServ', 'App\Services\TransactionService')
@extends('layout')
@section('rightFixedTop')
    <form>
        <a href="#" class="btn btn-success btn-sm finExpendClick" data-expend-id="">@lang('Thêm')</a>
    </form>
@endsection
@section('body')
    <form>
        <div class="card shadow mb-2">
            <div class="card-body row">
                <div class="col-xs-6 col-lg-4 ">
                    <div class="form-group row">
                        <label class="col-12" for="">ID(s) <span class="small">Để trống đến ID nếu chỉ tìm
                                1</span></label>
                        <div class="col-lg-6 mb-1">
                            <input value="{{ app('request')->input('id_f') }}" type="text" class="form-control"
                                name="id_f" placeholder="từ ID " />
                        </div>
                        <div class="col-lg-6">
                            <input value="{{ app('request')->input('id_t') }}" type="text" class="form-control"
                                name="id_t" placeholder="đến ID" />
                        </div>
                    </div>

                </div>
                <div class="col-xs-6 col-lg-4">
                    <div class="form-group">
                        <label for="">Nội Dung</label>
                        <input value="{{ app('request')->input('content') }}" type="text" class="form-control"
                            name="content" placeholder="Nội dung" />
                    </div>
                </div>
                <div class="col-xs-6 col-lg-4">
                    <div class="form-group">
                        <label for="">Loại</label>
                        <select class="form-control" name="type" id="">
                            <option value="">---</option>
                            <option {{ app('request')->input('type') == 'fin_salary' ? 'selected' : '' }}
                                value="fin_salary">Lương/Thưởng</option>
                            <option {{ app('request')->input('type') == 'fin_office' ? 'selected' : '' }}
                                value="fin_office">Văn Phòng</option>
                            <option {{ app('request')->input('type') == 'fin_sale' ? 'selected' : '' }} value="fin_sale">Chi
                                Phi Bán Hàng</option>

                            <option {{ app('request')->input('type') == 'fin_marketing' ? 'selected' : '' }}
                                value="fin_marketing">Marketing</option>
                            <option {{ app('request')->input('type') == 'fin_assets' ? 'selected' : '' }}
                                value="fin_assets">Tài Sản</option>
                            <option {{ app('request')->input('type') == 'fin_others' ? 'selected' : '' }}
                                value="fin_others">Chi Khác</option>
                        </select>
                    </div>
                </div>
                <div class="col-xs-6 col-lg-3">
                    <div class="form-group">
                        <label for="">Thời gian tạo từ</label>
                        <input value="{{ app('request')->input('date') }}" type="date" class="form-control"
                            name="date" placeholder="Thời gian tạo" />
                    </div>
                </div>
                <div class="col-xs-6 col-lg-3">
                    <div class="form-group">
                        <label for="">Thời gian tạo đến</label>
                        <input value="{{ app('request')->input('datet') }}" type="date" class="form-control"
                            name="datet" placeholder="Thời gian tạo đến" />
                    </div>
                </div>
            </div>
            <div class="card-footer">
                <button class="btn btn-primary btn-sm" name="action" value="search"><i class="fas fa-search"></i> Tìm
                    kiếm</button>
                <button class="btn btn-success btn-sm" name="action" value="file"><i class="fas fa-file"></i> Xuất
                    file</button>
                <button class="btn btn-warning btn-sm" name="action" value="clear"> Xóa tìm kiếm</button>
            </div>
        </div>
    </form>
    <div class="card shadow">
        <div class="card-body p-0 table-responsive">
            <table class="table table-striped table-hover table-bordered">
                <thead class="">
                    <tr>
                        <th class="text-center" width="10%" scope="col">#ID</th>
                        <th class="text-center">@lang('User (SDT)')</th>
                        <th class="text-center">@lang('Loại')</th>
                        <th class="text-center">@lang('Số tiền')</th>
                        <th class="text-center">@lang('Nội dung')</th>
                        <th class="text-center">@lang('Ngày')</th>
                        <th class="text-center">@lang('Ghi Chú')</th>
                    </tr>
                </thead>
                <tbody>
                    @if (!empty($transaction))
                        @foreach ($transaction as $row)
                            <tr>
                                <th class="text-center" scope="row">{{ $row->id }}
                                    <a href="#" class="finExpendClick" data-expend-id="{{ $row->id }}"
                                        data-title="{{ $row->content }}"
                                        data-date="{{ date('Y-m-d', strtotime($row->created_at)) }}"
                                        data-ref_user_id="{{ $row->ref_user_id }}" data-amount="{{ $row->amount }}"
                                        data-type="{{ $row->type }}" data-pay_method="{{ $row->pay_method }}"
                                        data-comment="{{ $row->pay_info }}"><i class="fa fa-edit"></i></a>
                                </th>
                                <td class="text-center" scope="row">
                                    @if (!empty($row->name))
                                        {{ $row->name }} ({{ $row->phone }})
                                    @endif
                                </td>
                                <td class="text-center" scope="row">
                                @if ($row->type == \App\Constants\ConfigConstants::TRANSACTION_FIN_SALARY)@lang('Lương/Thưởng')@endif
                                @if ($row->type == \App\Constants\ConfigConstants::TRANSACTION_FIN_OFFICE)@lang('Văn Phòng')@endif
                                @if ($row->type == \App\Constants\ConfigConstants::TRANSACTION_FIN_SALE)@lang('Chi Phí Bán Hàng')@endif
                                @if ($row->type == \App\Constants\ConfigConstants::TRANSACTION_FIN_MARKETING) Marketing @endif
                                @if ($row->type == \App\Constants\ConfigConstants::TRANSACTION_FIN_ASSETS)@lang('Tài sản')@endif
                                @if ($row->type == \App\Constants\ConfigConstants::TRANSACTION_FIN_OTHERS)@lang('Chi khác')@endif</td>

                                <td class="text-center" scope="row"><p class="inline-block">{{ number_format($row->amount) }}</p>

                                </td>
                                <td class="text-center" scope="row">{{ $row->content }}</td>
                                <td class="text-center" scope="row">{{ date('d/m/y', strtotime($row->created_at)) }}
                                </td>
                                <td>{{ $row->pay_info }}</td>
                            </tr>
                        @endforeach
                    @endif
                </tbody>
            </table>

        </div>
        <div class="card-footer">
            <div>
                Số phiếu chi: <p class="d-inline">{{number_format($totalv)}}</p> | Tổng chi: <p class="d-inline">{{ number_format($amount)}}
                </p> vnđ
            </div>
        <div>{{ $transaction->appends(request()->query())->links() }}</div>

        </div>
    </div>


@endsection
@include('dialog.fin_expendatures')
@section('jscript')
    @parent
    <script>
        $('.finExpendClick').click(function() {
            var expendId = $(this).data("expend-id");
            var date = $(this).data("date");
            // console.log(date);
            $("#expendid").val(expendId);
            if (expendId > 0) {
                $("#form_title").val($(this).data("title"));
                $("#form_ref_user_id").val($(this).data("ref_user_id"));
                $("#form_type").val($(this).data("type"));
                if ($(this).data("pay_method") == 'cash') {
                    $("#pay_method_cash").prop("checked", true);
                } else {
                    $("#pay_method_atm").prop("checked", true);
                }

                $("#form_amount").val($(this).data("amount"));
                $("#form_date").val($(this).data("date"));
                $("#form_comment").val($(this).data("comment"));
            } else {
                $("#form_title").val("");
                $("#form_ref_user_id").val("");
                $("#form_type").val("");
                $("#form_date").val("");
                $("#pay_method_cash").prop("checked", true);
                $("#form_amount").val("");
                $("#form_comment").val("");
            }
            $('#finExpendaturesModal').modal('show');
        });
    </script>
@endsection
