<div class="row">
    <div class="col-12 p-5">
        <h4>@lang('Các giảng viên giảng dạy khoá học')
            <button class="btn btn-sm btn-primary float-right" name="tab" value="teachers"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button>
        </h4>
        <hr />
        @if(count($teachers) > 0)
        <ul class="list-unstyled">
            @foreach($teachers as $teacher)
            <li>
                <input type="checkbox" name="teachers[{{$teacher->id}}]" id="teachers_{{$teacher->id}}" {{ $teacher->isSelected ? 'checked' : ''}}>
                <label for="teachers_{{$teacher->id}}">{{ $teacher->name }}</label>
            </li>
            @endforeach
        </ul>
        @else
        <p>@lang('Trường chưa có giảng viên nào đăng ký')</p>
        @endif
    </div>
</div>