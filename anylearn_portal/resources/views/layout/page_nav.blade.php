@inject('userServ','App\Services\UserServices')
<nav class="navbar shrink">
    <div class="container-fluid">
        <div class="container">
            <div class="navbar-header">
                <a class="navbar-brand page_logo" href="/"><img src="/cdn/onepage/images/logo-pink-dark.png" alt="logo"></a>
                <div class="float-right nav-link pt-3">
                    @if(@auth()->check())
                    <a class="" href="{{ route('cart') }}">
                        <span class="badge badge-success"><i class="fa fa-shopping-cart"> {{ $userServ->countItemInCart(Auth::user()->id) }}</i></span>
                    </a>
                    <a class="" href="{{ route('me.dashboard') }}">
                        <!-- <span class="badge badge-success">Số dư: {{ number_format(Auth::user()->wallet_m, 0 , ",",".") }} đ</span> -->
                        <span class="mr-2 d-lg-inline text-primary">{{ Auth::user()->first_name }}</span>
                    </a>
                    @else
                    <a class="" href="{{ route('me.dashboard') }}">
                        <span class="mr-2 d-lg-inline ">Đăng nhập</span>
                    </a>
                    @endif

                </div>
            </div>
        </div>
    </div>
</nav>