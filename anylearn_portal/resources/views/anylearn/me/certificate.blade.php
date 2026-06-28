@inject('userServ','App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
cert
@endsection
@section('body')
<div class="row">
    <div class="col-12 mb-3">
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