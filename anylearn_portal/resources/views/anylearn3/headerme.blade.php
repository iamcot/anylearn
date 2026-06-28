@inject('userServ', 'App\Services\UserServices')
<style>
    header {
        background-color: #fff;
        box-shadow: 0 0 12px rgba(0, 0, 0, .08);
        height: 64px;
        padding: 0 24px;
        position: fixed;
        width: 100%;
        z-index: 2;
    }
</style>
<header>
    <nav class="position-relative navbar navbar-expand navbar-light bg-white topbar mb-4 static-top d-print-none ">
        <div class="container-fluid">
            <a class="navbar-brand ml-5" href="https://anylearn.vn/me">
                <img src="/cdn/img/logo.png" alt="" width="30" height="30" class="d-block d-sm-none  ">
                <img src="/cdn/img/logo-full.png" alt="" width="120" height="30"
                    class="d-none d-sm-block ml-5 pl-3">
            </a>
            <!-- Topbar Navbar -->
            <ul class="navbar-nav ml-auto">
                <li class="nav-item ">
                    <div class="dropdown dropstart">
                        <a class="nav-link" id="dropdownMenuButton1" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-bell fa-fw text-primary">
                            </i>
                        </a>

                        <ul class="dropdown-menu" aria-labelledby="dropdownMenuButton1"
                            style="top:40px;right:0px;width: 360px;">
                            <div class="pl-3 ml-1">
                                <label class="fw-bold" style="font-size: 1.5rem">Thông báo</label>
                            </div>
                            <hr />
                            @foreach ($userServ->notifications() as $notif)
                                <li>
                                    <a class="dropdown" href="#">
                                        <div>
                                            <div>
                                                <p class="fw-semibold px-3 text-success">
                                                    {{ $notif->title }}</p>
                                                <p class="px-3 text-secondary text-sm">{{ $notif->content }}</p>
                                            </div>
                                            <div class="ms-auto">
                                                <span
                                                    class="text-xs px-3">{{ $userServ->timeAgo($notif->created_at) }}</span>
                                            </div>
                                        </div>
                                    </a>

                                </li>
                            @endforeach
                            {{-- <div class="">
                                    {{ $userServ->notifications()->links() }}
                                </div> --}}
                        </ul>
                    </div>
                </li>
                <li class="nav-item d-none d-md-inline">
                    {{-- <a class="nav-link" href="#">
                        <span class="">
                            <img class="img-fluid border rounded-circle float-end" style="height:32px;width:32px;"
                                src={{ Auth::user()->image }} alt="">
                        </span>
                        <span class="ms-2 text-black small">{{ Auth::user()->name }}</span>
                    </a> --}}
                    <div class="dropdown">
                        <a class="dropdown nav-link" type="button" id="dropdownMenuButton2" data-bs-toggle="dropdown"
                            aria-expanded="false">

                            <span class="">
                                <img class="img-fluid border rounded-circle float-end" style="height:28px;width:28px;"
                                    src={{ Auth::user()->image }} alt="">
                            </span>

                            <span class="ms-2 text-black small mx-2">{{ Auth::user()->name }}</span>

                        </a>
                        <ul class="dropdown-menu dropdown-menu" aria-labelledby="dropdownMenuButton2">
                            <li><a class="dropdown-item" href="/helpcenter">Hỗ Trợ</a></li>
                            <li>
                                <a class="dropdown-item" data-bs-toggle="modal" data-bs-target="#logoutModal">Đăng xuất
                                    <i class="fas fa-sign-out-alt fa-fw mr-2  text-danger"></i>
                                </a>
                            </li>
                        </ul>
                    </div>
                </li>
                <li class="nav-item pr-5">
                    <a class="nav-link" href="#" data-bs-toggle="modal" data-bs-target="#logoutModal">
                        {{-- <i class="fas fa-sign-out-alt fa-fw mr-2  text-danger"></i> --}}
                    </a>
                </li>

            </ul>
        </div>
    </nav>
</header>
<div class="modal fade mr-5" id="logoutModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
    aria-hidden="true">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="exampleModalLabel">@lang('Có chắc bạn buồn đăng xuất?')</h5>
                <button class="close" type="button" data-bs-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">×</span>
                </button>
            </div>
            <div class="modal-body">@lang('Nhấn "Đăng xuất" để tắt phiên làm việc hiện tại.')</div>
            <div class="modal-footer">
                <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">@lang('Bỏ qua')</button>
                <form action="{{ route('logout') }}" method="POST">
                    {{ csrf_field() }}
                    <button class="btn btn-{{ env('MAIN_COLOR', 'primary') }}" type="submit">@lang('Đăng xuất')</button>
                </form>
            </div>
        </div>
    </div>
</div>
