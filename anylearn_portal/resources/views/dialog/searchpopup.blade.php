<form action="/search" method="get" id="homesearch">
    <div id="homesearchModal" class="modal fade shadow" tabindex="-1" role="dialog">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                <h4>@lang('Tìm kiếm trung tâm, khoá học gần bạn')</h4>
                </div>
                <div class="modal-body">
                  
                    
                    <div class="row mt-2">
                        <div class="col-sm-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="o" id="school" value="schools" checked>
                                <label class="form-check-label" for="school">
                                    @lang('Trung tâm giáo dục')
                                </label>
                            </div>
                        </div> 
                        <!-- <div class="col-sm-4">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="o" id="class" value="class" disabled>
                                <label class="form-check-label" for="class">
                                    Khoá Học
                                </label>
                            </div>
                        </div> -->
                    </div>
                    <div class="row mt-2">
                        <div class="col-md-6">
                            <div class="form-group">
                                <select class="form-control location-tree" data-next-level="district" name="p">
                                    <option value="">@lang('--Chọn Tỉnh/Thành Phố--')</option>
                                    @foreach($provinces as $province)
                                    <option value="{{ $province->code }}" {{ !empty($location) && $province->code == $location->province_code ? "selected" : ""}}>{{ $province->name }}</option>
                                    @endforeach
                                </select>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <select class="form-control location-tree" id="select-district" name="d">
                                    @if(empty($wards))
                                    <option value="">@lang('--Vui lòng chọn Quận/Huyện--')</option>
                                    @else
                                    @foreach($wards as $ward)
                                    <option value="{{ $ward->code }}" {{ $ward->code == $location->ward_code ? "selected" : ""}}>{{ $ward->name }}</option>
                                    @endforeach
                                    @endif
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="add2CartBtn" name="a" value="search" class="btn btn-success">@lang('TÌM KIÉM')</button>
                </div>
            </div>
        </div>
    </div>
</form>