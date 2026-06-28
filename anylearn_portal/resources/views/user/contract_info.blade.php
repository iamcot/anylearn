@inject('userServ', 'App\Services\UserServices')
@extends('layout')

@section('body')
    <p>
        @lang('Sử dụng chính xác tên các trường thông tin kèm cặp dấu {} để đặt vào các vị trí cần đổ thông tin khi')
        <a target="_blank" href="/admin/config/guide/contract_teacher">@lang('Sửa mẫu hợp đồng Giảng viên')</a>, @lang('hoặc')
        <a target="_blank" href="/admin/config/guide/contract_school">@lang('Sửa mẫu hợp đồng Trường học')</a>. @lang('Ví dụ:') {name},
        {cert_id} ...
    </p>
    <form method="post" class="row">
        @csrf
        <div class="col-md-6">
            <div class="card shadow">
                <div class="card-header">
                    @lang('Thông tin hợp đồng')
                </div>
                <div class="card-body p-0 table-responsive">
                    <table class="table table-striped table-hover table-bordered">
                        <tr>
                            <th width="40%">@lang('Trường thông tin')'/th>
                            <th>@lang('Dữ liệu')</th>
                        </tr>
                        @foreach (json_decode(json_encode($contract), true) as $key => $value)
                            <tr>
                                <th>{{ $key }}</th>
                                @if ($key === 'commission')
                                    <td>{{ $value * 100 . ' %' }}</td>
                                @else
                                    <td>{{ $value }}</td>
                                @endif
                            </tr>
                        @endforeach
                    </table>

                </div>
                <div class="card-footer">
                </div>
            </div>
        </div>
        <div class="col-md-6">
            <div class="card shadow mb-4">
                <div class="card-header">
                    @lang('Các chứng chỉ')
                </div>
                <div class="card-body row">
                    @foreach ($files as $file)
                        <div class="col-4 position-relative">
                            <!-- <a href="{{ route('me.remove-cert', ['fileId' => $file->id]) }}" class="btn btn-danger rounded-circle position-absolute " style="z-index:100;"><i class="fa fa-trash"></i></a> -->

                            <a href="#" class="d-block mb-4 imagebox" data-toggle="modal" data-target="#imageModal"
                                data-image="{{ $file->data }}">
                                <img class="img-fluid img-thumbnail w-100" src="{{ $file->data }}" alt="">
                            </a>
                        </div>
                    @endforeach
                </div>
                <div class="card-footer">
                    @if ($contract->status == \App\Constants\UserConstants::CONTRACT_DELETED)
                        <div class="text-danger">@lang('Hợp đồng đã bị huỷ')</div>
                    @else
                        @if ($contract->status == \App\Constants\UserConstants::CONTRACT_SIGNED)
                            <button class="btn btn-sm btn-success float-right" name="action"
                                value="{{ \App\Constants\UserConstants::CONTRACT_APPROVED }}">@lang('Duyệt')</button>
                        @endif
                        <button class="btn btn-sm btn-danger float-right mr-1" name="action"
                            value="{{ \App\Constants\UserConstants::CONTRACT_DELETED }}">@lang('Từ chối')</button>
                    @endif
                </div>
            </div>
            <!-- <div class="card shadow">
                <div class="card-header">
                    Chữ ký
                    @if ($contract->status == \App\Constants\UserConstants::CONTRACT_SIGNED)
    <button class="btn btn-sm btn-primary float-right" name="action" value="{{ \App\Constants\UserConstants::CONTRACT_APPROVED }}">Duyệt hợp đồng</button>
    @endif
                </div>
                <div class="card-body">
                    @if ($contract->signed)
    <img class="img-fluid" src="{{ $contract->signed }}" alt="" style="max-height:400px;">
@else
    <p>Chưa có chữ ký</p>
    @endif
                </div>
                <div class="card-footer">
                    <button class="btn btn-sm btn-danger float-right" name="action" value="{{ \App\Constants\UserConstants::CONTRACT_DELETED }}">Từ chối hợp đồng</button>
                </div>
            </div> -->
            <div class="card-footer">
                @lang('Xem và tải xuống mẫu hợp đồng:')
                @if ($contract->role == 'school')
                    <a target="_blank"
                        href="/admin/config/guide/contract_school/{{ $contract->id }}">@lang('Hợp đồng Trường học')</a>
                @else
                    <a target="_blank"
                        href="/admin/config/guide/contract_teacher/{{ $contract->id }}">@lang('Hợp đồng Giảng viên')</a>
                @endif
            </div>
        </div>
    </form>
    <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-body">
                    <img id="cert-image" class="img-fluid w-100" src="" alt="">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary  rounded-pill border-0"
                        data-dismiss="modal">@lang('Đóng')</button>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('jscript')
    @parent
    <script>
        $('#imageModal').on('show.bs.modal', function(event) {
            var button = $(event.relatedTarget)
            var image = button.data('image')
            var modalImage = $(this).find('#cert-image')
            modalImage.attr('src', image)
        })
    </script>
@endsection
