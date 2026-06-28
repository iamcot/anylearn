@inject('userService', 'App\Services\UserServices')
<!-- Sidebar -->
@php ( $route = app('router')->getRoutes()->match(app('request'))->getName() )
@php ( $role = Auth::user()->role )
<ul class="navbar-nav bg-gradient-{{ env('MAIN_COLOR', 'primary') }} sidebar sidebar-dark accordion d-print-none" id="accordionSidebar">
    <!-- Sidebar - Brand -->
    <a class="sidebar-brand d-flex align-items-center justify-content-center" href="{{ route('dashboard') }}">
        <div class="sidebar-brand-icon rotate-n-15">
            <i class="fas fa-book-open"></i>
            <!-- <i class="fas fa-gem"></i> -->
        </div>
        <div class="sidebar-brand-text mx-3">{{ env('APP_NAME') }}</div>
    </a>

    @if($userService->haveAccess($role, 'class'))
    <hr class="sidebar-divider d-none d-md-block">
    <!--li class="nav-item {{ in_array($route, ['class', 'class.create', 'class.edit']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('class') }}">
            <i class="fas fa-fw fa-university"></i>
            <span>@lang('Quản lý Lớp học')</span></a>        
    </li-->
    <li class="nav-item {{ in_array($route, ['class', 'class.create', 'class.edit', 'codes', 'codes.refresh']) ?  'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseItem" aria-expanded="{{ in_array($route, ['class', 'class.create', 'class.edit', 'codes', 'codes.refresh']) ? true : false }}" aria-controls="collapsePages">
        <i class="fas fa-fw fa-university"></i>
            <span>@lang('Quản lý lớp học')</span></a> 
        </a>
        <div id="collapseItem" class="collapse {{ in_array($route, ['class', 'class.create', 'class.edit', 'codes', 'codes.refresh']) ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ strpos($route, 'class') !== false ? 'active' : '' }}" href="{{ route('class') }}">
                    <i class="fas fa-fw fa-fire"></i>
                    <span>@lang('Danh sách lớp học')</span></a>
                </a>
                <a class="collapse-item {{ in_array($route, ['codes', 'codes.refresh']) ? 'active' : '' }}" href="{{ route('codes') }}">
                <i class="fas fa-fw fa-bolt"></i>
                    <span>@lang('Thông tin kích hoạt')</span></a>
                </a>

                <a class="collapse-item {{ in_array($route, ['class.activities']) ? 'active' : '' }}" href="{{ route('class.activities') }}">
                <i class="fas fa-fw fa-bolt"></i>
                    <span>@lang('Đăng ký hoạt động trải nghiệm')</span></a>
                </a>
            </div>
        </div>
    </li>
    @endif
    @if ($userService->isActivity())
    <li class="nav-item {{ in_array($route, ['user.activity']) ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('user.activity') }}">
            <i class="fas fa-snowboarding"></i>
            <span>@lang('Hoạt động')</span></a>
    </li>
    @endif
    {{-- <hr class="sidebar-divider d-none d-md-block">
    <li class="nav-item {{ in_array($route, ['crm.requestsale']) ? 'active' : '' }}">
    <a class="nav-link" href="{{ route('crm.requestsale') }}">
        <i class="fas fa-fw fa-university"></i>
        <span>@lang('Sale')</span></a>
    </li> --}}

    @if($userService->haveAccess($role, 'user.members'))
    <li class="nav-item {{ strpos($route, 'user.members') !== false ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('user.members') }}">
            <i class="fas fa-fw fa-users-cog"></i>
            <span>@lang('Quản lý thành viên')</span></a>
    </li>
    @endif
    @if($userService->haveAccess($role, 'location'))
    <li class="nav-item {{ in_array($route, ['location', 'location.create', 'location.edit']) ? 'active' : '' }}">
        <a href="{{ route('location') }}" class="nav-link">
            <i class="fas fa-fw fa-info-circle"></i>
            <span>Quản lý địa chỉ</span>
        </a>
    </li>
    @endif

    @if($userService->haveAccess($role, 'article'))
    <li class="nav-item {{ $route == 'article' ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('article') }}">
            <i class="fas fa-fw fa-comments"></i>
            <span>@lang('Viết bài Học & Hỏi')</span></a>
    </li>
    @endif
    @if($userService->haveAccess($role, 'feedback'))
    <li class="nav-item {{ $route == 'feedback' ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('feedback') }}">
            <i class="fas fa-fw fa-comments"></i>
            <span>@lang('Xem feedback')</span></a>
    </li>
    @endif
    @if($userService->haveAccess($role, 'transaction'))
    <li class="nav-item {{ $route == 'transaction' ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('transaction') }}">
            <i class="fas fa-fw fa-money-check-alt"></i>
            <span>@lang('Duyệt giao dịch')</span></a>
    </li>
    @endif
    <!-- @if($userService->haveAccess($role, 'order.open'))
    <li class="nav-item {{ $route == 'order.open' ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('order.open') }}">
            <i class="fas fa-fw fa-money-check-alt"></i>
            <span>@lang('Duyệt đơn hàng')</span></a>
    </li>
    @endif -->
    @if($userService->haveAccess($role, 'order.all'))
    <li class="nav-item {{ $route == 'order.all' ? 'active' : '' }}">
        <a class="nav-link" href="{{ route('order.all') }}">
            <i class="fas fa-fw fa-shopping-cart"></i>
            <span>@lang('Xem đơn hàng')</span></a>
    </li>
    @endif
    @if($userService->haveAccess($role, 'useractions'))
    <li class="nav-item {{ in_array($route, ['user.noprofile', 'user.contract', 'transaction.commission']) ?  'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseUserAction" aria-expanded="{{ in_array($route, ['user.noprofile', 'user.contract', 'transaction', 'order.open', 'transaction.commission']) ? true : false }}" aria-controls="collapsePages">
            <i class="fas fa-fw fa-book"></i>
            <span>@lang('Thao tác người dùng')</span>
        </a>
        <div id="collapseUserAction" class="collapse {{ in_array($route, ['user.noprofile', 'user.contract',  'transaction.commission']) ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ strpos($route, 'user.noprofile') !== false ? 'active' : '' }}" href="{{ route('user.noprofile') }}">
                    <i class="fas fa-fw fa-fire"></i>
                    <span>Nhắc cập nhật profile</span>
                </a>
                <a class="collapse-item {{ $route == 'user.contract' ? 'active' : '' }}" href="{{ route('user.contract') }}">
                    <i class="fas fa-fw fa-certificate"></i>
                    <span>@lang('Quản lý hợp đồng')</span></a>
                </a>
                <a class="collapse-item {{ $route == 'transaction.commission' ? 'active' : '' }}" href="{{ route('transaction.commission') }}">
                    <i class="fas fa-fw fa-money-check-alt"></i>
                    <span>@lang('Lịch sử nhận hoa hồng')</span></a>
                </a>

            </div>
        </div>
    </li>
    @endif
    <hr class="sidebar-divider d-none d-md-block">
    <div class="sidebar-heading">
        @lang('Hệ thống')
    </div>
    @if($userService->haveAccess($role, 'fin.expenditures'))
    <li class="nav-item {{ in_array($route, ['fin.expenditures', 'fin.salereport']) ?  'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseFin" aria-expanded="{{ in_array($route, ['fin.expenditures', 'fin.salereport']) ? true : false }}" aria-controls="collapsePages">
            <i class="fas fa-fw fa-coins"></i>
            <span>@lang('Tài chính')</span>
        </a>
        <div id="collapseFin" class="collapse {{ in_array($route, ['fin.expenditures', 'fin.salereport']) ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ strpos($route, 'expenditures') !== false ? 'active' : '' }}" href="{{ route('fin.expenditures') }}">
                    <i class="fas fa-fw fa-file-invoice"></i>
                    <span>Chi tiêu</span>
                </a>
                <a class="collapse-item {{ $route == 'fin.salereport' ? 'active' : '' }}" href="{{ route('fin.salereport') }}">
                    <i class="fas fa-fw fa-chart-line"></i>
                    <span>@lang('Báo cáo kinh doanh')</span></a>
                </a>

            </div>
        </div>
    </li>
    @endif
    @if($userService->haveAccess($role, 'voucher'))
    <li class="nav-item {{ strpos($route, 'voucher') !== false ?  'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseVoucher" aria-expanded="{{ strpos($route, 'voucher') !== false ? true : false }}" aria-controls="collapsePages">
            <i class="fas fa-fw fa-book"></i>
            <span>@lang('Voucher')</span>
        </a>
        <div id="collapseVoucher" class="collapse {{ strpos($route, 'voucher') !== false ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ $route == 'config.voucher' ? 'active' : '' }}" href="{{ route('config.voucher') }}">
                    <i class="fas fa-fw fa-tags"></i>
                    <span>Mã Voucher</span>
                </a>
                <a class="collapse-item {{ $route == 'config.voucherevent' ? 'active' : '' }}" href="{{ route('config.voucherevent') }}">
                    <i class="fas fa-fw fa-gifts"></i>
                    <span>@lang('Sự kiện phát')</span></a>
                </a>

            </div>
        </div>
    </li>
    @endif
    @if($userService->haveAccess($role, 'helpcenter'))
    <li class="nav-item {{ strpos($route, 'knowledge') !== false ?  'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseKnowledge" aria-expanded="{{ strpos($route, 'knowledge') !== false ? true : false }}" aria-controls="collapsePages">
            <i class="fas fa-fw fa-book"></i>
            <span>@lang('Trung tâm hỗ trợ')</span>
        </a>
        <div id="collapseKnowledge" class="collapse {{ strpos($route, 'knowledge') !== false ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ $route == 'knowledge.category' ? 'active' : '' }}" href="{{ route('knowledge.category') }}">
                    <i class="fas fa-fw fa-book"></i>
                    <span>Thư mục</span>
                </a>
                <a class="collapse-item {{ $route == 'knowledge.topic' ? 'active' : '' }}" href="{{ route('knowledge.topic') }}">
                    <i class="fas fa-fw fa-book"></i>
                    <span>Chủ đề</span>
                </a>
                <a class="collapse-item {{ $route == 'knowledge' ? 'active' : '' }}" href="{{ route('knowledge') }}">
                    <i class="fas fa-fw fa-book"></i>
                    <span>Knowledge</span>
                </a>
            </div>
        </div>
    </li>
    @endif
    @if($userService->haveAccess($role, 'config'))
    <li class="nav-item {{ in_array($route, ['category', 'config.homepopup', 'config.homeclasses', 'config.site', 'config.tag', 'config.banner']) ?  'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseConfig" aria-expanded="{{ in_array($route, ['category', 'config.homepopup', 'config.homeclasses', 'config.site', 'config.tag', 'config.banner']) ? true : false }}" aria-controls="collapsePages">
            <i class="fas fa-fw fa-book"></i>
            <span>@lang('Thông số hệ thống')</span>
        </a>
        <div id="collapseConfig" class="collapse {{ in_array($route, ['category', 'config.homepopup', 'config.homeclasses', 'config.site', 'config.tag', 'config.banner','config.activitybonus']) ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ $route == 'category' ? 'active' : '' }}" href="{{ route('category') }}">
                    <i class="fas fa-fw fa-layer-group"></i>
                    <span>@lang('Chuyên mục')</span>
                </a>
                <a class="collapse-item {{ $route == 'config.homepopup' ? 'active' : '' }}" href="{{ route('config.homepopup') }}">
                    <i class="fas fa-fw fa-fire"></i>
                    <span>@lang('Thông báo trang chủ')</span>
                </a>
                <a class="collapse-item {{ $route == 'config.homeclasses' ? 'active' : '' }}" href="{{ route('config.homeclasses') }}">
                    <i class="fas fa-fw fa-fire"></i>
                    <span>@lang('Khoá học tiểu biểu')</span>
                </a>
                <a class="collapse-item {{ $route == 'config.site' ? 'active' : '' }}" href="{{ route('config.site') }}">
                    <i class="fas fa-fw fa-cogs"></i>
                    <span>@lang('Các thông số')</span>
                </a>
                <a class="collapse-item {{ $route == 'config.activitybonus' ? 'active' : '' }}" href="{{ route('config.activitybonus') }}">
                    <i class="fas fa-fw fa-cogs"></i>
                    <span>@lang('Cài đặt điểm thưởng')</span>
                </a>
                <a class="collapse-item {{ $route == 'config.tag' ? 'active' : '' }}" href="{{ route('config.tag') }}">
                    <i class="fas fa-fw fa-tags"></i>
                    <span>@lang('Các thẻ tag')</span>
                </a>
                <a class="collapse-item {{ $route == 'config.banner' ? 'active' : '' }}" href="{{ route('config.banner') }}">
                    <i class="fas fa-fw fa-images"></i>
                    <span>@lang('Banners')</span>
                </a>
                <a class="collapse-item {{ $route == 'config.email' ? 'active' : '' }}" href="{{ route('config.email') }}">
                    <i class="fas fa-fw fa-envelope"></i>
                    <span>@lang('Mẫu email')</span>
                </a>
                <a class="collapse-item" target="_blank" href="{{ route('zalo.oa') }}">
                    <i class="fas fa-fw fa-cogs"></i>
                    <span>@lang('Zalo OA')</span>
                </a>

            </div>
        </div>
    </li>
    @endif
    @if($userService->haveAccess($role, 'config.guide'))
    <li class="nav-item {{ $route == 'config.guide' ? 'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapsePages" aria-expanded="{{ $route == 'config.guide' ? true : false }}" aria-controls="collapsePages">
            <i class="fas fa-fw fa-book"></i>
            <span>@lang('Tài liệu - Hướng dẫn')</span>
        </a>
        <div id="collapsePages" class="collapse {{ $route == 'config.guide' ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                @foreach(App\Constants\ConfigConstants::$guideTitle as $type => $title)
                <a class="collapse-item {{ isset($guideType) && $guideType == $type ? 'active' : '' }}" href="{{ route('config.guide', ['type' => $type]) }}">
                    <i class="fas fa-fw fa-book"></i>
                    <span>{{ __($title) }}</span></a>
                @endforeach
            </div>
        </div>
    </li>
    @endif
    @if($userService->haveAccess($role, 'spm'))
    <li class="nav-item {{ in_array($route, ['spm.general']) ?  'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseSpm" aria-expanded="{{ in_array($route, ['spm.general']) ? true : false }}" aria-controls="collapsePages">
            <i class="fas fa-fw fa-fire"></i>
            <span>@lang('anyLogs')</span>
        </a>
        <div id="collapseSpm" class="collapse {{ in_array($route, ['spm.general']) ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ $route == 'spm.general' ? 'active' : '' }}" href="{{ route('spm.general') }}">
                    <i class="fas fa-fw fa-fire"></i>
                    <span>Spm all</span>
                </a>
            </div>
        </div>
    </li>
    @endif
    @if($userService->haveAccess(Auth::user()->role, 'user.mods'))
    {{-- <li class="nav-item {{ strpos($route, 'user.mods') !== false ? 'active' : '' }}">
    <a class="nav-link" href="{{ route('user.mods') }}">
        <i class="fas fa-fw fa-user-shield"></i>
        <span>@lang('Quản lý Mods')</span></a>
    </li> --}}

    <li class="nav-item {{ strpos($route, 'user.mods') !== false ? 'active' : '' }}">
        <a class="nav-link collapsed" href="#" data-toggle="collapse" data-target="#collapseMods" aria-expanded="{{ strpos($route, 'user.mods') !== false ? true : false }}" aria-controls="collapsePages">
            <i class="fas fa-fw fa-user-shield"></i>
            <span>@lang('Quản lý Mods')</span>
        </a>
        <div id="collapseMods" class="collapse {{ strpos($route, 'mods') !== false ? 'show' : '' }}" aria-labelledby="headingPages" data-parent="#accordionSidebar">
            <div class="bg-gray-300 py-2 collapse-inner rounded">
                <a class="collapse-item {{ in_array($route,  ['user.mods', 'user.mods.access']) ? 'active' : '' }}" href="{{ route('user.mods') }}">
                    <i class="fas fa-user-tie"></i>
                    <span>Quản trị viên</span>
                </a>
                <a class="collapse-item {{ $route == 'user.modspartner' ? 'active' : '' }}" href="{{ route('user.modspartner') }}">
                    <i class="fas fa-user-plus"></i>
                    <span>@lang('Fin Partner')</span></a>
                </a>
            </div>
        </div>
    </li>
    @endif
    <!-- Sidebar Toggler (Sidebar) -->
    <div class="text-center d-none d-md-inline">
        <button class="rounded-circle border-0" id="sidebarToggle"></button>
    </div>
</ul>
<!-- End of Sidebar -->
