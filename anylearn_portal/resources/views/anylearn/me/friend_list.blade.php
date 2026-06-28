<div class="card shadow">
    <div class="card-body">
        <div class="">
            <h6><b>@lang('Danh Sách Bạn Bè')</b></h6>
            <div class="form-group row">
                <!-- <p class="p-2">Bạn chưa có bạn bè</p> -->
                @if (count($friends ) > 0)
                @foreach($friends as $userselect)
                <div>
                    @if($userselect->image !=null)
                    <img class="avatar avatar-sm avatar-img p-2" src="{{ $userselect->image }}" alt="">
                    @else
                    <img class="avatar avatar-sm avatar-img bg-black border rounded-circle mt-1" src="http://anylearn.vn/cdn/anylearn/img/logo-color.svg" alt="">
                    @endif
                    <span class="mt-3 ml-2">{{ $userselect->name }}</span>
                    <!-- <input id="name" type="text" class="form-control" name="name" value="{{ $userselect->name }}" readonly> -->
                </div>
                @endforeach
                <div>
                    {{ $friends->links() }}
                </div>
                @else 
                <p class="p-3">{{ _('Bạn chưa có bạn bè nào.') }}</p>
                @endif
            </div>
        </div>
    </div>
</div>