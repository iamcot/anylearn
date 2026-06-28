@extends('anylearn.me.layout')
@section('spmb')
    friend
@endsection
@section('body')
    <div class="p-0 card">
        <div class="bg-light card-header">
            <div class="d-flex justify-content-between">
                <h5 class="mb-0">Bạn bè ({{ auth()->user()->num_friends }})</h5> <button type="button"
                    class="btn btn-secondary" onclick="change();"><i class="fas fa-table"></i></button>
            </div>
        </div>
        <div class="bg-light px-1 pb-1 pt-0 fs--1 card-body">
            <div class="gx-0 gy-1 text-center row"id="card">
                    @foreach ($friends as $row)
                        <div class="col-xxl-2 col-lg-3 col-md-4 col-6">
                            <div class="bg-white dark__bg-1100 p-3 h-100">
                                @if ($row->image != null)
                                    <a href="#">
                                        <img src="{{ $row->image }}" width="100"
                                            class="mb-3 shadow-sm img-fluid rounded-circle img-thumbnail">
                                    </a>
                                @else
                                    <img src="/cdn/img/logo.png" width="100"
                                        class="mb-3 shadow-sm img-fluid rounded-circle img-thumbnail">
                                @endif

                                <h6 class="mb-1"><a href="#">{{ $row->name }}</a></h6>
                                <p class="fs--2 mb-1"><a class="text-700">{{ $row->title }}</a></p>
                            </div>
                        </div>
                    @endforeach
            </div>
            <table id="table" role="table" class="fs--1 mb-0 overflow-hidden table d-none">
                <thead class="bg-200 text-900 text-nowrap align-middle">
                    <tr>
                        <th>
                            Họ Và Tên
                        </th>
                        <th>Email
                        </th>
                        <th>Chức danh / Đại Diện</th>
                        <th>Giới thiệu ngắn</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($friends as $row)
                        <tr class="align-middle white-space-nowrap hover-actions-trigger btn-reveal-trigger hover-bg-100"
                            role="row">
                            <td role="cell">
                                <a class="text-800">
                                    <div class="d-flex align-items-center">
                                        @if ($row->image != null)
                                            <div class="avatar avatar-sm"><img class="rounded-circle "
                                                    src="{{ $row->image }}" alt="">
                                            </div>
                                        @else
                                            <div class="avatar avatar-sm"><img class="rounded-circle "
                                                    src="/cdn/img/logo.png" alt="">
                                            </div>
                                        @endif

                                        <h6 class="mb-0 ps-2">{{ $row->name }}</h6>
                                    </div>
                                </a>
                            </td>
                            <td role="cell">
                                <div class="d-flex align-items-center pt-2">
                                    {{ $row->email }}
                                </div>
                            </td>
                            <td role="cell">
                                <div class="d-flex align-items-center pt-2">
                                    {{ $row->title }}
                                </div>
                            </td>
                            <td role="cell">
                                <div class="d-flex align-items-center pt-2">
                                    {{ $row->introduce }}
                                </div>
                            </td>
                        </tr>
                    @endforeach

                </tbody>
            </table>
        </div>
    </div>
@endsection
<script>
    function change() {
        // query phần tử DOM cần kiểm tra
        let elem = document.querySelector("#card");
        let table = document.querySelector("#table");

        // kiểm tra class
        let hasClassMain = elem.classList.contains("d-none");

        if (hasClassMain) {
            elem.classList.remove("d-none");
            table.classList.add("d-none");
        } else {
            elem.classList.add("d-none");
            table.classList.remove("d-none");
        }
    }
</script>
