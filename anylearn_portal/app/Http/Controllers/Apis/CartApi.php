<?php

namespace App\Http\Controllers\APIs;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Spm;
use App\Services\ItemServices;

class CartApi extends Controller
{
    public function index(Request $request)
    {
        $user = $request->get('_user');
        $data['cartItems'] = ''; 
        if ($user) {          
            $data['cartItems'] = (new ItemServices)->countCartItems($user);         
        }

        $spm = new Spm();
        $spm->addSpm($request);

        return response()->json($data);
    }
}
