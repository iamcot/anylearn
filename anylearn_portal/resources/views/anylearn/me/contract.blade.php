@inject('userServ', 'App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
contract
@endsection
@section('body')
<div class="row">
    <div class="col-md-6">
        <div class="col-12 mb-3">
        <strong>Hợp Đồng</strong>

            <form action="" method="POST" role="form" id="formnews">
                @csrf
                <div class="card shadow">
                    <div class="card-header p-3">
                        @if (!empty($contract))
                            <div>@lang('Trạng thái Hợp đồng:') <span
                                    class="p-1 rounded-pill baddge text-white bg-{{ $userServ->contractColor($contract->status) }}">{{ $userServ->contractStatusText($contract->status) }}</span>
                                <a data-bs-toggle="modal" data-bs-target="#contractModal"
                                    class="text-success text-decoration-none float-md-end" href="#">@lang('XEM/KÝ HỢP ĐỒNG')</a>
                            </div>
                        @else
                            <p>@lang('Bạn chưa có hợp đồng nào, hãy bắt đầu bằng việc cập nhật thông tin kinh doanh dưới đây.')</p>
                        @endif
                    </div>
                    <div class="card-body p-5">
                        @csrf
                        <div class="form-group row">
                            <label for="commission"
                                class="col-md-4 col-form-label text-md-right">{{ __('Phần trăm doanh thu nhận về') }}</label>
                            <div class="col-md-8">
                                <input id="commission" type="text" class="form-control" name="commission"
                                    value="{{ old('commission', !empty($contract) ? $contract->commission : '') }}" required>
                                <div class="small">@lang('Là số thập phân. Ví dụ: doanh nghiệp nhận về 70% từ giá sản phẩm, nhập 0.7')</div>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="cert_id"
                                class="col-md-4 col-form-label text-md-right">{{ Auth::user()->role == 'school' ? __('Số ĐKKD') : __('Số CCCD') }}</label>
                            <div class="col-md-8">
                                <input id="cert_id" type="text" class="form-control" name="cert_id"
                                    value="{{ old('cert_id', !empty($contract) ? $contract->cert_id : '') }}" required>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="cert_date"
                                class="col-md-4 col-form-label text-md-right">{{ Auth::user()->role == 'school' ? __('Ngày cấp DKKD') : __('Ngày cấp CCCD') }}</label>
                            <div class="col-md-8">
                                <input id="cert_date" type="date" class="form-control" name="cert_date"
                                    value="{{ old('cert_date', !empty($contract) ? $contract->cert_date : '') }}" required>
                            </div>
                        </div>
                        @if (Auth::user()->role == 'teacher')
                            <div class="form-group row">
                                <label for="cert_place"
                                    class="col-md-4 col-form-label text-md-right">{{ __('Nơi cấp CCCD') }}</label>
                                <div class="col-md-8">
                                    <input id="cert_place" type="text" class="form-control" name="cert_place"
                                        value="{{ old('cert_place', !empty($contract) ? $contract->cert_place : '') }}"
                                        required>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="dob"
                                    class="col-md-4 col-form-label text-md-right">{{ __('Ngày sinh') }}</label>
                                <div class="col-md-8">
                                    <input id="dob" type="date" class="form-control" name="dob"
                                        value="{{ old('dob', !empty($contract) ? $contract->dob : '') }}" required>
                                </div>
                            </div>
                        @endif
                        <div class="form-group row">
                            <label for="tax" class="col-md-4 col-form-label text-md-right">{{ __('Mã số thuế') }}</label>
                            <div class="col-md-8">
                                <input id="tax" type="text" class="form-control" name="tax"
                                    value="{{ old('tax', !empty($contract) ? $contract->tax : '') }}" required>
                            </div>
                        </div>
                        @if (Auth::user()->role == 'school')
                            <div class="form-group row">
                                <label for="ref"
                                    class="col-md-4 col-form-label text-md-right">{{ __('Người đại diện') }}</label>
                                <div class="col-md-8">
                                    <input id="ref" type="text" class="form-control" name="ref"
                                        value="{{ old('ref', !empty($contract) ? $contract->ref : '') }}" required>
                                </div>
                            </div>
                            <div class="form-group row">
                                <label for="ref_title"
                                    class="col-md-4 col-form-label text-md-right">{{ __('Chức vụ Người đại diện') }}</label>
                                <div class="col-md-8">
                                    <input id="ref_title" type="text" class="form-control" name="ref_title"
                                        value="{{ old('ref_title', !empty($contract) ? $contract->ref_title : '') }}" required>
                                </div>
                            </div>
                        @endif
                        <div class="form-group row">
                            <label for="address" class="col-md-4 col-form-label text-md-right">{{ __('Địa chỉ') }}</label>
                            <div class="col-md-8">
                                <input id="address" type="text" class="form-control" name="address"
                                    value="{{ old('address', !empty($contract) ? $contract->address : '') }}" required>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="email" class="col-md-4 col-form-label text-md-right">{{ __('Email') }}</label>
                            <div class="col-md-8">
                                <input id="email" type="email" class="form-control" name="email"
                                    value="{{ old('email', !empty($contract) ? $contract->email : '') }}" required>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="bank_name"
                                class="col-md-4 col-form-label text-md-right">{{ __('Ngân hàng') }}</label>
                            <div class="col-md-8">
                                <input id="bank_name" type="text" class="form-control" name="bank_name"
                                    value="{{ old('bank_name', !empty($contract) ? $contract->bank_name : '') }}" required>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="bank_branch"
                                class="col-md-4 col-form-label text-md-right">{{ __('Ngân hàng - Chi nhánh') }}</label>
                            <div class="col-md-8">
                                <input id="bank_branch" type="text" class="form-control" name="bank_branch"
                                    value="{{ old('bank_branch', !empty($contract) ? $contract->bank_branch : '') }}"
                                    required>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="bank_no"
                                class="col-md-4 col-form-label text-md-right">{{ __('Ngân hàng - STK') }}</label>
                            <div class="col-md-8">
                                <input id="bank_no" type="text" class="form-control" name="bank_no"
                                    value="{{ old('bank_no', !empty($contract) ? $contract->bank_no : '') }}">
                            </div>
                        </div>
                        <div class="form-group row">
                            <label for="bank_account"
                                class="col-md-4 col-form-label text-md-right">{{ __('Ngân hàng - Người thụ hưởng') }}</label>
                            <div class="col-md-8">
                                <input id="bank_account" type="text" class="form-control" name="bank_account"
                                    value="{{ old('bank_account', !empty($contract) ? $contract->bank_account : '') }}"
                                    required>
                            </div>
                        </div>
                    </div>
                    <div class="card-footer text-center">
                        <p class="small text-danger">@lang('Mọi thay đổi trên thông tin doanh nghiệp đều ảnh hưởng đến trạng thái của hợp đồng và cần anyLEARN kiểm tra lại')</p>
                        <button class="btn btn-success  border-0 rounded-pill" id="saveButton" name="save"
                            value="contract">
                            <i class="fas fa-cloud-upload-alt"></i> @lang('Cập nhật thông tin hợp đồng')
                        </button>
                    </div>
                </div>
            </form>

        </div>
        @if (!empty($contract) && !empty($contract->template))
            <div class="modal fade " id="contractModal" tabindex="-1" aria-labelledby="contractModalLabel"
                aria-hidden="true">
                <div class="modal-dialog modal-fullscreen">
                    <div class="modal-content">
                        <!-- <div class="modal-header">
                        <button type="button" class="btn btn-secondary  rounded-pill border-0" data-bs-dismiss="modal">Đóng</button>
                    </div> -->
                        <div class="modal-body p-5">
                            {!! $contract->template !!}
                        </div>
                        <div class="modal-footer text-center p-5">
                            @if ($contract->status == \App\Constants\UserConstants::CONTRACT_NEW)
                                <a class="btn btn-success rounded-pill border-0"
                                    href="{{ route('me.contract.sign', ['id' => $contract->id]) }}">@lang('ĐÃ ĐỌC VÀ ĐỒNG Ý KÝ HỢP ĐỒNG')</a>
                            @endif
                            <button type="button" class="btn btn-secondary  rounded-pill border-0"
                                data-bs-dismiss="modal">@lang('Đóng')</button>
                        </div>
                    </div>
                </div>
            </div>
        @endif
    </div>
    <div class="col-md-6">
        <div class="row">
            <div class="col-12 mb-3">
                <strong>Chứng Chỉ</strong>
                <form action="" method="POST" role="form" id="formnews" enctype="multipart/form-data">
                    <div class="card shadow">
                        <div class="card-body">
                            @csrf
                            <div class="form-group">
                                <input name="file" type="file" id="imgInp" multiple />
                                <p class="small">@lang('Chỉ hỗ trợ file hình ảnh')</p>
                                <div id="newsImages" style="max-width:300px"></div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button type="button" class="btn  btn-sm btn-success  border-0 rounded-pill" id="saveButton" onclick="submit()">
                                <i class="fas fa-cloud-upload-alt"></i> @lang('Tải lên')</button>
                        </div>
                    </div>
                </form>
            </div>
            <div class="col-12">
                <div class="card mb-2 shadow">
                    <div class="card-header">@lang('Các chứng chỉ của bạn')</div>
                    <div class="card-body">
                        @if (empty($files) || count($files) == 0)
                        <p class="p-2">@lang('Bạn chưa tải lên chứng chỉ nào.')</p>
                        @else
                        <div class="row">
                            @foreach($files as $file)
                            <div class="col-6 col-sm-4 position-relative">
                                <a href="{{ route('me.remove-cert', ['fileId' => $file->id ]) }}" class="btn btn-danger rounded-circle position-absolute " style="z-index:100;" ><i class="fa fa-trash"></i></a>

                                <a href="#" class="d-block mb-4 imagebox" data-bs-toggle="modal" data-bs-target="#imageModal" data-bs-image="{{ $file->data }}">
                                    <img class="img-fluid img-thumbnail w-100" src="{{ $file->data }}" alt="">
                                </a>
                            </div>
                            @endforeach
                        </div>

                        @endif
                    </div>
                </div>
            </div>
        </div>
        <div class="modal fade" id="imageModal" tabindex="-1" aria-labelledby="imageModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-body">
                        <img id="cert-image" class="img-fluid w-100" src="" alt="">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary  rounded-pill border-0" data-bs-dismiss="modal">@lang('Đóng')</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

@endsection
@section('jscript')
@parent
<script>
    var imageModal = document.getElementById('imageModal')
    imageModal.addEventListener('show.bs.modal', function(event) {
        var button = event.relatedTarget
        var image = button.getAttribute('data-bs-image')
        var modalImage = imageModal.querySelector('#cert-image')
        modalImage.src = image
    })
</script>
@endsection
