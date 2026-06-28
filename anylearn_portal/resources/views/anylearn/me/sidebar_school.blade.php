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
            <span>@lang('Tổng quan')</span></a>
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
    <hr class="sidebar-divider d-none d-md-block text-secondary">
    @endif
    <div class="sidebar-heading">
        @lang('Chức năng cơ bản')
    </div>
    <li class="nav-item {{ in_array($route, ['me.profile', 'me.edit']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.profile') }}">
            <i class="fas fa-user-edit"></i>
            <span>@lang('Thông tin')</span></a>
    </li>
    <li class="nav-item {{ in_array($route, ['me.resetpassword']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.resetpassword') }}">
            <i class="fas fa-fw fa-lock"></i>
            <span>@lang('Đổi mật khẩu')</span></a>
    </li>
    <li class="nav-item">
        <a class="nav-link" href="{{ route('helpcenter.parnter.index') }}" target="_blank">
            <i class="fas fa-fw fa-headset"></i>
            <span>@lang('Trung tâm hỗ trợ')</span></a>
    </li>

    <!-- Sidebar Toggler (Sidebar) -->
    <div class="text-center d-none d-md-inline">
        <button class="rounded-circle border-0" id="sidebarToggle"></button>
    </div>
</ul>
<!-- End of Sidebar -->