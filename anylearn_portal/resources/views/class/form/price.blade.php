@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')

<div class="card mb-3 shadow">
    <div class="card-header  font-weight-bold">Chính sách phí và ưu đãi</div>
    <div class="card-body">

        <div class="form-group row">
            <label for="is_paymentfee" class="col-md-3 col-form-label text-md-right ">{{ __('Thu hộ học phí') }}</label>
            <div class="col-md-8 form-check form-switch m-2">
                <input class="form-check-input" type="checkbox" name="is_paymentfee" id="is_paymentfee" {{ !empty($course) && $course['info']->is_paymentfee > 0 ? "checked" : "" }}>
            </div>
        </div>

        <div class="form-group row">
            <label for="price" class="col-md-3 col-form-label text-md-right ">{{ __('Học phí') }}</label>
            <div class="col-md-8">
                <input id="price" onchange="hp();" min="0" type="number" class="form-control @error('price') is-invalid @enderror" name="price" value="{{ old('price', !empty($course) ? $course['info']->price : 0) }}">
            </div>
        </div>

        <div class="form-group row">
            <label for="org_price" class="col-md-3 col-form-label text-md-right ">{{ __('Học phí gốc') }}</label>
            <div class="col-md-8">
                <input id="org_price" onchange="hp();" min="0" type="number" class="form-control @error('org_price') is-invalid @enderror" name="org_price" value="{{ old('org_price', !empty($course) ? $course['info']->org_price : '') }}">
            </div>

        </div>
        <div id="box_price" style="@if(empty($course)
        || (!empty($course) && !in_array( $course['info']->subtype, [\App\Constants\ItemConstants::SUBTYPE_OFFLINE, \App\Constants\ItemConstants::SUBTYPE_EXTRA]))
        ) display:none; @endif">
            <div class="form-group row">
                <label for="quantity" class="col-md-3 col-form-label text-md-right ">{{ __('Số lượng tuyển sinh') }}</label>
                <div class="col-md-8">
                    <input id="quantity" type="number" class="form-control @error('quantity') is-invalid @enderror" name="seats" value="{{ old('quantity', !empty($course) ? $course['info']->seats : '') }}">
                </div>
            </div>
            <div class="form-group row">
                <label for="cycle_amount" class="col-md-3 col-form-label text-md-right ">{{ __('Chu kỳ học') }}</label>
                <div class="col-sm-4">
                    <input id="cycle_amount" type="number" class="form-control @error('quantity') is-invalid @enderror" name="cycle_amount" value="{{ old('cycle_amount', !empty($course) ? $course['info']->cycle_amount : '') }}">
                </div>
                <div class="col-md-4">
                    <select name="cycle_type" id="" class="form-control">
                        <option value="{{ \App\Models\Item::CYCLE_SESSION }}" {{ !empty($course) && $course['info']->cycle_type == \App\Models\Item::CYCLE_SESSION ? 'selected' : '' }}>@lang('Buổi')</option>
                        <option value="{{ \App\Models\Item::CYCLE_DAY }}" {{ !empty($course) && $course['info']->cycle_type == \App\Models\Item::CYCLE_DAY ? 'selected' : '' }}>@lang('Ngày')</option>
                        <option value="{{ \App\Models\Item::CYCLE_WEEK }}" {{ !empty($course) && $course['info']->cycle_type == \App\Models\Item::CYCLE_WEEK ? 'selected' : '' }}>@lang('Tuần')</option>
                        <option value="{{ \App\Models\Item::CYCLE_MONTH }}" {{ !empty($course) && $course['info']->cycle_type == \App\Models\Item::CYCLE_MONTH ? 'selected' : '' }}>@lang('Tháng')</option>
                        <option value="{{ \App\Models\Item::CYCLE_YEAR }}" {{ !empty($course) && $course['info']->cycle_type == \App\Models\Item::CYCLE_YEAR ? 'selected' : '' }}>@lang('Năm')</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</div>
@if(!empty($course['info']) &&  in_array($course['info']->subtype, ['offline', 'extra']))
<div class="card mb-3 shadow">
    <div class="card-header"><strong>Quản lý phụ phí</strong></div>
    <div class="card-body p-0">
        <form action="" method="get">
            <table class="table">
                <thead>
                    <tr>
                        <th class="text-right">Tên phụ phí</th>
                        <th>Đơn giá</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($extra as $item)
                    <tr>
                        <td class="text-right">{{ $item->title }}</td>
                        <td>{{ number_format($item->price) }}₫

                        </td>
                        <td>
                            <button type="button" class="icon-item icon-item-sm rounded-3 fs--2 btn btn-default btn-sm" onclick="update({{ $item->id }},'{{ $item->title }}',{{ $item->price }})"><i class="fas fa-pen-square"></i></button>
                            <input type="hidden" name="iddelete" value="{{ $item->id }}">
                            <button class="text-danger icon-item icon-item-sm rounded-3 fs--2 btn btn-default btn-sm" name="action" value="deleteextrafee">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                    @endforeach
                    <tr>
                        <td>
                            <input type="hidden" name="idextrafee" value="" id="idextrafee">
                            <input name="titleextrafee" id="titleextrafee" placeholder="Thêm phụ phí" type="text" class="pe-4 form-control" value="">

                        </td>
                        <td>
                            <input name="priceextrafee" id="priceextrafee" placeholder="Số tiền phụ phí" type="number" class="pe-4 form-control" min="0" value="">

                        </td>
                        <td>
                            <button class="btn btn-success" name="action" value="addextrafee" type="submit">Lưu</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </form>
    </div>
</div>
@else
<div class="card">
    <div class="card-body">
        <p>Phụ phí chỉ hỗ trợ sau khi tạo khoá học. Và chỉ hỗ trợ Lớp học chính khoá hoặc ngoại khóa</p>
    </div>
</div>
@endif
<div class="text-center mb-3 mt-3">
    <a href="javascript:changeTab('info-tab')" class="btn btn-primary border-0 rounded">
        << Sửa thông tin chính</a>
            <button class="btn btn-success border-0 rounded" name="tab" value="price"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
            <a href="javascript:changeTab('content-tab')" class="btn btn-primary border-0 rounded">Sửa giới thiệu >></a>
</div>


@section('jscript')
@parent
<script>
    function hp() {
        var hp = parseInt(document.getElementById("price").value);
        var hpg = parseInt(document.getElementById("org_price").value);
        if ((hpg != "" || hpg > 0) && hpg < hp) {
            console.log(hpg, hp, hpg > 0, hpg < hp);
            document.getElementById("org_price").value = hp;
        }
    }

    function update(id, title, price) {
        console.log(id, title, price);
        document.getElementById('idextrafee').value = id;
        document.getElementById('titleextrafee').value = title;
        document.getElementById('priceextrafee').value = price;
        // window.scrollTo(0, document.body.scrollHeight);
    }
</script>
@endsection