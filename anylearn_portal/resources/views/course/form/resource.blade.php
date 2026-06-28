@inject('fileService', 'App\Services\FileServices')
<div class="row p-5">
    <div class="col-6">
        <h4>@lang('Hình ảnh chính của khóa học')
            <button class="btn btn-sm btn-primary float-right" name="tab" value="resource"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </h4>
        <hr />
        <input name="image" type="file" id="mainImageInp" />
        <div id="mainImage" class="mt-2">
            @if(!empty($course) && $course['info']->image)
            <img src="{{ $course['info']->image }}" alt="$course['info']->title" class="img-fluid">
            @endif
        </div>
    </div>
    <div class="col-6">
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
        <h4>@lang('Thêm tài liệu')
            <button class="btn btn-sm btn-primary float-right" name="tab" value="resource"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </h4>
        <hr />
        <div class="form-group">
            <label for="resource_title" class="form-labelfont-weight-bold">{{ __('Tiêu đề') }}</label>
            <input id="resource_title" type="text" class="form-control" name="resource[title]">
        </div>
        <div class="form-group">
            <label for="resource_desc" class="form-label font-weight-bold">{{ __('Giới thiệu ngắn') }}</label>
            <textarea id="resource_desc" class="form-control" name="resource[desc]"></textarea>
        </div>
        <input name="resource_data" type="file" id="resourceInp" />
        <p class="small">@lang('Chấp nhận các định dạng jpg, png, docx, pdf. Có thể upload nhiều lần.')</p>

    </div>
</div>