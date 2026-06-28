<?php

namespace App\Http\Controllers;

use App\Constants\FileConstants;
use App\Models\Configuration;
use App\Models\User;
use App\Models\UserDocument;
use App\Services\FileServices;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AjaxController extends Controller
{
    private $response = [
        'success' => false,
        'data' => null,
    ];

    public function toc() 
    {
        $configM = new Configuration();
        $toc = $configM->getToc();
        $this->buildResponse($toc != null ? true : false, $configM->getToc());
        return response()->json($this->response);
    }

    public function userDocs($userId) {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'admin')) {
            $this->buildResponse(false, __('Bạn không có quyền cho thao tác này'));
        } else {
            $files = UserDocument::where('user_id', $userId)->get();
            if ($files) {
                $files = $files->toArray();
            }
            $fileService = new FileServices();
            // for($i = 0; $i < sizeof($files); $i++) {
            //     $files[$i]['data'] = $fileService->urlFromPath(FileConstants::DISK_S3, $files[$i]['data']);
            // }
            $this->buildResponse(true, $files);
        }
        return response()->json($this->response);
    }

    public function userRemoveUpdateDoc($userId) {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'admin')) {
            $this->buildResponse(false, __('Bạn không có quyền cho thao tác này'));
        } else {
            $rs = User::find($userId)->update(['update_doc' => 0]);
            $this->buildResponse(true, $rs);
        }
        return response()->json($this->response);
    }

    public function userAllowUpdateDoc($userId) {
        $userService = new UserServices();
        $user = Auth::user();
        if (!$userService->haveAccess($user->role, 'admin')) {
            $this->buildResponse(false, __('Bạn không có quyền cho thao tác này'));
        } else {
            $rs = User::find($userId)->update(['update_doc' => 1]);
            $this->buildResponse(true, $rs);
        }
        return response()->json($this->response);
    }

    public function touchIsHot($table, $id)
    {
        $rs = DB::table($table)->where('id', $id)->update(['is_hot' => DB::raw('1 - is_hot')]);
        return redirect()->back()->with('notify', $rs);
    }

    private function buildResponse($success, $data) {
        $this->response['success'] = $success;
        $this->response['data'] = $data;
    }
}
