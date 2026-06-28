<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class ReactController extends Controller
{
    public function index(Request $request)
    {
        return view('anylearn3.index');
    }
}
