@inject('itemServ','App\Services\ItemServices')
@if(!empty($course['info']))
<div class="row">
    <div class="col-12">
        <div class="card shadow">
            <div class="card-header font-weight-bold">Kế hoạch học tập  <a href="?tab=schedule">Tạo mới</a></div>
            <div class="card-body p-0">
                @if(!isset($openings))
                <p class="p-3">Lớp học chưa có kế hoạch nào,  <a href="?tab=schedule">Tạo mới</a></p>
                @else
                <table class="table">
                    <thead>
                        <tr>
                            <th>Kế hoạch</th>
                            <th>Nơi học</th>
                            <th>Bắt đầu</th>
                            <th>Lịch học</th>
                            <th></th>
                        </tr>
                    </thead>
                @foreach($openings as $open)
                    <tr>
                        <td>{{ $open->title }}</td>
                        <td>{{ $open->location }}</td>
                        <td>{{ $open->date_start }} {{ $open->time_start }} </td>
                        <td>{{ $open->weekdays }}</td>
                        <td>
                            <a class="mr-2" href="?plan={{ $open->id }}&tab=schedule"><i class='fas fa-edit'></i> Sửa</a>
                            <a href="{{ route('me.class.del.schedule', ['id' => $open->id]) }}"><i class='fas fa-trash'></i> Xóa</a>
                        </td>
                    </tr>
                @endforeach
                </table>
                @endif
            </div>
        </div>
        <div class="card shadow mt-3">
            <div class="card-header font-weight-bold">Lập/Chỉnh sửa kế hoạch học tập <a href="?tab=schedule">Tạo mới</a></div>
            <div class="card-body">
                <form method="POST">
                    @csrf
                    @if(request()->get('plan'))
                    <input type="hidden" name="opening[plan]" value="{{ request()->get('plan') }}">
                    @endif
                    <div class="form-group ">
                        <label for="opening_title" class="form-label text-md-right">{{ __('Tiêu đề') }}*</label>
                        <div class="">
                            <input id="opening_title" type="text" class="form-control @error('opening_title') is-invalid @enderror" name="opening[title]" value="{{ old('opening_title', !empty($opening) ? $opening->title : '') }}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="province" class=" form-label text-md-right">{{ __('Địa chỉ / Chi nhánh') }} <a href="{{ route('location.create') }}?user_id={{ $course['info']->user_id }}">@lang('Tạo địa chỉ')</a></label>
                        <div class="">
                            @if (!empty($userLocations))
                            <select class="form-control" name="opening[user_location_id]">
                                @foreach($userLocations as $location)
                                <option value="{{ $location->id }}" @if(!empty($opening) &&  $location->id == $opening->user_location_id ) selected @endif>{{ $location->title }}</option>
                                @endforeach
                            </select>
                            @endif
                        </div>
                    </div>
                    <div class="form-group ">
                        <label for="opening_info" class="form-label text-md-right">{{ __('Thông tin bổ sung (lịch học, dặn dò...)') }}</label>
                        <div class="">
                            <textarea id="opening_info" type="text" class="form-control editor @error('opening_info') is-invalid @enderror" name="opening[info]" value="{{ old('opening_info', !empty($opening) ? $opening->info : '') }}">{{ old('opening_info', !empty($opening) ? $opening->info : '')}}</textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="weekdays" class="form-label ">{{ __('Ngày trong tuần') }}*</label>
                        <ul class="list-inline">
                            @for($i=1; $i<=7; $i++)
                            <li class="list-inline-item"><input type="checkbox" name="opening[d][{{ $i }}]" id="d{{ $i}}" @if(!empty($opening) && in_array($i, $opening->weekdays)) checked @endif> <label for="d{{  $i }}">{{ $i == 1 ? __('Chủ Nhật') : __("Thứ " . ($i)) }}</label> </li>
                                @endfor
                        </ul>
                    </div>
                    <div class="row">
                        <div class="form-group  col-sm-6">
                            <label for="opening_date_start" class="form-label text-md-right">{{ __('Ngày bắt đầu') }}*</label>
                            <div class="">
                                <input id="opening_date_start" type="date" class="form-control" name="opening[date_start]" value="{{ old('opening_date_start', !empty($opening) ? $opening->date_start : '') }}">
                            </div>
                        </div>
                        <div class="form-group col-sm-6">
                            <label for="opening_time_start" class="form-label text-md-right">{{ __('Giờ bắt đầu') }}*</label>
                            <div class="">
                                <input id="opening_time_start" type="time" class="form-control" name="opening[time_start]" value="{{ old('opening_time_start', !empty($opening) ? $opening->time_start : '') }}">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="form-group col-sm-6">
                            <label for="opening_date_end" class="form-label text-md-right">{{ __('Ngày kết thúc') }}</label>
                            <div class="">
                                <input id="opening_date_end" type="date" class="form-control" name="opening[date_end]" value="{{ old('opening_date_end', !empty($opening) ? $opening->date_end : '') }}">
                            </div>
                        </div>
                        <div class="form-group col-sm-6">
                            <label for="opening_time_end" class="form-label text-md-right">{{ __('Giờ kết thúc') }}</label>
                            <div class="">
                                <input id="opening_time_end" type="time" class="form-control" name="opening[time_end]" value="{{ old('opening_time_end', !empty($opening) ? $opening->time_end : '') }}">
                            </div>
                        </div>
                    </div>

                    <button class="btn btn-success border-0" name="action" value="schedule">@lang('Lưu')</button>
                </form>
            </div>
        </div>
    </div>
</div>
@endif
