@inject('userServ', 'App\Services\UserServices')
@extends('anylearn.me.layout')
@section('spmb')
    child
@endsection
@section('body')
    <div class="row crm mb-5">
        <div class="col-lg-6">
            <div class="card shadow">
                <div class="card-body">
                    <div class="row">
                        <div class="col-sm-2">
                            <div class="imagebox border">
                                @if ($user->image)
                                    <img src="{{ $user->image }}" class="rounded" alt="{{ $user->name }}">
                                @else
                                    <i class="fa fa-user fa-2x"></i>
                                @endif
                            </div>
                        </div>
                        <div class="col-sm-9">
                            <h3><span class="text-secondary">{{ $user->name }}</span>
                            </h3>
                            <div>Thành viên từ:
                                {{ $user->is_registered == 0 ? 'Chưa đăng ký' : date('d/m/Y', strtotime($user->created_at)) }}
                            </div>
                            <div>anyPoint: <strong
                                    class="text-danger">{{ number_format($user->wallet_c, 0, ',', '.') }}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card shadow mt-3">
                <div class="card-header"><strong>Các tài khoản con</strong></div>
                <div class="card-body p-0">
                    <table class="table text-secondary" id="mytabel">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Tên</th>
                                <th>Ngày Sinh</th>
                                <th>Giới Tính</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>

                            @foreach ($childuser as $row)
                                <tr>
                                    <td>{{ $row->id }}</td>
                                    <td>{{ $row->name }}</a></td>
                                    <td>{{ $row->dob }}</td>
                                    @if ($row->sex == 'male')
                                        <td>Nam</td>
                                    @else
                                        <td>Nữ</td>
                                    @endif
                                    <form action="" method="get">
                                        <td>
                                            <input type="hidden" name='id' value="{{ $row->id }}">
                                            <a class="btn btn-sm btn-secondary mt-1"
                                                href="{{ route('me.childhistory', ['id' => $row->id]) }}">
                                                <i class="fas fa-info"></i>
                                            </a>
                                            <button type="button" class="btn-edit btn btn-sm btn-primary mt-1 pr-1 pl-1"
                                                onclick="edit()">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                        </td>
                                    </form>
                                </tr>
                            @endforeach
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card shadow mt-3">
                <div class="card-header"><strong>Thống kê đơn hàng</strong></div>
                <div class="card-body">
                    <dl class="row">
                        <dd class="col-sm-8">Tổng giá trị đã đặt</dd>
                        <dt class="col-sm-4">{{ number_format($orderStats['gmv'], 0, ',', '.') }}</dt>
                        <dd class="col-sm-8">Khóa học đã đăng kí thành công</dd>
                        <dt class="col-sm-4">{{ number_format($orderStats['registered'], 0, ',', '.') }}</dt>
                        <dd class="col-sm-8">Khóa học đã hoàn thành</dd>
                        <dt class="col-sm-4">{{ number_format($orderStats['complete'], 0, ',', '.') }}</dt>
                        <dd class="col-sm-8">Giá trị đơn đang chờ thanh toán</dd>
                        <dt class="col-sm-4">{{ number_format($orderStats['pending'], 0, ',', '.') }}</dt>
                        <dd class="col-sm-8">Tổng anyPoint đã dùng</dd>
                        <dt class="col-sm-4">{{ number_format($orderStats['anyPoint'], 0, ',', '.') }}</dt>
                        <dd class="col-sm-8">Tổng giá trị voucher đã dùng</dd>
                        <dt class="col-sm-4">{{ number_format($orderStats['voucher'], 0, ',', '.') }}</dt>
                    </dl>
                </div>
            </div>
        </div>
        <div class="col-lg-6">
            <div class="card shadow">
                <div class="card-header">
                    <strong id="header">Thêm Mới/Cập Nhật Tài Khoản Con
                    </strong>
                </div>
                <div class="card-body">
                    <div class="container">
                        <h1 class="my-4" id="titleform">Thêm tài khoản con</h1>
                        <form>
                            <input type="hidden" id="ID" name="id">
                            <div class="mb-3">
                                <label for="name" class="form-label">Họ tên</label>
                                <input type="text" class="form-control @error('name') is-invalid @enderror"
                                    id="name" name="username" placeholder="Nhập họ tên của tài khoản con" required>
                            </div>
                            {{-- <div class="mb-3">
                                <label for="image" class="form-label">Hình ảnh</label>
                                <input type="file" class="form-control" id="image" name="image">
                            </div> --}}
                            <div class="mb-3">
                                <label for="dob" class="form-label">Ngày sinh</label>
                                <input type="date" class="form-control @error('dob') is-invalid @enderror" id="dob"
                                    name="dob" required>
                            </div>
                            <div class="mb-3">
                                <label for="sex" class="form-label">Giới tính</label>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" value="male" id="male"
                                        name="sex">
                                    <label class="form-check-label" for="sex-male">
                                        Nam
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" value="female" id="female"
                                        name="sex">
                                    <label class="form-check-label" for="sex-female">
                                        Nữ
                                    </label>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="intro" class="form-label">Giới thiệu ngắn</label>
                                <textarea class="form-control" id="intro" name="introduce" rows="3"
                                    placeholder="Viết một vài dòng giới thiệu ngắn về tài khoản con này"></textarea>
                            </div>
                            <button type="Submit" class="btn btn-success float-right" name="create"
                                value="create">@lang('Tạo mới')</button>
                            <button type="reset" id="btn-reset" class="btn btn-secondary float-right mr-2 d-none"
                                onclick="resetForm()">Hủy</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
@endsection
@section('jscript')
    @parent
    <script>
        window.onload = function edit() {
            // Lấy tất cả các nút chỉnh sửa trong bảng
            const editButtons = $('#mytabel .btn-edit');

            // Đặt sự kiện click cho từng nút chỉnh sửa
            editButtons.each(function() {
                $(this).on('click', function() {
                    // Tìm và lấy thông tin từ các ô trong hàng tương ứng
                    const row = $(this).parent().parent();
                    const ma = row.find('td:nth-child(1)').text();
                    const hoTen = row.find('td:nth-child(2)').text();
                    const gioiTinh = row.find('td:nth-child(4)').text();
                    const ngaySinh = row.find('td:nth-child(3)').text();

                    // Gán giá trị cho các trường trong form
                    $('#ID').val(ma);
                    $('#name').val(hoTen);

                    if (gioiTinh == "Nam") {
                        $('input[name="sex"][value="male"]').prop('checked', true);
                    } else {
                        $('input[name="sex"][value="female"]').prop('checked', true);
                    }

                    $('#dob').val(ngaySinh);
                    $('#titleform').text('Sữa tài khoản con');

                    var btn = $('button[name="create"]');
                    btn.html("Cập Nhật");

                    const btnReset = $("#btn-reset");
                    btnReset.removeClass("d-none");
                    $('button[name="create"]').attr('name', 'childedit').attr('value', 'childedit');

                });
            });
        }

        // Hoặc nếu bạn muốn thêm lại lớp d-none sau khi xử lý
        function resetForm() {
            $("#btn-reset").addClass("d-none"); // Thêm lại lớp d-none
            var btn = $('button[name="create"]');
            btn.html("Tạo mới");
            $('#titleform').text('Thêm tài khoản con');
            $('button[name="childedit"]').attr('name', 'create').attr('value', 'create');

        }
    </script>
@endsection
