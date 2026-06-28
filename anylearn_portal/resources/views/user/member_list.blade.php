@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('rightFixedTop')
    <div class="col-xs-2 mr-1">
        <a class="btn btn-success btn-sm border-0 rounded-pill" href="{{ route('user.members.add') }}"><i class="fas fa-plus">
            </i> <span class="mobile-no-text"> @lang('Thêm mới')</span></a>
    </div>
@endsection

@section('body')
<form>
    <div class="card shadow mb-2">
        <div class="card-body row">
            <div class="col-xs-6 col-lg-4 ">
                <div class="form-group row">
                    <label class="col-12" for="">ID(s) <span class="small">Để trống đến ID nếu chỉ tìm 1</span></label>
                    <div class="col-lg-6 mb-1">
                        <input value="{{ app('request')->input('id_f') }}" type="text" class="form-control" name="id_f" placeholder="từ ID " />
                    </div>
                    <div class="col-lg-6">
                        <input value="{{ app('request')->input('id_t') }}" type="text" class="form-control" name="id_t" placeholder="đến ID" />
                    </div>
                </div>

            </div>
            <div class="col-xs-6 col-lg-4">
                <div class="form-group">
                    <label for="">Tên thành viên</label>
                    <input value="{{ app('request')->input('name') }}" type="text" class="form-control" name="name" placeholder="Tên thành viên" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">Vai trò</label>
                    <select class="form-control" name="role" id="">
                        <option value="">---</option>
                        <option {{ app('request')->input('role') == 'member' ? 'selected' : '' }} value="member">Thành viên</option>
                        <option {{ app('request')->input('role') == 'school' ? 'selected' : '' }} value="school">Trung tâm</option>
                        <option {{ app('request')->input('role') == 'teacher' ? 'selected' : '' }} value="teacher">Chuyên gia</option>
                    </select>
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">Sale Id</label>
                    <input value="{{ app('request')->input('sale_id') }}" type="text" class="form-control" name="sale_id" placeholder="Sale Id" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">SDT</label>
                    <input value="{{ app('request')->input('phone') }}" type="text" class="form-control" name="phone" placeholder="SDT" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">ID Người giới thiệu</label>
                    <input value="{{ app('request')->input('ref_id') }}" type="text" class="form-control" name="ref_id" placeholder="ID người giới thiệu" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">Thời gian tạo từ</label>
                    <input value="{{ app('request')->input('date') }}" type="date" class="form-control" name="date" placeholder="Thời gian tạo" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">Thời gian tạo đến</label>
                    <input value="{{ app('request')->input('datet') }}" type="date" class="form-control" name="datet" placeholder="Thời gian tạo đến" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">Ngày Liên Hệ</label>
                    <input value="{{ app('request')->input('adate') }}" type="date" class="form-control" name="adate" placeholder="Ngày liên hệ" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">Độ ưu tiên</label>
                    <select name="sale_priority" id="sale_priority" class="form-control">
                        <option value="">---</option>
                        @foreach($priorityUsers as $key => $prio)
                            <option value="{{ $key }}" {{ null != Request::get('sale_priority') && Request::get('sale_priority') == $key ? "selected" : "" }}>
                                {{ $prio }}
                            </option>
                        @endforeach
                    </select>
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">Đơn hàng cuối từ</label>
                    <input value="{{ app('request')->input('dateo') }}" type="date" class="form-control" name="dateo" placeholder="Đơn hàng cuối từ" />
                </div>
            </div>
            <div class="col-xs-6 col-lg-2">
                <div class="form-group">
                    <label for="">Đơn hàng cuối đến</label>
                    <input value="{{ app('request')->input('datelo') }}" type="date" class="form-control" name="datelo" placeholder="Đơn hàng cuối đến" />
                </div>
            </div>
        </div>
        <div class="card-footer">
            <button class="btn btn-primary btn-sm" name="action" value="search"><i class="fas fa-search"></i> Tìm kiếm</button>
            @if (auth()->user()->role != 'sale')
            <button class="btn btn-success btn-sm" name="action" value="file"><i class="fas fa-file"></i> Xuất file</button>
            @endif
            <button class="btn btn-warning btn-sm" name="action" value="clear"> Xóa tìm kiếm</button>
        </div>
    </div>
</form>
@if(!$isSale)
<form method="post" enctype="multipart/form-data">
    @csrf
    <div class="card shadow mb-3">
        <div class="card-header">Phân khách cho sale
            <a href="/cdn/anylearn/example_saleassign.csv" download>File mẫu</a>

        </div>
        <div class="card-body">
            <div>
                <input type="file" name="saleassign" class="">
                <button class="btn btn-success btn-sm" name="action" value="saleassign">Tải lên</button>
            </div>
        </div>
    </div>
</form>
@endif
<div class="card shadow">
    <div class="card-header">
        Tổng tìm kiếm: <strong class="text-danger">{{ $members->total() }}</strong>, 
        @if(!$isSale)
        Tổng anyPoint: <strong class="text-danger">{{ $members->sumC }}</strong>
        @endif
    </div>
    <div class="card-body p-0 table-responsive">
        <table class="table table-striped table-hover table-bordered">
            <thead>
                <tr>
                    <th class="text-center" width="5%" scope="col">#ID</th>
                    <th class="text-center" width="5%" scope="col">Thao tác</th>
                    <th class="text-center">Liên hệ</th>
                    @if(!$isSale)
                    <th class="text-center">Hot</th>
                    <!-- <th class="text-center">Boost</th> -->
                    @endif
                    <th width="10%" scope="col">Vai trò</th>
                    <th width="15%" scope="col">Họ tên</th>
                    <th width="5%" scope="col">SDT</th>
                    <th width="5%" scope="col">Email</th>
                    <!-- <th width="10%" scope="col">Address</th> -->
                    <th><a href="{{ request()->fullUrlWithQuery(['sort' => 'wallet_c'])  }}">Ví C  <i class="fas fa-sort"></i></a></th>
                    <th width="10%" scope="col">Người G/T</th>
                    <th width="5%" scope="col">H/H</th>
                    <th class="text-center" width="5%" scope="col">C/T</th>
                    <th class="text-center">Cập nhật</th>
                </tr>
            </thead>
            <tbody>
                @if(!empty($members))
                @foreach($members as $user)
                <tr>
                    <th class="text-center" scope="row">{{ $user->id }}</th>

                    <td class="text-right">
                        @if($user->id != 1)
                        @if(!$userServ->isSale())
                        {!! $userServ->statusOperation($user->id, $user->status) !!}
                        <a class="btn btn-sm btn-info mt-1" href="{{ route('user.members.edit', ['userId' => $user->id]) }}"><i class="fas fa-edit"></i> Sửa</a>
                        @endif
                        @endif
                        <a target="_blank" class="btn btn-sm btn-success mt-1" href="{{ route('crm.sale', ['userId' => $user->id]) }}"><i class="fas fa-briefcase"></i> Sale</a>
                    </td>
                    <td>
                        {{ $user->last_contact ? date('d/m/y', strtotime($user->last_contact)) : "" }}
                        {!! $user->last_note ? "<br>" . $user->last_note : "" !!}
                    </td>

                    @if(!$isSale)
                    <td class="text-center"><a href="{{ route('ajax.touch.ishot', ['table' => 'users', 'id' =>  $user->id ]) }}">{!! $userServ->hotIcon($user->is_hot) !!}</a></td>
                    <!-- <td>{{ $user->boost_score }}</td> -->
                    @endif
                    <td><a target="_blank" href="{{ route('class') }}?ref_id={{ $user->id }}">{{ $user->role }}</a></td>
                    <td>{!! $userServ->statusIcon($user->status) !!} {{ $user->name }}</td>
                    <td>
                        <span style="
                            padding: 0 6px; 
                            font-size: 12px; 
                            font-weight: bold;
                            color: {{ $user->sale_priority == 0 || $user->sale_priority == 3 ? '#555 ': '#fff' }};
                            border: 1px solid {{ $user->sale_priority == 0 ? '#eee' : 'transparent' }}; 
                            border-radius: 5px; 
                            background: {{ $priorityColors[$user->sale_priority] }}">
                            {{ $priorityLevels[$user->sale_priority] }}</span>
                        {{ $user->phone }} {{ $user->is_registered == 0 ? "(Chưa đăng ký)" : ""}}
                    </td>
                    <td>{{ $user->email }}</td>
                    <!-- <td>{{ $user->address }}</td> -->
                    <td>{{ number_format($user->wallet_c) }}</td>
                    <td>@if($user->refname) <a href="?ref_id={{ $user->refid }}">{{ $user->refname . ' (' . $user->refphone . ')'  }} </a>@endif</td>
                    <td>{{ $user->commission_rate * 100 }}%</td>
                    <td class="text-center">{!! $userServ->requiredDocIcon($user) !!}</td>
                    <td class="text-center">{{ date('H:i d/m/y', strtotime($user->updated_at)) }}</td>
                </tr>
                @endforeach
                @endif
            </tbody>
        </table>
        <div class="small ml-3">
            <p><i class="fas fa-fire text-danger" title="Nổi bật"></i> Thành viên nổi bật. <i class="fas fa-check-circle text-success"></i> Thành viên đang hoạt động. <i class="fas fa-stop-circle text-danger"></i> Thành viên đang bị khóa.
                <i class="fas fa-cloud-upload-alt text-gray"></i> Giấy tờ chưa hợp lệ. <i class="fas fa-cloud-upload-alt text-success"></i> Đã cập nhật chứng chỉ, giấy tờ >>> Click để xem chi tiết.

            </p>
        </div>

    </div>
    <div class="card-footer">
        <div>{{ $members->appends(request()->query())->links() }}</div>
    </div>
</div>
@include('dialog.user_doc')
@endsection
