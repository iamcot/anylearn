<header>
    <div class="bg-blue-600 border-b border-gray-200">
        <div class="container py-1 flex justify-between px-2 font-medium text-xs">
            <div class="flex items-center">
                <a href="{{ route('home') }}" class="text-white hover:text-gray-300 rounded-md px-2 py-1 block sm:hidden"><i class="fa fa-home"></i></a>
                <a href="{{ route('home') }}" class="text-white hover:text-gray-300 rounded-md px-2 py-1 hidden sm:block">Trang chủ</a>
                @if (!Auth::user())
                     <span class="text-white hover:text-gray-300 py-1 hidden sm:block">|</span>
                <!--a href="{{ route('allclasses') }}" class="text-white hover:text-gray-300 rounded-md px-2 py-1 hidden sm:block">Kênh học tập</!--a>
                <span-- class="text-white hover:text-gray-300 py-1 hidden sm:block">|</span-->
                <a href="{{ route('refpage', ['code' => 'anylearn']) }}" class="text-white hover:text-gray-300 rounded-md px-2 py-1">Trở thành đối tác anyLEARN</a>
                @endif

                <span class="text-white hover:text-gray-300 py-1 hidden sm:block">|</span>
                <a href="#download-app" class="text-white hover:text-gray-300 rounded-md px-2 py-1 hidden sm:block">Tải ứng dụng</a>
            </div>
            <div class="flex items-center">
                <!-- <a href="{{ route('helpcenter') }}" class="text-white hover:text-gray-300 rounded-md px-2 py-1 hidden sm:block"><i class="fa fa-bell"></i> Thông báo</a> --}}
                <span class="text-white hover:text-gray-300 px-1 py-1 hidden sm:block">|</span> --}}
                <a href="{{ route('helpcenter') }}" class="text-white hover:text-gray-300 rounded-md px-2 py-1 hidden sm:block"><i class="fa fa-question-circle"></i> Hỗ trợ</a>
                <a href="{{ route('helpcenter') }}" class="text-white hover:text-gray-300 rounded-md px-2 py-1 sm:hidden">Hỗ trợ</a>
                <span class="text-white hover:text-gray-300 px-1 py-1">|</span> -->

                @if (!Auth::user())
                    <a href="/login" class="text-white px-2 py-1 rounded-md">Đăng nhập</a>
                    <span class="text-white hover:text-gray-300 px-1 py-1">|</span>
                    <a href="/ref/anylearn?cb={{ urlencode(url()->full()) }}" class="text-white pl-2 py-1 rounded-md">Đăng ký</a>
                @else
                    <a href="{{ route('me.dashboard') }}" class="text-white py-1 rounded-md">Trang quản lý</a>
                    <span class="text-white hover:text-gray-300 px-1 py-1">|</span>
                    <a href="{{ route('auth.logout') }}" class="text-white py-1 rounded-md">Đăng xuất</a>
                @endif
            </div>
        </div>
    </div>
</header>
