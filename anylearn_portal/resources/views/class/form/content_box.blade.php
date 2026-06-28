<div class="form-group">
    @if ($type == App\Services\ItemServices::CONTENT_OLD)
    <p class="text-danger">!!! anyLEARN đã hỗ trợ định dạng nội dung giới thiệu mới, vui lòng XÓA dữ liệu ở phần này ({{ $name }}) và copy nội dung vào các phần tương ứng bên trên.</p>
    @endif
    <label for="{{ $type }}" class="form-label font-weight-bold">{{ $name }} [{{ $locale }}]</label>
    <div class="">
        <textarea name="content[{{ $locale }}][{{ $type }}]" id="{{ $type }}" class="editor">{{ $data }}</textarea>
    </div>
</div>