@inject('UserServices', 'App\Services\UserServices')

<nav class="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow d-print-none">
    <div class="container-fluid">
        @if (Auth::user()->role == 'school' || Auth::user()->role == 'teacher')
        <a class="navbar-brand ml-5" href="{{ route('me.dashboard') }}">
            <img src="/cdn/img/logo.png" alt="" width="30" height="30" class="d-block d-sm-none">
            <img src="/cdn/img/logo-full.png" alt="" width="120" height="30" class="d-none d-sm-block">
        </a>
        @else
        <a class="navbar-brand ml-5" href="/">
            <img src="/cdn/img/logo.png" alt="" width="30" height="30" class="d-block d-sm-none">
            <img src="/cdn/img/logo-full.png" alt="" width="120" height="30" class="d-none d-sm-block">
        </a>
        @endif

        <!-- Sidebar Toggle (Topbar) -->
        <button id="sidebarToggleTop" class="btn btn-link d-md-none rounded-circle mr-3">
            <i class="fa fa-bars"></i>
        </button>
        <!-- Topbar Navbar -->
        <ul class="navbar-nav ml-auto">
            <li class="nav-item">
                <div class="float-right nav-link">
                    @yield('rightFixedTop')
                </div>
            </li>

            <li class="nav-item d-none d-md-inline">
                <a class="nav-link" href="#">
                    @if (Auth::user()->image)
                        <span class=""><img class="img-fluid border rounded-circle float-end"
                                style="height:32px;width:32px;" src="{{ Auth::user()->image }}" alt=""></span>
                    @endif
                    <span class="ms-2 text-black small">{{ Auth::user()->name }}</span>
                </a>

            </li>
            <li class="nav-item">
                <a class="nav-link" href="/">
                    <i class="fas fa-home fa-fw mr-2 text-success"></i>
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="{{ route('me.notification') }}">
                    <i class="fas fa-bell fa-fw mr-2 text-success"></i>
                </a>
            </li>
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdownMenuLink" role="button"
                    data-bs-toggle="dropdown" aria-expanded="false">
                    @if (Session::get('locale') == null || Session::get('locale') == 'vi')
                        <span class="locale_flag-vi"></span>
                    @else
                        <span class="locale_flag-en"></span>
                    @endif
                </a>
                <ul class="dropdown-menu" aria-labelledby="navbarDropdownMenuLink">
                    <li><a class="dropdown-item" href="{{ url('/') . '?language=vi' }}">
                            <img src="{{ url('') . '/cdn/img/flag/vn.svg' }}" width="30"> Tiếng Việt</a></li>
                    <li><a class="dropdown-item" href="{{ url('/') . '?language=en' }}">
                            <img src="{{ url('') . '/cdn/img/flag/en.svg' }}" width="30"> English</a></li>
                </ul>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">
                    <i class="fas fa-sign-out-alt fa-fw mr-2  text-danger"></i>
                </a>
            </li>
        </ul>
    </div>
</nav>
<div class="modal fade" id="logoutModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
    aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">@lang('Có chắc bạn buồn đăng xuất?')</h5>
                <button class="close" type="button" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div class="modal-body">@lang('Nhấn "Đăng xuất" để tắt phiên làm việc hiện tại.')</div>
            <div class="modal-footer">
                <form action="{{ route('logout') }}" method="POST">
                    {{ csrf_field() }}
                    <button class="btn btn-danger border-0 rounded-pill" type="submit">@lang('Đăng xuất')</button>
                </form>
            </div>
        </div>
    </div>
</div>
