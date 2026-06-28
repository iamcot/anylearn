<nav class="navbar navbar-fixed-top ">
    <div class="container-fluid">
        <!-- Brand and toggle get grouped for better mobile display -->
        <!--second nav button -->
        <div id="menu_bars" class="right menu_bars">
            <span class="t1"></span>
            <span class="t2"></span>
            <span class="t3"></span>
        </div>
        <!-- Brand and toggle get grouped for better mobile display -->
        <div class="container">
            <div class="navbar-header">
                <a class="navbar-brand pink_logo" href="#"><img src="/cdn/onepage/images/logo-pink.png" alt="logo"></a>
            </div>
            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse navbar-ex1-collapse  ">
                <ul class="nav navbar-nav navbar-right">
                    <li class="active"><a href="#home" class="scroll">
                            <i class="fa fa-home"></i>
                        </a></li>
                    <li><a href="#" id="search-action">Tìm kiếm</a></li>
                    <li><a href="#customer_feedback" class="scroll">Nhận xét</a></li>
                    <li><a href="#work" class="scroll">Trung tâm</a></li>
                    <li><a href="#team" class="scroll">Chuyên gia</a></li>
                    <li><a href="#blog" class="scroll">Khóa học</a></li>
                    <li><a href="#pricing_table" class="scroll">Tải APP</a></li>
                 
                    @if (@auth()->check())
                    <li><a href="{{ route('me.dashboard') }}">Trang cá nhân</a></li>
                    @else
                    <li><a href="{{ route('me.dashboard') }}">Đăng nhập</a></li>
                    <li><a href="{{ route('refpage', ['code' => 'anyLEARN' ]) }}">Đăng ký</a></li>
                    @endif
                </ul>
            </div>
            <div class="sidebar_menu">
                <nav class="pushmenu pushmenu-right">
                    <a class="push-logo" href="#"><img src="/cdn/onepage/images/logo-pink-dark.png" alt="logo"></a>
                    <ul class="push_nav centered">
                        <li class="clearfix">
                            <a href="#home" class="scroll"><span></span><i class="fa fa-home"></i></a>
                        </li>
                        <li class="clearfix">
                            <a href="#customer_feedback" class="scroll"> <span>03.</span>Nhận xét</a>
                        </li>
                        <li class="clearfix">
                            <a href="#work" class="scroll"> <span>04.</span>Trung tâm</a>
                        </li>
                        <li class="clearfix">
                            <a href="#team" class="scroll"> <span>05.</span>Chuyên gia</a>
                        </li>
                        <li class="clearfix">
                            <a href="#blog" class="scroll"> <span>06.</span>Khóa học</a>
                        </li>
                        <li class="clearfix">
                            <a href="#pricing_table" class="scroll"> <span>07.</span>Tải APP</a>
                        </li>
                      
                        @if (@auth()->check())
                        <li class="clearfix"><a href="{{ route('me.dashboard') }}">Trang cá nhân</a></li>
                        @else
                        <li class="clearfix"><a href="{{ route('me.dashboard') }}">Đăng nhập</a></li>
                        <li class="clearfix"><a href="{{ route('refpage', ['code' => 'anyLEARN' ]) }}">Đăng ký</a></li>
                        @endif
                    </ul>
                    <div class="clearfix"></div>
                    <ul class="social_icon black top25 bottom20 list-inline">
                        <li><a href="#" class="navy_blue facebook"><i class="fa fa-fw fa-facebook"></i></a></li>
                        <li><a href="#" class="navy_blue twitter"><i class="fa fa-fw fa-twitter"></i></a></li>
                        <li><a href="#" class="navy_blue pinterest"><i class="fa fa-fw fa fa-pinterest"></i></a></li>
                        <li><a href="#" class="navy_blue linkedin"><i class="fa fa-linkedin" aria-hidden="true"></i></a></li>
                    </ul>
                </nav>
            </div>
            <!-- /.navbar-collapse -->
        </div>
    </div>
</nav>