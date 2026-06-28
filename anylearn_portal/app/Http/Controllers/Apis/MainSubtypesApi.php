<?php

namespace App\Http\Controllers\APIs;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Spm;
use App\Services\CommonServices;
use App\Services\ItemServices;
use App\Services\J4uServices;
use App\Services\UserServices;
use App\Services\VoucherServices;

class MainSubtypesApi extends Controller
{
    public function index(Request $request, $subtype) 
    { 
        $data = [];
        if (in_array($subtype, config('subtype_list'))) {
            
            $data['categories'] = config('subtype_categories')[$subtype];
            $data['partners'] = (new UserServices)->getPartnersBySubtype($subtype);
            $data['vouchers'] = (new VoucherServices)->getVoucherEventsBySubtype($subtype);

            $itemS = new ItemServices();
            $data['partnerItems'] = $itemS->getItemsByPartners($data['partners'], $subtype);
            $data['categoryItems'] = $itemS->getItemsByCategories($itemS->getCategoriesBySubtype($subtype), $subtype);
            
            $user = $request->get('_user');
            $data['repurchases'] = $data['j4u'] = []; 

            if ($user) {
                $commonS = new CommonServices();
                $data['j4u'] = $commonS->setTemplate('/', 'Có thể bạn quan tâm', (new J4uServices)->get($user, $subtype));
                $data['repurchases'] = $commonS->setTemplate('/', 'Đăng ký lại', $commonS->getRepurchases($user, $subtype));           
            }    
        }

        $spm = new Spm();
        $spm->addSpm($request);

        return response()->json($data);
    }
}

