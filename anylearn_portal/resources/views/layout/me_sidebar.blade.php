@inject('userService', 'App\Services\UserServices')
<!-- Sidebar -->
@php ( $route = app('router')->getRoutes()->match(app('request'))->getName() )
<ul class="navbar-nav bg-gradient-{{ env('MAIN_COLOR', 'primary') }} sidebar sidebar-dark accordion d-print-none" id="accordionSidebar">
    <!-- Sidebar - Brand -->
    <a class="sidebar-brand d-flex align-items-center justify-content-center" href="{{ route('me.dashboard') }}">
        <div class="sidebar-brand-icon rotate-n-15">
            <i class="fas fa-book-open"></i>
            <!-- <i class="fas fa-gem"></i> -->
        </div>
        <div class="sidebar-brand-text mx-3">{{ env('APP_NAME') }}</div>
    </a>
    <hr class="sidebar-divider d-none d-md-block">
    <li class="nav-item {{ in_array($route, ['me.class', 'me.class.create', 'me.class.edit']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.class') }}">
            <i class="fas fa-fw fa-university"></i>
            <span>@lang('Quản lý Lớp học')</span></a>
    </li>
    <li class="nav-item {{ in_array($route, ['location', 'location.create', 'location.edit']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('location') }}">
            <i class="fas fa-fw fa-map-marker"></i>
            <span>@lang('Sổ địa chỉ/Chi nhánh')</span></a>
    </li>
    <li class="nav-item {{ $route == 'me.edit' ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('me.edit') }}">
            <i class="fas fa-fw fa-user-edit"></i>
            <span>@lang('Chỉnh sửa Thông tin')</span></a>
    </li>
    <!-- Sidebar Toggler (Sidebar) -->
    <div class="text-center d-none d-md-inline">
        <button class="rounded-circle border-0" id="sidebarToggle"></button>
    </div>
</ul>
<!-- End of Sidebar -->