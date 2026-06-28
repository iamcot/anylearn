@inject('userServ','App\Services\UserServices')
@extends('layout')

@section('body')
<div class="w-75">
    <div class="card">
        <div class="card-header">Thông tin Mod</div>
        <div class="card-body d-flex justify-content-between">
            <p>#ID: <span class="px-3">{{ $mod->id }}</span></p>
            <p>Phone: <span class="px-3">{{ $mod->phone }}</span></p>
            <p>Name: <span class="px-3">{{ $mod->name }}</span></p>
            <p>Role: <span class="px-3">{{ $mod->role }}</span></p>
            
        </div>
    </div>

    <div class="card my-3">
        <div class="card-header">Phân quyền modules</div>
        <div class="card-body">
            <form method="post">
                @csrf
                <table class="table table-striped table-hover table-bordered">
                <thead class="">
                    <tr>
                        <th scope="col" width="25%">#ID</th>
                        <th scope="col">Module</th>
                        <th scope="col" width="15%">Cho phép</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($modules as $key => $module)
                    <tr>
                        <td>{{ $key }}</td>
                        <td>{{ $module }}</td>
                        <td class="text-center"><input type="checkbox" name="modules[]" value="{{ $key }}" {{ in_array($key, $allowed) || empty($allowed) ? 'checked' : '' }}></td>
                    </tr>
                    @endforeach
                </tbody>
                </table>
                <div class="d-flex justify-content-end mt-3 px-4">
                    <button class="btn btn-primary px-4 shadow" type="submit" name="save" value="save">Save</button>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection