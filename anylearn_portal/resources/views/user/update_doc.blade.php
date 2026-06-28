@extends('auth.layout')
@section('body')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8" style="padding-top:100px;">
            <div class="card shadow">
                <div class="card-header m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}"><i class="fas fa-lock"></i> @lang('Cập nhật giấy giờ bắt buộc')</div>
                <div class="card-body">
                    <h3>@lang('Xin chào') <strong>{{ auth()->user()->name }}</strong>!</h3>
                    <p>@lang('Vui lòng upload giấy tờ liên quan đến ngành nghề của bạn. Nếu không các thông tin về khóa học sẽ không được hiện thị khi bạn chưa cập nhật giấy tờ đầy đủ')</p>
                    <form method="POST" role="form" id="formnews" enctype="multipart/form-data">
                        @csrf
                        <input name="file" type="file" id="imgInp" multiple />
                        <div id="newsImages" style="max-width:300px"></div>
                        <p class="small"><i class="fas fa-info-circle"></i> @lang('Chấp nhận các định dạng'): jpg, png, doc, pdf</p>
                        <button type="button" class="btn btn-{{ env('MAIN_COLOR', 'primary') }}" id="saveButton" onclick="submit()">
                            <i class="fas fa-cloud-upload-alt"></i> Upload</button>
                        <a href="/">@lang('Tôi sẽ cập nhật sau')</a>
                    </form>
                </div>
            </div>
            </form>
        </div>
    </div>
</div>
</div>
</div>
@endsection