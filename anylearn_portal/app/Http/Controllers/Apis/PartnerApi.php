<?php

namespace App\Http\Controllers\APIs;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Spm;
use App\Services\ItemServices;
use App\Services\UserServices;
use App\Services\VoucherServices;
use Illuminate\Support\Facades\DB;

class PartnerApi extends Controller
{
    public function index(Request $request, $id) 
    {
        $data = [];
        $partner = (new UserServices)->getPartner($id);

        if ($partner) {
            $data['partner'] = $partner;

            $sumReviews = DB::table('items')
                ->join('item_user_actions as iua', 'iua.item_id', '=', 'items.id')
                ->where('items.user_id', $id)
                ->where('iua.type', 'rating')
                ->select(
                    DB::raw('count(iua.id) as reviews'),
                    DB::raw('avg(iua.value) as rating')
                )
                ->get();

            $data['sumRating'] = $sumReviews[0]->rating;
            $data['sumReviews']= $sumReviews[0]->reviews;
            
            $itemS = new ItemServices();
            $data['hotItems'] = $itemS->getItemsByPartner($id, 1);
            $data['normalItems'] = $itemS->getItemsByPartner($id);
            $data['reviews'] = $itemS->getItemReviewsByPartner($id);
            $data['vourcher'] = (new VoucherServices)->getVoucherByPartner($id);   
        }

        $spm = new Spm();
        $spm->addSpm($request);
        
        return response()->json($data);   
    }
}

