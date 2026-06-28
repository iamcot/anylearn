<form action="{{ route('add2cart') }}" method="post" id="pdpAdd2Cart" data-spm="add2cart.0">
    @csrf
    <input type="hidden" name="action" value="pdpAdd2Cart">
    <input type="hidden" name="class" value="{{ $class->id }}">
    <div id="pdpAdd2CartModal" class="modal fade shadow" tabindex="-1" role="dialog">
        <div class="modal-dialog" id="step1">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title m-0 text-primary }}">@lang('Bạn đang đăng ký khoá học')
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <h3 class="fw-bold text-success">{{ $class->title }}</h3>
                    <p>{{ $author->role == 'teacher' ? __('Giảng viên') : __('Trung tâm') }}: {{ $author->name }}</p>
                    <p>@lang('Khai giảng:') {{ date('d/m/Y', strtotime($class->date_start)) }}
                        {{ $num_schedule <= 1 ? '' : '(có ' . $num_schedule . ' buổi học)' }}</p>
                    <p>@lang('Học phí:') <strong>{{ number_format($item->price, 0, ',', '.') }}</strong></p>
                    <p>@lang('Bạn sẽ nhận') <strong>{{ number_format($commission, 0, ',', '.') }}</strong>
                        @lang('anyPoint cho giao dịch này')</p>
                    @if (count($item->openings) > 0)
                        <p class="text-danger">@lang('Chọn lịch khai giảng')</p>
                        <ul class="list-unstyled">
                            @foreach ($item->openings as $opening)
                                <li>
                                    <label for="class_{{ $opening->id }}"> <input required
                                            id="class_{{ $opening->id }}" type="radio" name="class"
                                            value="{{ $opening->id }}"> {{ $opening->title }}</label>
                                </li>
                            @endforeach
                        </ul>
                    @endif

                    <div class="modal-footer">
                        {{-- <button id="add2CartBtn" name="add2cart" value="add2cart"
                            class="btn btn-success rounded-pill border-0">@lang('ĐĂNG KÝ KHOÁ HỌC')</button> --}}
                        <button type="button" id="nex_step" onclick="next_step()"
                            class="btn btn-success rounded-pill border-0">@lang('ĐĂNG KÝ KHOÁ HỌC')</button>

                    </div>
                </div>
            </div>
        </div>
        <div class="modal-dialog d-none" id="step2">
            <div class="modal-content">
                <div class="modal-header">

                    <h5 class="modal-title m-0 text-primary }}"><b class="text-dark">@lang('Bạn đang đăng ký khóa học: ')</b>
                        <br>{{ $class->title }}
                    </h5>
                </div>
                <div class="modal-body">
                    <h5 class="fw-bold">@lang('Vui lòng chọn tài khoản học cho khóa học này')</h5>
                    <div>
                        <div id="add2cartchild" class="input-group-append mb-2">
                            <div class="row mt-3">
                                <div class="col-md-8">
                                    <select name="child" class="form-select" id="inputGroupSelect04">
                                        @if (Auth::check())
                                            <option value="">{{ auth()->user()->name }} (@lang('Tôi'))
                                            </option>
                                        @endif
                                        @if (count($children) > 0)
                                            @foreach ($children as $child)
                                                <option value="{{ $child->id }}">{{ $child->name }}</option>
                                            @endforeach
                                        @endif
                                    </select>
                                </div>
                                <div class="col-md-4 mt-2">
                                    <a class="text-primary fw-bold"
                                        href="{{ route('me.child') }}">@lang('+ Thêm tài khoản')</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="add2CartBtn" name="add2cart" value="add2cart"
                            class="btn btn-success rounded-pill border-0">@lang('XÁC NHẬN')</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</form>
<script>
    function next_step() {
        $("#step1").hide();
        $("#step2").removeClass("d-none");
    }
</script>
