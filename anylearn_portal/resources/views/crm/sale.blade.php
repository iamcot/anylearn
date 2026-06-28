@inject('userServ', 'App\Services\UserServices')
@inject('itemServ', 'App\Services\ItemServices')
@inject('transServ', 'App\Services\TransactionService')

@extends('layout')

@section('body')
    <div class="row crm mb-5">
        <div class="col-lg-6">
            <div class="card shadow">
                <div class="card-body">
                    <form action="{{ route('crm.change-priority', ['userId' => $memberProfile->id]) }}">
                    <div class="row">
                        <div class="col-sm-2">
                            <div class="imagebox border">
                                @if ($memberProfile->image)
                                    <img src="{{ $memberProfile->image }}" class="rounded" alt="{{ $memberProfile->name }}">
                                @else
                                    <i class="fa fa-user fa-2x"></i>
                                @endif
                            </div>
                        </div>
                        <div class="col-sm-10">
                            <h5 class="w-100 d-flex flex-row justify-content-between">
                                <div class="d-flex">
                                    <div class="d-flex flex-column justify-content-center"><span class="text-dark">{{ $memberProfile->name }}</span></div>
                                    <div class="ml-2">
                                        <select name="priority" style="
                                            outline: none;
                                            text-align: center;
                                            padding: 2px 4px; 
                                            font-size: 12px; 
                                            font-weight: bold;
                                            color: {{ $memberProfile->sale_priority == 0 || $memberProfile->sale_priority == 3 ? '#555 ': '#fff' }};
                                            border: 1px solid {{ $memberProfile->sale_priority == 0 ? '#ccc' : $priorityColors[$memberProfile->sale_priority]}}; 
                                            border-radius: 5px; 
                                            background: {{ $priorityColors[$memberProfile->sale_priority] }}">
                                            @foreach($priorityUsers as $key => $prio)
                                                <option value="{{ $key }}" {{ (!empty($user) && !empty($priorityLevels[$key]) && $memberProfile->sale_priority == $key) ? "selected" : "" }}>{{ $prio }}</option>
                                            @endforeach
                                        </select>    
                                    </div>
                                </div>
                                <div>
                                    <span> ID: {{ $memberProfile->id }}</span>
                                    <a class="ml-2 phonecall" href="#" data-phone="{{ $memberProfile->phone }}"
                                        title="{{ $memberProfile->phone }}"><i class="fa fa-phone"></i>
                                    </a>
                                </div>
                            </h5>
                            <div>Thành viên từ:
                                {{ $memberProfile->is_registered == 0 ? 'Chưa đăng ký' : date('d/m/Y', strtotime($memberProfile->created_at)) }}
                            </div>
                            <div>anyPoint: <strong
                                    class="text-danger">{{ number_format($memberProfile->wallet_c, 0, ',', '.') }}</strong>
                            </div>
                            <div class="w-100 d-flex flex-row justify-content-end">
                                <button class="btn btn-sm btn-primary" name="action" value="btnSalePrio">Lưu thay đổi</button>
                            </div>
                        </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="card shadow mt-3">
                <div class="card-header"><strong>Các tài khoản con</strong></div>
                <div class="card-body p-0">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>#ID</th>
                                <th>Tên</th>
                                <th>Ngày Sinh</th>
                                <th>Giới Tính</th>
                                <th>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>

                            @foreach ($accountC as $row)
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
                                            <button class="btn btn-sm btn-info" name="action" value="history">
                                                Xem đơn hàng
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

            <div class="card shadow mt-3">
                <div class="card-header"><strong>Thông tin liên lạc</strong></div>
                <div class="card-body">
                    <dl class="row">
                        <dd class="col-sm-3">Địa chỉ</dd>
                        <dt class="col-sm-8">{{ $memberProfile->address }}</dt>
                        <dd class="col-sm-3">SDT</dd>
                        <dt class="col-sm-8">{{ $memberProfile->phone }} <a class="ml-2 phonecall" href="#"
                                data-phone="{{ $memberProfile->phone }}" title="{{ $memberProfile->phone }}"><i
                                    class="fa fa-phone"></i></a></dt>
                        <dd class="col-sm-3">Email</dd>
                        <dt class="col-sm-8">{{ $memberProfile->email }} <a class="ml-2"
                                href="mailto:{{ $memberProfile->email }}"><i class="fa fa-envelope"></i></a></dt>
                    </dl>
                </div>
            </div>
            <form action="{{ route('crm.save-note') }}" method="POST">
                @csrf
                <input type="hidden" name="salenote[memberId]" value="{{ $memberProfile->id }}">
                <div class="card shadow mt-3">
                    <div class="card-header"><strong>Ghi chú</strong> <i>(Cập nhật cuối:
                            {{ $lastNote ? date('H:i d/m/y', strtotime($lastNote->created_at)) : '' }})</i> <button
                            name="action" value="save-note" class="btn btn-success btn-sm float-right"><i
                                class="fa fa-save"></i></button></div>
                    <div class="card-body p-0">
                        <textarea name="salenote[note]" id="" class="form-control" rows="4" required>{{ $lastNote ? $lastNote->content : '' }}</textarea>
                    </div>
                </div>

        </div>
        <div class="col-lg-6">
            <div class="card shadow">
                <div class="card-header"><strong>Lịch sử liên hệ</strong>
                    <a id="add-chat" class="btn btn-success btn-sm float-right ml-2" title="Thêm chat mới"><i
                            class="fas fa-comment-medical text-white"></i></a>
                    <a id="add-call" class="btn btn-success btn-sm float-right" title="Thêm call mới"><i
                            class="fas fa-phone text-white"></i></a>
                </div>
                <div class="card-body p-0">
                    @if (count($contactHistory) > 0)
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Thời gian</th>
                                    <th>Loại</th>
                                    <th>Thời lượng (giây)</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($contactHistory as $contact)
                                    <tr>
                                        <td>
                                            <a href="{{ route('crm.activity.del', ['id' => $contact->id]) }}"><i
                                                    class="fa fa-trash text-danger"></i></a>
                                            {{ date('H:i d/m/y', strtotime($contact->created_at)) }}
                                        </td>
                                        <td><i class="fa fa-{{ $contact->type == 'call' ? 'phone' : 'comment' }}"></i>
                                        </td>
                                        <td class="text-center">{{ $contact->logwork }}</td>
                                        <td>
                                            <a href="#" class="btn btn-warning btn-sm activity-content-view"
                                                data-id="{{ $contact->id }}">XEM</a>
                                        </td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @else
                        <p class="p-3">Chưa có liên hệ nào với khách này. Sao dợ ?</p>
                    @endif
                </div>
            </div>

            <div class="card shadow mt-3">
                <div class="card-header">
                    <strong>Lịch sử đặt hàng
                        @if ($idC != null)
                            (Đang lọc theo tài khoản con có mã: {{ $idC }})
                        @endif
                    </strong>
                    @if ($idC != null)
                        <a href="{{ route('crm.sale', ['userId' => $memberProfile->id]) }}"
                            class="btn btn-sm btn-secondary mt-1 float-right">
                            <i class="fas fa-sync"></i>
                        </a>
                    @endif
                </div>
                <div class="card-body p-0">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>#Mã</th>
                                <th>Khóa học</th>
                                <th>Giá</th>
                                <th>Ngày</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            @if ($memberOrders->isEmpty())
                            @else
                                @foreach ($memberOrders as $item)
                                    <tr>
                                        <td>{{ $item->order_id }}</td>
                                        <td><a target="_blank"
                                                href="{{ $itemServ->classUrl($item->itemId) }}">{{ $item->title }}</a>
                                        </td>
                                        <td>{{ number_format($item->unit_price, 0, ',', '.') }}</td>
                                        <td>{{ date('H:i d/m/Y', strtotime($item->created_at)) }}</td>
                                        <td>{{ $item->status }}</td>
                                    </tr>
                                @endforeach
                            @endif

                        </tbody>
                    </table>
                </div>
                @if ($idC != null)
                    <div class="card-footer"></div>
                @else
                    <div class="card-footer">{{ $memberOrders->appends(request()->query())->links() }}</div>
                @endif

            </div>
            <div class="card shadow mt-3">
            <div class="card-header"><strong>Lịch sử nhận điểm thưởng</strong></div>
            <div class="card-body p-0">
                <table class="table">
                    <thead>
                        <tr>
                            <th>STT</th>
                            <th>Thông tin</th>
                            <th>Điểm</th>
                            <th>Status</th>
                            <th>Ngày nhận</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach ($points as $value)
                            <tr>
                                <td class="text-center">{{ $value->id }}</td>
                                <td>{{ $value->content }}</td>
                                <td>{{ $value->amount }}</td>
                                <td class="text-{{ $transServ->statusColor( $value->status ) }}">{{ $transServ->statusText( $value->status )  }}</td>
                                <td>{{ date('H:i d/m/Y', strtotime($value->created_at)) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>
        </div>
        </div>

        
    </div>
@endsection
@include('dialog.crm_sale_add_call')
@include('dialog.crm_sale_add_chat')
@include('dialog.crm_activity_content')
@section('jscript')
    @parent
    <script src="/cdn/vendor/jquery/jquery.mask.js"></script>
    <script>
        $('#add-chat').click(function() {
            $('#saleAddChatModal').modal('show');
            $('.time').mask('00:00');
        });
        $('#add-call').click(function() {
            $('#saleAddCallModal').modal('show');
            $('.time').mask('00:00');
        });
        $('.activity-content-view').click(function() {
            var id = $(this).data("id");
            $('#activityContentModalBody').load("/admin/crm/activity/" + id);
            $('#activityContentModal').modal('show');
        });
    </script>
    <script omi-sdk type="text/javascript" src="https://cdn.omicrm.com/sdk/2.0.0/sdk.min.js"></script>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
            // Ví dụ về một số config có thể dùng khi init SDK
            let config = {
                theme: 'default',
                options: {
                    hideCallButton: true
                },
                callbacks: {
                    register: (data) => {
                        // Sự kiện xảy ra khi trạng thái kết nối tổng đài thay đổi
                        console.log('register:', data);
                    },
                    connecting: (data) => {
                        // Sự kiện xảy ra khi bắt đầu thực hiện cuộc gọi ra
                        console.log('connecting:', data);
                    },
                    invite: (data) => {
                        // Sự kiện xảy ra khi có cuộc gọi tới
                        console.log('invite:', data);
                    },
                    inviteRejected: (data) => {
                        // Sự kiện xảy ra khi có cuộc gọi tới, nhưng bị tự động từ chối
                        // trong khi đang diễn ra một cuộc gọi khác
                        console.log('inviteRejected:', data);
                    },
                    ringing: (data) => {
                        // Sự kiện xảy ra khi cuộc gọi ra bắt đầu đổ chuông
                        console.log('ringing:', data);
                    },
                    accepted: (data) => {
                        // Sự kiện xảy ra khi cuộc gọi vừa được chấp nhận
                        console.log('accepted:', data);
                    },
                    incall: (data) => {
                        // Sự kiện xảy ra mỗi 1 giây sau khi cuộc gọi đã được chấp nhận
                        console.log('incall:', data);
                    },
                    acceptedByOther: (data) => {
                        // Sự kiện dùng để kiểm tra xem cuộc gọi bị kết thúc
                        // đã được chấp nhận ở thiết bị khác hay không
                        console.log('acceptedByOther:', data);
                    },
                    ended: (data) => {
                        // Sự kiện xảy ra khi cuộc gọi kết thúc
                        console.log('ended:', data);
                        if (data.isAccepted && data.duration > 0) {
                            $.ajax({
                                url: "{{ route('crm.save-call') }}" +
                                    "?action=save-call&member_id={{ $memberProfile->id }}&isajax=1&logwork=" +
                                    data.duration + "&uuid=" + data.uuid,
                                context: document.body
                            }).done(function() {
                                console.log("update call");
                            });
                        } else {
                            console.log("no pick up");
                        }
                    },
                    holdChanged: (status) => {
                        // Sự kiện xảy ra khi trạng thái giữ cuộc gọi thay đổi
                        console.log('on hold:', status);
                    },
                    saveCallInfo: (data) => {
                        // let { callId, note, ...formData } = data;
                        // Sự kiện xảy ra khi cuộc gọi đã có đổ chuông hoặc cuộc gọi tới, khi user có nhập note input mặc định hoặc form input custom
                        console.log('on save call info:', data);
                    },
                }
            };
            omiSDK.init(config, () => {
                omiSDK.register({
                    domain: 'infoanylearn',
                    username: '{{ $user->omicall_id }}', // tương đương trường "sip_user" trong thông tin số nội bộ
                    password: '{{ $user->omicall_pwd }}'
                });
            });
        });

        $(".phonecall").click(function() {
            var phone = $(this).data('phone');
            omiSDK.makeCall(phone);
        });
    </script>
@endsection
