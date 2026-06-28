<?php

namespace App\Http\Controllers\Apis;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Spm;
use App\Models\UserLocation;
use App\Services\CommonServices;
use Illuminate\Support\Facades\DB;

class MapApi extends Controller
{
    public function index(Request $request)
    {
        $data = new \stdClass();
        $commonS = new CommonServices();
        $schools = $mapBounds = [];
        
        if ($request->get('top') && $request->get('bot')) {
            $top = explode(',', $request->get('top'));
            $bot = explode(',', $request->get('bot'));

            // Get school list based on given bounds 
            $schools = DB::table('users')
                ->join('user_locations as ul', 'ul.user_id', '=', 'users.id')
                ->where('users.role', 'school')
                ->whereBetween('ul.longitude', [$top[0], $bot[0]])
                ->whereBetween('ul.latitude', [$bot[1], $top[1]])
                ->select(
                    'users.id',
                    'users.name',
                    'users.image',
                    'users.introduce',
                    DB::raw('group_concat(ul.id) as locations')
                )
                ->groupBy('users.id')
                ->get();
        } else {
            // Get bounds based on searched school list 
            $schools = $commonS->getSearchResults($request, true)->get();
        }
 
        foreach ($schools as $school) {
            $school->locations = UserLocation::whereIn('id', explode(',', $school->locations))
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                ->get();

            foreach ($school->locations as $location) {
                $location->image = !$location->image ? $school->image : $location->image;
            } 

            $data->schools[] = $school;
            $mapBounds = array_merge($mapBounds, $school->locations->toArray()); 
        }

        $data->mapBounds = $request->except(['top', 'bot']) 
            ? $commonS->calculateMapBounds($mapBounds) 
            : [];

        $spm = new Spm();
        $spm->addSpm($request);
        
        return response()->json($data);
    }
}


