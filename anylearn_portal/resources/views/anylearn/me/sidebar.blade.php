@inject('userService', 'App\Services\UserServices')
<!-- Sidebar -->
@php(
$route = app('router')->getRoutes()->match(app('request'))->getName()
)
@php($role = Auth::user()->role)
<ul class="navbar-nav sidebar sidebar-dark accordion d-print-none shadow rounded me-4 pt-4" style="background-color: #00a551" id="accordionSidebar">
    @if (Auth::user()->role == 'school' || Auth::user()->role == 'teacher')
    <li class="nav-item {{ in_array($route, ['me.dashboard']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.dashboard') }}" data-spm="nav.dashboard">
            <i class="fas fa-fw fa-chart-area"></i>
            <span>@lang('TỔNG QUAN')</span></a>
    </li>
    <div class="sidebar-heading">
        @lang('Chức năng đối tác')
    </div>
    {{-- <li class="nav-item {{ in_array($route, ['me.admitstudent']) ? 'active' : '' }}">
    <a class="nav-link" href="{{ route('me.admitstudent') }}" data-spm="nav.class">
        <i class="fas fa-user-shield"></i>
        <span>@lang('Tiếp nhận học viên')</span></a>
    </li> --}}

    <li class="nav-item {{ in_array($route, [
                'helpcenter.parnter.index',
                'me.transactionhistory',
                'me.class',
                'me.class.create',
                'me.class.edit',
                'me.introduce',
            ]) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.class') }}">
            <i class="fas fa-university"></i>
            <span>@lang('Tuyển sinh / Lớp học')</span></a>
    </li>
    <li class="nav-item {{ in_array($route, ['me.withdraw']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.withdraw') }}">
            <i class="fas fa-user-shield"></i>
            <span>@lang('Giao dịch tiền')</span></a>
    </li>
    <li class="nav-item {{ in_array($route,['location', 'location.create', 'location.edit']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('location') }}">
            <i class="fas fa-fw fa-map"></i>
            <span>Chi Nhánh</span>
        </a>
    </li>
    <li class="nav-item {{ in_array($route, ['me.contract']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.contract') }}">
        <i class="fas fa-certificate"></i>
            <span>Hợp Đồng / Chứng Chỉ</span>
        </a>
    </li>


    <li class="nav-item">
        <a class="nav-link" href="{{ route('helpcenter.parnter.index') }}" target="_blank">
            <i class="fas fa-fw fa-headset"></i>
            <span>@lang('Trung tâm hỗ trợ')</span></a>
    </li>
    <hr class="sidebar-divider d-none d-md-block text-secondary">
    @endif
    <div class="sidebar-heading">
        @lang('Chức năng người dùng')
    </div>
    <li class="nav-item {{ in_array($route, ['me.profile']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.profile') }}">
            <i class="fas fa-user-edit"></i>
            <span>@lang('Thông tin người dùng')</span></a>
    </li>
    <li class="nav-item {{ in_array($route, ['me.orders', 'me.orders.schedule']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.orders') }}">
            <i class="fas fa-calendar"></i>
            <span>@lang('Khoá học đã đăng ký')</span></a>
    </li>
    <li class="nav-item {{ in_array($route, ['me.child', 'me.friend', 'me.resetpassword']) ? 'active' : '' }}">
        <a class="nav-link" data-bs-toggle="collapse" data-bs-target="#general-collapse" aria-expanded="false">
            <i class="fas fa-fw fa-book"></i>
            <span>@lang('Tính năng cơ bản')</span>
        </a>
        <div class="collapse {{ in_array($route, ['me.child', 'me.friend', 'me.resetpassword']) ? 'show' : '' }}" id="general-collapse" style="">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ in_array($route, ['me.child']) ? 'active' : '' }}" href="{{ route('me.child') }}">
                    <i class="fas fa-fw fa-child"></i>
                    <span>@lang('Tài khoản con')</span></a>
                </a>
                <a class="collapse-item {{ in_array($route, ['me.friend']) ? 'active' : '' }}" href="{{ route('me.friend') }}">
                    <i class="fas fa-fw fa-user-friends"></i>
                    <span>@lang('Danh sách bạn bè')</span></a>
                </a>
                <a class="collapse-item {{ in_array($route, ['me.resetpassword']) ? 'active' : '' }}" href="{{ route('me.resetpassword') }}">
                    <i class="fas fa-fw fa-lock"></i>
                    <span>@lang('Đổi mật khẩu')</span></a>
                </a>
                <a class="collapse-item " href="https://www.facebook.com/anylearnhockhonggioihan" target="_blank">
                    <i class="fas fa-fw fa-comment-dots"></i>
                    <span>@lang('Cộng đồng')</span></a>
                </a>
            </div>
        </div>
    </li>
    <li class="nav-item {{ in_array($route, [ 'me.courseconfirm', 'me.pendingorders', 'me.history', 'me.order.return']) ? 'active' : '' }}">
        <a class="nav-link" data-bs-toggle="collapse" data-bs-target="#couser-collapse" aria-expanded="false">
            <i class="fas fa-fw fa-book"></i>
            <span>@lang('Đơn hàng / Giao dịch')</span>
        </a>
        <div class="collapse {{ in_array($route, ['me.courseconfirm', 'me.pendingorders', 'me.history', 'me.order.return']) ? 'show' : '' }}" id="couser-collapse" style="">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ in_array($route, ['me.courseconfirm']) ? 'active' : '' }}" href="{{ route('me.courseconfirm') }}">
                    <i class="fas fa-fw fa-calendar"></i>
                    <span>@lang('Xác nhận khóa học')</span></a>
                </a>
                <a class="collapse-item {{ in_array($route, ['me.pendingorders']) ? 'active' : '' }}" href="{{ route('me.pendingorders') }}">
                    <i class="fas fa-fw fa-shopping-cart"></i>
                    <span>@lang('Chờ thanh toán')</span></a>
                </a>
                <a class="collapse-item {{ in_array($route, ['me.order.return']) ? 'active' : '' }}" href="{{ route('me.order.return') }}">
                    <i class="fas fa-fw fas fa-undo"></i>
                    <span>@lang('Hoàn trả đơn hàng')</span></a>
                </a>
                <a class="collapse-item {{ in_array($route, ['me.history']) ? 'active' : '' }}" href="{{ route('me.history') }}">
                    <i class="fas fa-fw fa-wallet"></i>
                    <span>@lang('Lịch sử Giao dịch')</span></a>
                </a>
            </div>
        </div>
    </li>

    <!-- Sidebar Toggler (Sidebar) -->
    <div class="text-center d-none d-md-inline">
        <button class="rounded-circle border-0" id="sidebarToggle"></button>
    </div>
</ul>
<!-- End of Sidebar -->