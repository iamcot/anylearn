@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')

@extends('anylearn.me.layout')
@section('spmb')
orders
@endsection
@section('body')
<div class="row mb-3">
    <div class="col-md-3">
        <input type="text" id="search-course-name" class="form-control" placeholder="Nhập tên khóa học...">
    </div>
    <div class="col-md-3">
        <input type="date" id="search-registration-date" class="form-control" placeholder="Ngày đăng kí...">
    </div>
    <div class="col-md-3">
        <select class="form-select" aria-label="Trạng thái" id="search-status">
            <option value="all" selected>Chọn trạng thái</option>
            <option value="1">Đang mở</option>
            <option value="99">Đã xong</option>
        </select>
    </div>
    <div class="col-md-3">
        <select class="form-select" aria-label="Tài khoản học" id="search-user-account">
            <option value="all" selected>Chọn tài khoản</option>
            @foreach ($userServ->accountC(auth()->user()->id) as $row)
            <option value="{{ $row->name }}">{{ $row->name }}</option>
            @endforeach
        </select>
    </div>
</div>
<div class="card shadow">
    <div class="card-body p-0">
        <table class="table table-striped text-black table-hover" id="myTable">
            <thead>
                <tr class=" text-secondary ">
                    <th>Tên khóa học</th>
                    <th>Ngày đăng kí</th>
                    <th>Trạng thái</th>
                    <th>Tài khoản học</th>
                    <th>Thao tác</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                @foreach ($data as $row)
                <tr>
                    <td width="40%">{{ $row->title }}</td>
                    <td>{{ date("H:i d/m/Y", strtotime($row->created_at)) }}</td>
                    @if ($row->user_status == 1)
                    <td>Đang mở</td>
                    @else
                    <td>Đã xong</td>
                    @endif
                    <td>{{ $row->child_name }}</td>
                    <td><a class="btn btn-sm btn-success" href="{{ route('me.orders.schedule', ['id' => $row->id]) }}">
                            @if($row->item_subtype == 'digital')
                                Lấy mã code
                            @else
                                Xem kế hoạch học tập
                            @endif
                        </a></td>
                    <td></td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>
@endsection
@section('jscript')
@parent
<script>
    const searchCourseName = document.querySelector('#search-course-name');
    const searchRegistrationDate = document.querySelector('#search-registration-date');
    const searchStatus = document.querySelector('#search-status');
    const searchUserAccount = document.querySelector('#search-user-account');

    searchCourseName.addEventListener('input', handleFilter);
    searchRegistrationDate.addEventListener('input', handleFilter);
    searchStatus.addEventListener('change', handleFilter);
    searchUserAccount.addEventListener('change', handleFilter);

    // console.log(searchCourseName, searchRegistrationDate, searchStatus, searchUserAccount);

    function handleFilter() {

        const courseName = searchCourseName.value.toLowerCase();
        const registrationDate = searchRegistrationDate.value.toLowerCase();
        const status = searchStatus.value;
        const userAccount = searchUserAccount.value.toLowerCase();
        const courses = JSON.parse('<?php echo json_encode($data); ?>');
        console.log(courses);

        // Lọc các khóa học phù hợp với các tiêu chí tìm kiếm
        const filteredCourses = courses.filter(course => {
            const name = course.title.toLowerCase();
            const date = course.date.toLowerCase();
            const courseStatus = course.user_status;
            const user = course.name.toLowerCase();
            const toDate = new Date(); // ngày hiện tại
            // console.log(courseStatus == status);
            if (
                (name.includes(courseName)) &&
                (date.includes(registrationDate) || registrationDate == null) &&
                (status === 'all' || courseStatus == status) &&
                (user === userAccount || userAccount === 'all')
            ) {
                return true;
            }
            return false;
        });

        // Hiển thị danh sách khóa học đã lọc
        filtable(filteredCourses);
    }

    function filtable(courses) {
        const tableBody = document.querySelector('#myTable tbody');
        tableBody.innerHTML = '';
        const statusText = {
            1: 'Đang mở',
            99: 'Đã xong'
        };
        for (const course of courses) {

            const tableRow = document.createElement('tr');

            const nameColumn = document.createElement('td');
            nameColumn.textContent = course.title;
            nameColumn.style.width = '40%';
            tableRow.appendChild(nameColumn);

            const dateColumn = document.createElement('td');
            dateColumn.textContent = course.date;
            tableRow.appendChild(dateColumn);

            const statusColumn = document.createElement('td');
            statusColumn.textContent = statusText[course.user_status];
            tableRow.appendChild(statusColumn);

            const userColumn = document.createElement('td');
            userColumn.textContent = course.name;
            tableRow.appendChild(userColumn);

            // tạo ra tag a
            const scheduleLink = document.createElement('a');
            // thêm href // course.item_id = row->item_id
            scheduleLink.href = "/me/orders/schedule?id=" + course.item_id;
            scheduleLink.textContent = "Xem";
            // tạo td và add tag a
            const scheduleColumn = document.createElement('td');
            scheduleColumn.appendChild(scheduleLink);
            tableRow.appendChild(scheduleColumn);

            tableBody.appendChild(tableRow);
        }
    }
</script>
@endsection