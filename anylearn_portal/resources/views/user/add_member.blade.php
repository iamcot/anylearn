@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('body')
<form>
    <div class="card mb-3 shadow">
        <div class="form-group row p-3 m-0">
            <label for="role" class="col-md-3 col-form-label text-md-right  font-weight-bold">{{ __('Loại đối tượng') }}</label>
            <div class="col-md-8">
                <select id="role" class="form-control" name="role" required>
                    <option value="{{ \App\Constants\UserConstants::ROLE_MEMBER }}" {{ old('role') == \App\Constants\UserConstants::ROLE_MEMBER ? 'selected' : '' }}>@lang('Phụ huynh / Người học')</option>
                    <option value="{{ \App\Constants\UserConstants::ROLE_TEACHER }}" {{ old('role') == \App\Constants\UserConstants::ROLE_TEACHER ? 'selected' : '' }}>@lang('Chuyên gia / Giảng viên')</option>
                    <option value="{{ \App\Constants\UserConstants::ROLE_SCHOOL }}" {{ old('role') == \App\Constants\UserConstants::ROLE_SCHOOL ? 'selected' : '' }}>@lang('Doanh nghiệp / Trường học')</option>
                </select>
            </div>
        </div>
    </div>
    <div id="add-member" class="card mb-3 shadow">
        <div class="card-body">
            <div class="form-group row">
                <label for="name" class="col-md-3 col-form-label text-md-right ">
                    {{ old('role') != \App\Constants\UserConstants::ROLE_SCHOOL ? __('Họ và tên') : __('Tên doanh nghiệp') }}
                </label>
                <div class="col-md-8">
                    <input id="name" type="text" class="form-control @error('name') is-invalid @enderror" name="name" value="{{ old('name') }}" required>
                </div>
            </div>
            <div class="form-group row">
                <label for="phone" class="col-md-3 col-form-label text-md-right ">{{ __('Số điện thoại') }}</label>
                <div class="col-md-8">
                    <input id="phone" type="tel" pattern="[0-9]{10}" class="form-control @error('phone') is-invalid @enderror" name="phone" value="{{ old('phone') }}" required>
                    @error('phone')
                        <div class="alert-danger">{{ $message }}</div>
                    @enderror
                </div>     
            </div>
            <div class="form-group row">
                <label for="address" class="col-md-3 col-form-label text-md-right ">{{ __('Khu vực') }}</label>
                <div class="col-md-8">
                    <input id="address" type="text" class="form-control @error('address') is-invalid @enderror" name="address" value="{{ old('address') }}" required>
                </div>
            </div>
            <div class="form-group row">
                <label for="source" class="col-md-3 col-form-label text-md-right ">{{ __('Nguồn data') }}</label>
                <div class="col-md-8">
                    <input id="source" type="text" class="form-control @error('source') is-invalid @enderror" name="source" value="{{ old('source') }}" required>
                </div>
            </div>
            <div class="form-group row">
                <label for="note" class="col-md-3 col-form-label text-md-right ">{{ __('Mô tả nhu cầu') }}</label>
                <div class="col-md-8">
                    <textarea id="note" class="form-control @error('note') is-invalid @enderror" name="note" value="{{ old('note') }}" rows="3" required></textarea>
                </div>
            </div>
            <div class="text-center mb-3">
                <button class="btn btn-primary border-0 rounded" name="action" value="addMember"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
            </div>
        </div>
    </div>
</form>
@endsection
@section('jscript')
<script>
    $("#role").on("change", function(e) {
        var select = $(this).val();
        if (select == "") {
            $("#add-member").addClass('d-none');
        } else {
            $("#add-member").removeClass('d-none');
        }

        if (select == "school") {
            $("label[for='name']").text('Tên doanh nghiệp');
        } else {
            $("label[for='name']").text('Họ và tên');
        }
    });
</script>
@endsection
