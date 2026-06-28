@inject('fileService', 'App\Services\FileServices')
<div class="row p-5">
    <div class="col-md-6">
        @if(!empty($course['resource']))
        <h4>@lang('Danh sách tài liệu')
        </h4>
        <hr />
        <div class="list-group  mb-5">
            @foreach($course['resource'] as $res)
            <div class="list-group-item list-group-item-action rounded-0">
                <div class="d-flex w-100 justify-content-between">
                    <h5 class="mb-1"><small class="text-primary">{!! $fileService->fileIcon($res['type']) !!}</small> <a target="_blank" href="{{ $res['data'] }}">{{ $res['title'] }}</a></h5>
                    <a class="small" href="{{ route('resource.delete', ['id' => $res['id']]) }}" title="@lang('Xóa')">
                        <i class="fas fa-trash"></i></a>

                </div>
                <p class="mb-1">{{ $res['desc'] }}</p>
            </div>
            @endforeach
        </div>
        @endif
        <h4>@lang('Tài liệu')
            <button class="btn btn-sm btn-primary pull-right" name="tab" value="resource"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </h4>
        <hr />
        <div class="form-group">
            <label for="resource_type" class="form-labelfont-weight-bold">{{ __('Loại') }}</label>
            <select name="resource[type]" id="resource_type" class="form-control">
                <option value="cert">Chứng chỉ hoàn thành</option>
                <option value="docs">Tài liệu học tập</option>
            </select>
        </div>
        <div class="form-group">
            <label for="resource_title" class="form-labelfont-weight-bold">{{ __('Tiêu đề') }}</label>
            <input id="resource_title" type="text" class="form-control" name="resource[title]">
        </div>
        <div class="form-group">
            <label for="resource_desc" class="form-label font-weight-bold">{{ __('Giới thiệu ngắn/Bố cục chứng chỉ') }}</label>
            <textarea id="resource_desc" class="form-control" name="resource[desc]"></textarea>
            <p class="small">Nếu là chứng chỉ, sẽ là cấu trúc để điền dữ liệu.</p>
        </div>
        <input name="resource_data" type="file" id="resourceInp" />
        <p class="small">@lang('Chấp nhận các định dạng jpg, png, docx, pdf. Có thể upload nhiều lần.')</p>
        <p class="small">Nếu là chứng chỉ, kích thước file yêu cầu: {{env('CERT_WIDTH')}} x {{ env('CERT_HEIGHT') }} px. Điểm bắt đầu của tên thành viên cách lề trái {{ env('CERT_X') }}px, cách đỉnh {{ env('CERT_Y') }}px</p>

    </div>
</div>