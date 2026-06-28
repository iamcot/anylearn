<div class="row">
    <div class="col-12 p-5">
        <h4>@lang('Học viên đã đăng ký')
            <!-- <button class="btn btn-sm btn-primary float-right" name="tab" value="teachers"><i class="fas fa-save"></i> @lang('Lưu thay đổi')</button> -->
        </h4>
        @if(!empty($students) &&  count($students) > 0)
        <table class="table">
            <thead>
                <tr>
                    <th></th>
                    <th>Tên học viên</th>
                    <th>Ngày đăng ký</th>
                    <th>Xác nhận (buổi)</th>
                    <th>Chứng chỉ</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            @foreach($students as $student)
            <tr>
                <td><input type="checkbox" name="student_ids[{{ $student->id }}]" id=""></td>
                <td>{{ $student->name }}</td>
                <td>{{ date('d/m/Y', strtotime($student->created_at)) }}</td>
                <td>{{ $student->confirm_count }}</td>
                <td>
                    @if($student->cert)
                    <a href="{{ $student->cert }}" target="_blank"><i class="fa fa-certificate"></i></a>
                    @endif
                </td>
                <td>
                    @if($student->confirm_count == 0)
                    <a href="{{ route('class.author.confirmjoin' , ['itemId' =>  $course['info']->id ]) }}?join_user={{ $student->id }}&orderId={{ $student->orderId }}" class="btn btn-success btn-sm">Xác nhận tham gia</a>
                    @elseif ($student->participant_confirm_count == 0)
                    <a class="badge bg-warning text-white">Đợi học viên</a>
                    @elseif ($student->confirm_count == 1 & $student->participant_confirm_count == 1)
                    <a class="badge bg-success text-white">Đã xác nhận</a>
                    @endif
                    <a href="{{ route('class.author.cert' , ['itemId' =>  $course['info']->id, 'userId' => $student->id]) }}" class="btn btn-warning btn-sm text-white">Cấp chứng chỉ</a>
                    @if($userServ->isMod())
                    <a href="{{ route('crm.sale' , ['userId' => $student->id]) }}" class="btn btn-info btn-sm text-white">Sale</a>
                    @endif
                </td>
            </tr>
            @endforeach
        </table>
        @else
        <p>@lang('Chưa có học viên nào đăng ký')</p>
        @endif
    </div>
</div>
