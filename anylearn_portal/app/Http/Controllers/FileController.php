<?php

namespace App\Http\Controllers;

use App\Services\FileServices;
use Illuminate\Http\Request;

class FileController extends Controller
{
    public function ckEditorImage(Request $request)
    {
        $obj  = [
            'data' => [],
            'success' => false
        ];
        $fileService = new FileServices();
        $file = $fileService->doUploadImage($request);
        if ($file !== false) {
            $obj = [
                'data' => ['url' => $file['url']],
                'success' => true
            ];
            //TODO hardcode s3 folder
            $fileService->editorHasNewImage('images/' . $file['file']);
        }
        return response()->json($obj);
    }

    public function ckEditorImage5(Request $request)
    {
        $obj  = false;
        $fileService = new FileServices();
        $file = $fileService->doUploadImage($request, 'upload');
        if ($file !== false) {
            $obj = [
                'url' => $file['url'],
            ];
            //TODO hardcode s3 folder
            $fileService->editorHasNewImage('images/' . $file['file']);
        }
        return response()->json($obj);
    }
}
