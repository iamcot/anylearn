<form action="" method="post" id="finExpendForm">
    @csrf
    <input type="hidden" name="expendid" id="expendid">
    <div id="finExpendaturesModal" class="modal fade shadow" tabindex="-1" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title m-0 font-weight-bold text-{{ env('MAIN_COLOR', 'primary') }}">
                        @lang('Thông tin phiếu chi')</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>{{ __('Tên chi phí') }}</label>
                        <input id="form_title" type="text" class="form-control" name="expend[title]" value=""
                            required>
                    </div>
                    {{-- <div class="form-group">
                        <label>{{ __('ID người liên quan') }} <a target="_blank" href="{{ route('user.mods.create') }}"><i class="fa fa-plus"></i></a></label>
                        <select name="expend[ref_user_id]" id="form_ref_user_id" class="form-control" required>
                        @foreach ($mods as $mod)
                            <option value="{{ $mod->id }}">{{ $mod->name }}</option>
                        @endforeach
                        </select>
                    </div> --}}
                    <div class="form-group">
                        <div class="dropdown">
                            <label>{{ __('ID người liên quan') }} <a target="_blank"
                                    href="{{ route('user.mods.create') }}"><i class="fa fa-plus"></i></a></label>
                            <input onclick="myFunction()" ondblclick="myFunction()" onkeyup="filterFunction()" id="form_ref_user_id"
                                type="text" class="form-control" name="expend[ref_user_id]" required>
                            <div id="myDropdown" class="dropdown-content">
                                @foreach ($mods as $mod)
                                    <a onclick="chooseValue({{$mod->id}})" id="{{ $mod->id }}" value="{{ $mod->id }}">{{ $mod->name }}</a>
                                @endforeach
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>{{ __('Loại chi phí') }}</label>
                        <select name="expend[type]" id="form_type" class="form-control" required>
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_FIN_SALARY }}">
                                @lang('Lương/Thưởng')</option>
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_FIN_OFFICE }}">
                                @lang('Văn Phòng')</option>
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_FIN_SALE }}">@lang('Chi Phí Bán Hàng')
                            </option>
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_FIN_MARKETING }}">Marketing
                            </option>
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_FIN_ASSETS }}">
                                @lang('Tài sản')</option>
                            <option value="{{ \App\Constants\ConfigConstants::TRANSACTION_FIN_OTHERS }}">
                                @lang('Chi khác')</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>{{ __('Hình thức: ') }}</label>
                        <label><input type="radio" id="pay_method_cash" name="expend[pay_method]" value="cash"
                                required> @lang('Tiền mặt')</label>
                        <label><input type="radio" id="pay_method_atm" name="expend[pay_method]" value="atm"
                                required> @lang('Chuyển khoản')</label>
                    </div>
                    <div class="form-group">
                        <label>{{ __('Ngày chi') }}</label>
                        <input id="form_date" type="date" class="form-control" name="expend[date]"
                            value="{{ date('Y-m-d') }}" required>
                    </div>
                    <div class="form-group">
                        <label>{{ __('Số tiền') }}</label>
                        <input id="form_amount" type="number" min="0" class="form-control" name="expend[amount]"
                            value="" required>
                    </div>
                    <div class="form-group">
                        <label>{{ __('Ghi chú') }}</label>
                        <textarea id="form_comment" name="expend[comment]" class="form-control"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button name="action" value="saveFinExpend" id="finExpendBtn"
                        class="btn btn-{{ env('MAIN_COLOR', 'primary') }}">@lang('Lưu')</button>
                </div>
            </div>
        </div>
    </div>
</form>
<script>
    function myFunction() {
        document.getElementById("myDropdown").classList.toggle("show");
    }

    function filterFunction() {
        var input, filter, ul, li, a, i;
        input = document.getElementById("form_ref_user_id");
        filter = input.value.toUpperCase();
        div = document.getElementById("myDropdown");
        a = div.getElementsByTagName("a");
        for (i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
    }
    function chooseValue(id){
        var name = document.getElementById(id).innerText;
        document.getElementById('form_ref_user_id').value=id;
        document.getElementById("myDropdown").classList.toggle("show");
    }
</script>
