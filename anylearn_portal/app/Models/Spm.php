<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\DB;

class Spm extends Model
{
    protected $table = 'spms';

    protected $fillable = [
        'spm_key', 'session_id', 'day', 'user_id', 'spma', 'spmb', 'spmc', 'spmd', 'spm_pre',
        'p_url', 'p_ref', 'p_title', 'p_meta_desc', 'p_meta_robots', 'p_canonical', 'p_lang',
        'os', 'ip', 'country', 'browser', 'screen', 'user_type', 'logfrom',
        'extra', 'event',
    ];

    public function addSpm(Request $request)
    {
        $spmKey = $request->get('spm');

        $spms = explode(".", $spmKey);
        if (count($spms) < 4) {
            return false;
        }
        try {
            $data = [
                'spm_key' => $spmKey,
                'event' => $request->get('event', 'pageview'),
                'day' => date('Y-m-d'),
                'session_id' => $request->get('sid',  session()->getId()),
                'user_id' => $request->get('usid'),
                'spma' => $spms[0],
                'spmb' => $spms[1],
                'spmc' => $spms[2],
                'spmd' => $spms[3],
                'spm_pre' => $request->get('spm_pre'),
                'p_url' => $request->get('p_url'),
                'p_ref' => $request->get('p_ref'),
                'p_title' => $request->get('p_title'),
                'p_meta_desc' => $request->get('p_meta_desc'),
                'p_meta_canonical' => $request->get('p_meta_canon'),
                'p_lang' => $request->get('p_lang', App::getLocale()),
                'os' => $request->get('os'),
                'country' => $request->get('country'),
                'screen' => $request->get('screen'),
                'logfrom' => $request->get('logfrom'),
                'ip' => $request->ip(),
                'browser' => $request->header('User-Agent'),
                'extra' => $request->get('extra'),
            ];
            // get country from IP
            Spm::create($data);
        } catch (\Exception $ex) {
            Log::error($ex);
            return false;
        }

        return true;
    }

    public function addSpmApi(Request $request, $api, $message = "")
    {
        $spmKey = 'api.' . $api . '.0.0';
        try {
            $data = [
                'spm_key' => $spmKey,
                'event' => $request->get('event', 'pageview'),
                'day' => date('Y-m-d'),
                'session_id' => $request->get('sid',  session()->getId()),
                'user_id' => $request->get('usid'),
                'spma' => 'api',
                'spmb' => $api,
                'spmc' => 0,
                'spmd' => 0,
                'spm_pre' => $request->get('spm_pre'),
                'p_url' => $request->get('p_url'),
                'p_ref' => $request->get('p_ref'),
                'p_title' => $request->get('p_title'),
                'p_meta_desc' => $request->get('p_meta_desc'),
                'p_meta_canonical' => $request->get('p_meta_canon'),
                'p_lang' => $request->get('p_lang', App::getLocale()),
                'os' => $request->get('os'),
                'country' => $request->get('country'),
                'screen' => $request->get('screen'),
                'logfrom' => $request->get('logfrom'),
                'ip' => $request->ip(),
                'browser' => $request->header('User-Agent'),
                'extra' => $message,
            ];
            // get country from IP
            Spm::create($data);
        } catch (\Exception $ex) {
            Log::error($ex);
            return false;
        }

        return true;
    }

    public function filterSpm(Request $request) {

        $spms = DB::table('spms');

        if ($request->input('user_id')) {
            $spms = $spms->where('id', $request->input('user_id'));
        }
        
        if ($request->input('event')) {
            $spms = $spms->where('event', $request->input('event'));
        }
        if ($request->input('spmc')) {
            $spms = $spms->where('spmc', $request->input('spmc'));
        }

        if ($request->input('date_from')) {
            $spms = $spms->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->input('date_to')) {
            $spms = $spms->where('created_at', '<=', $request->input('date_to'));
        }

        return $spms;
    }

}
