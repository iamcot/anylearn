<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DevToolsController extends Controller
{
    public function changeTestBranch(Request $request)
    {
        if ($request->get('action') == 'change-test') {
            $branch = $request->get('branch'); 
            exec('git fetch -v && git checkout origin/' . $branch . ' && git pull',  $output);
        }
        return view('devtools.change_test', $this->data);
    }
}
