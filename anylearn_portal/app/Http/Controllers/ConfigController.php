<?php

namespace App\Http\Controllers;

use App\Constants\ActivitybonusConstants;
use App\Constants\ConfigConstants;
use App\Constants\FileConstants;
use App\Constants\InteractConstants;
use App\Models\Activitybonus;
use App\Models\Configuration;
use App\Models\I18nContent;
use App\Models\Interaction;
use App\Models\Tag;
use App\Models\Voucher;
use App\Models\VoucherEvent;
use App\Models\VoucherGroup;
use App\Services\FileServices;
use App\Services\ZaloServices;
use Geocoder\Laravel\Facades\Geocoder;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\DB;
use Vanthao03596\HCVN\Models\District;
use Vanthao03596\HCVN\Models\Province;
use Vanthao03596\HCVN\Models\Ward;

class ConfigController extends Controller
{
    public function zaloOA(Request $request)
    {
        $zaloServ = new ZaloServices();
        $loginUrl = $zaloServ->generateUrl();
        if ($loginUrl) {
            return redirect($loginUrl);
        }
        echo "NO_URL";
    }

    public function zalo(Request $request)
    {
        $code = $request->get('code');
        if (empty($code)) {
            echo 'NO CODE AVAILABLE';
        }

        $configM = new Configuration();
        $configM->createOrUpdate(ConfigConstants::ZALO_CODE, $code, ConfigConstants::TYPE_ZALO);
        $zaloServ = new ZaloServices();
        $tokenObj = $zaloServ->getToken($code, ZaloServices::GRANT_TYPE_CODE);
        if (
            empty($tokenObj['access_token'])
            || empty($tokenObj['refresh_token'])
            || empty($tokenObj['expires_in'])
        ) {
            echo 'NO_TOKEN_COLLECT';
            return;
        }
        $configM->createOrUpdate(ConfigConstants::ZALO_TOKEN, $tokenObj['access_token'], ConfigConstants::TYPE_ZALO, true);
        $configM->createOrUpdate(ConfigConstants::ZALO_REFRESH, $tokenObj['refresh_token'], ConfigConstants::TYPE_ZALO, true);
        $configM->createOrUpdate(ConfigConstants::ZALO_TOKEN_EXP, ($tokenObj['expires_in'] + time()), ConfigConstants::TYPE_ZALO, true);
        $zaloServ = new ZaloServices();
        echo 'UPDATE_NEW_CODE_SUCCESS';
    }

    public function email(Request $request)
    {
        $configM = new Configuration();
        if ($request->input('save')) {
            $configs = $request->input('config');
            foreach ($configs as $key => $config) {
                $configM->createOrUpdate($key, $config, ConfigConstants::TYPE_EMAIL, true);
            }
            return redirect()->back()->with('notify',  true);
        }
        $this->data['emailConfigs'] = $configM->getAnotherConfigs(
            ConfigConstants::$mailConfigs,
            config('email_template')
        );
        $this->data['navText'] = __('Chỉnh sửa email template');
        return view('config.email', $this->data);
    }

    public function site(Request $request)
    {
        $configM = new Configuration();
        if ($request->input('save')) {
            $configs = $request->input('config');
            foreach ($configs as $key => $config) {
                $configM->createOrUpdate($key, $config, ConfigConstants::TYPE_CONFIG);
            }
            return redirect()->back()->with('notify',  true);
        }
        $this->data['configs'] = $configM->getSiteConfigs();
        $this->data['navText'] = __('Cài đặt thông số hệ thống');
        return view('config.site', $this->data);
    }
    public function activitybonus(Request $request)
    {
        $activitybonusM = new Activitybonus();
        if ($request->input('save')) {
            $configs = $request->input('config');
            foreach ($configs as $key => $config) {
                $activitybonusM->createOrUpdate($key, $config, ActivitybonusConstants::TYPE_CONFIG);
            }
            return redirect()->back()->with('notify',  true);
        }
        $this->data['configs'] = $activitybonusM->getConfigs();
        $this->data['navText'] = __('Cài đặt điểm thưởng tương tác');
        return view('config.activitybonus', $this->data);
    }
    public function guide($type)
    {
        if (!isset(ConfigConstants::$guideTitle[$type])) {
            return redirect()->back();
        }
        $this->data['guideType'] = $type;
        $this->data['data'] = null;
        $data = Configuration::where('key', $type)->first();
        if ($data) {
            $this->data['data'] = $data->value;
        }
        $this->data['navText'] = __(ConfigConstants::$guideTitle[$type]);
        $fileService = new FileServices();
        $fileService->getImagesOfData($this->data['data']);
        return view('config.guide', $this->data);
    }

    public function guideUpdate(Request $request, $type)
    {
        if (!isset(ConfigConstants::$guideTitle[$type])) {
            return redirect()->back();
        }
        if (empty($request->get('data'))) {
            return redirect()->back()->with('notify', __("Không thể lưu nội dung trống"));
        }
        $fileService = new FileServices();
        $fileService->cleanNotUsedImages($request->get('data'));
        $configM = new Configuration();
        $rs = $configM->createOrUpdate($type, $request->get('data'), ConfigConstants::TYPE_GUIDE);
        return redirect()->back()->with('notify', $rs);
    }

    public function guidepdf($type, $id)
    {
        $contract = DB::table('contracts')
            ->join('users', 'users.id', '=', 'contracts.user_id')
            ->where('contracts.id', $id)
            ->select('users.name', 'users.phone', 'users.title', 'contracts.*')
            ->first();
        if (!isset(ConfigConstants::$guideTitle[$type])) {
            return redirect()->back();
        }
        $this->data['guideType'] = $type;
        $this->data['data'] = null;
        $data = Configuration::where('key', $type)->first();
        if ($data) {
            $this->data['data'] = $data->value;
        }
        $this->data['contract']  = $contract;
        $this->data['navText'] = __(ConfigConstants::$guideTitle[$type]);
        $fileService = new FileServices();
        $fileService->getImagesOfData($this->data['data']);

        return view('config.guidepdf', $this->data);
    }
    public function banner(Request $request)
    {
        $key = ConfigConstants::CONFIG_APP_BANNERS;
        if ($request->hasFile('file')) {
            $fileService = new FileServices();
            $file = $fileService->doUploadImage($request, 'file', FileConstants::DISK_S3, false, FileConstants::FOLDER_BANNERS);
            if ($file !== false) {
                $banners = [];
                $dbBanners = Configuration::where('key', $key)->first();
                if ($dbBanners) {
                    $banners = json_decode($dbBanners->value, true);
                }
                $banners[count($banners)] = [
                    'file' => $file['url'],
                    'route' => $request->get('route'),
                    'arg' => $request->get('arg'),
                ];
                Configuration::where('key', $key)->delete();
                Configuration::create([
                    'key' => $key,
                    'type' => ConfigConstants::TYPE_CONFIG,
                    'value' => json_encode($banners),
                ]);
                return redirect()->back()->with('notify', true);
            }
        }
        $dbBanners = Configuration::where('key', $key)->first();
        if ($dbBanners) {
            $banners = json_decode($dbBanners->value, true);
        } else {
            $banners = [];
        }

        $this->data['files'] = $banners;
        $this->data['navText'] = __('Quản lý banner');
        return view('config.banner', $this->data);
    }

    public function delBanner($index)
    {
        $key = ConfigConstants::CONFIG_APP_BANNERS;
        $dbBanners = Configuration::where('key', $key)->first();
        if (!$dbBanners) {
            return redirect()->back();
        }
        $banners = json_decode($dbBanners->value, true);
        $bannerToDelete = $banners[$index];

        $fileService = new FileServices();
        $files = ['banners/' . $bannerToDelete['file']];
        $fileService->deleteFiles($files, FileConstants::DISK_S3);

        $newBanners = [];
        foreach ($banners as $i => $url) {
            if ($i != $index) {
                $newBanners[$i] = $url;
            }
        }

        Configuration::where('key', $key)->delete();
        Configuration::create([
            'key' => $key,
            'type' => ConfigConstants::TYPE_CONFIG,
            'value' => json_encode($newBanners),
        ]);
        return redirect()->back()->with('notify', true);
    }

    public function privacy()
    {
        $configM = new Configuration();
        $data = $configM->getDoc(ConfigConstants::GUIDE_PRIVACY);
        // if ($data) {
        //     return $data->value;
        // }
        if ($data) {
            $data['guide'] = $data['value'];
        } else {
            $data['guide'] = "";
        }
        return view(env('TEMPLATE', '') . 'helpcenter.guide', $data);
        // echo "";
    }

    public function voucher(Request $request)
    {
        $this->data['vouchers'] = VoucherGroup::orderby('status', 'desc')
            ->orderby('id', 'desc')
            ->paginate(20);
        $this->data['navText'] = __('Danh sách Bộ Voucher');
        return view('config.voucher_group_list', $this->data);
    }

    public function voucherEvent(Request $request)
    {
        $this->data['events'] = VoucherEvent::orderby('status', 'desc')
            ->orderby('id', 'desc')
            ->paginate(20);
        $this->data['navText'] = __('Danh sách Sự kiện phát Voucher');
        return view('config.voucher_event', $this->data);
    }

    public function voucherEventLog(Request $request, $id)
    {
        $this->data['data'] = DB::table('voucher_event_logs AS vel')
            ->where('vel.voucher_event_id', $id)
            ->orderby('vel.id', 'desc')
            ->paginate(20);
        $this->data['navText'] = __('Danh sách Thành viên sử dụng event');
        $this->data['hasBack'] = route('config.voucherevent');
        return view('config.voucher_event_log', $this->data);
    }

    public function voucherList(Request $request, $id)
    {
        $this->data['vouchers'] = DB::table('vouchers')
            ->where('vouchers.voucher_group_id', $id)
            ->orderby('vouchers.id', 'desc')
            ->select('vouchers.*', DB::raw("(SELECT GROUP_CONCAT(users.phone SEPARATOR ', ') FROM vouchers_used
        join users on vouchers_used.user_id = users.id
        where vouchers_used.voucher_id = vouchers.id) AS used"))
            ->paginate(20);
        $this->data['navText'] = __('Danh sách Voucher');
        $this->data['hasBack'] = route('config.voucher');
        return view('config.voucher_list', $this->data);
    }

    public function voucherCsv(Request $request, $id)
    {
        $vouchers = DB::table('vouchers')
            ->where('vouchers.voucher_group_id', $id)
            ->orderby('vouchers.id', 'desc')
            ->get(); //->toArray();
        // dd($vouchers);
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=anylearn_vouchers_" . $id . "_" . now() . ".csv",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($vouchers) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            foreach ($vouchers as $row) {
                // mb_convert_encoding($row, 'UTF-16LE', 'UTF-8');
                fputcsv($file, [$row->voucher]);
            }
            fclose($file);
        };
        return response()->stream($callback, 200, $headers);
    }

    public function voucherClose($type, $id)
    {
        if ($type == 'voucher') {
            $rs = Voucher::find($id)->update(['status' => DB::raw('1 - status')]);
        } else {
            $rs = VoucherGroup::find($id)->update(['status' => DB::raw('1 - status')]);
        }
        return redirect()->back()->with('notify', $rs);
    }

    public function voucherEventClose($id)
    {
        $rs = VoucherEvent::find($id)->update(['status' => DB::raw('1 - status')]);

        return redirect()->back()->with('notify', $rs);
    }

    public function voucherEventEdit(Request $request, $eventId = null)
    {
        if ($request->get('save')) {
            $input = $request->input();
            $data = [
                'type' => $input['type'],
                'title' => $input['title'],
                'trigger' => $input['trigger'],
                'targets' => $input['targets'],
                'notif_template' => $input['notif_template'],
                'email_template' => $input['email_template'],
                'qtt' => $input['qtt'],
                'status' => 1,
                'ref_user_id' => $input['ref_user_id'],
                'commission_rate' => $input['commission_rate'],
            ];

            if (empty($input['id'])) {
                $newEvent = VoucherEvent::create($data);
                if (!$newEvent) {
                    return redirect()->back()->with('notify', 'Tạo sự kiện mới thất bại');
                } else {
                    return redirect()->route('config.voucherevent')->with('notify', 'Thao tác thành công.');
                }
            } else {
                VoucherEvent::find($input['id'])->update($data);
                return redirect()->route('config.voucherevent')->with('notify', 'Thao tác thành công.');
            }
        }
        if (!empty($eventId)) {
            $this->data['event'] = VoucherEvent::find($eventId);
        }

        $configCommission = Configuration::where('key', ConfigConstants::CONFIG_COMMISSION_REF_VOUCHER)->first();
        $this->data['defaultCommissionRate'] = $configCommission ? $configCommission->value : 0;

        $this->data['navText'] = __('Quản lý Sự kiện phát voucher');
        $this->data['hasBack'] = true;
        return view('config.voucher_event_form', $this->data);
    }

    public function voucherEdit(Request $request)
    {
        if ($request->get('save')) {
            $totalSaved = 0;
            $input = $request->input();
            $partnerVouchers = empty($input['partner_vouchers']) ? [] : explode("\n", $input['partner_vouchers']);

            if ($input['voucher_type'] == VoucherGroup::TYPE_PARTNER) {
                $data = [
                    'type' => VoucherGroup::TYPE_PARTNER,
                    'prefix' => $input['prefix'],
                    'generate_type' => VoucherGroup::TYPE_PARTNER,
                    'qtt' => count($partnerVouchers),
                    'value' => 0,
                    'status' => 1,
                    'length' => $input['length'],
                ];

                $newGroup = VoucherGroup::create($data);
                if ($newGroup) {
                    foreach ($partnerVouchers as $voucher) {
                        $existVoucher = Voucher::where('voucher', $voucher)->count();
                        if ($existVoucher > 0) {
                            continue;
                        }
                        Voucher::create([
                            'voucher_group_id' => $newGroup->id,
                            'voucher' => $voucher,
                            'amount' => 1,
                            'value' => $newGroup->value,
                            'status' => 1,
                            'expired' => 0,
                        ]);
                        $totalSaved++;
                    }
                }
            } else {
                $data = [
                    'type' => $input['voucher_type'],
                    'generate_type' => $input['generate_type'],
                    'prefix' => $input['prefix'],
                    'qtt' => $input['qtt'],
                    'value' => $input['value'],
                    'status' => 1,
                    'rule_min' => $input['rule_min'],
                    'rule_max' => $input['rule_max'],
                    'length' => $input['length'],
                ];
                $exists = VoucherGroup::where('prefix', $input['prefix'])->count();
                if ($exists > 0) {
                    return redirect()->back()->with('notify', 'Mã này đã tạo');
                }

                if (!empty(trim($input['ext']))) {
                    $classIds = explode(',', trim($input['ext']));
                    for ($i = 0; $i < count($classIds); $i++) {
                        $classIds[$i] = intval($classIds[$i]);
                    }
                    $data['ext'] = implode(",", $classIds);
                }

                try {
                    $newGroup = VoucherGroup::create($data);
                } catch (\Exception $e) {
                    return redirect()->back()->with('notify', $e->getMessage());
                }
                if ($newGroup) {
                    if ($newGroup->generate_type == VoucherGroup::GENERATE_AUTO) {
                        // do {
                        //     $genVoucher = Voucher::buildAutoVoucher($newGroup->prefix, $newGroup->length ?? 6);
                        //     $exists = Voucher::where('voucher', $genVoucher)->count();
                        //     if ($exists > 0) {
                        //         continue;
                        //     }
                        //     try {
                        //         Voucher::create([
                        //             'voucher_group_id' => $newGroup->id,
                        //             'voucher' => $genVoucher,
                        //             'amount' => 1,
                        //             'value' => $newGroup->value,
                        //             'status' => 1,
                        //             'expired' => 0
                        //         ]);
                        //         $totalSaved++;
                        //     } catch (\Exception $ex) {
                        //         Log::error($ex);
                        //     }
                        // } while ($totalSaved < $newGroup->qtt);
                        $maxAttempts = 5000; // Số lần lặp tối đa
                        $totalSaved = 0;
                        while ($totalSaved < $newGroup->qtt && $maxAttempts > 0) {
                            $genVoucher = Voucher::buildAutoVoucher($newGroup->prefix, $newGroup->length ?? 6);
                            $exists = Voucher::where('voucher', $genVoucher)->count();
                            if ($exists > 0) {
                                $maxAttempts--;
                                continue;
                            }

                            try {
                                Voucher::create([
                                    'voucher_group_id' => $newGroup->id,
                                    'voucher' => $genVoucher,
                                    'amount' => 1,
                                    'value' => $newGroup->value,
                                    'status' => 1,
                                    'expired' => 0
                                ]);
                                $totalSaved++;
                            } catch (\Exception $ex) {
                                Log::error($ex);
                            }

                            $maxAttempts--;
                        }
                        if ($totalSaved < $newGroup->qtt) {
                            return redirect()->back()->with('notify', 'Không thể tạo đủ số lượng mã voucher yêu cầu');
                        }
                    } else {
                        try {
                            Voucher::create([
                                'voucher_group_id' => $newGroup->id,
                                'voucher' => $newGroup->prefix,
                                'amount' => $newGroup->qtt,
                                'value' => $newGroup->value,
                                'status' => 1,
                                'expired' => 0
                            ]);
                            $totalSaved++;
                        } catch (\Exception $ex) {
                            Log::error($ex);
                        }
                    }
                }
            }

            return redirect()->route('config.voucher')->with('notify', "Thêm thành công $totalSaved voucher");
        }

        $this->data['navText'] = __('Quản lý voucher');
        return view('config.voucher_form', $this->data);
    }

    public function homePopup(Request $request)
    {
        if ($request->get('save')) {
            $version = 0;
            $lastImage = "";
            $key = $request->get('save') == 'save_app' ? ConfigConstants::CONFIG_HOME_POPUP : ConfigConstants::CONFIG_HOME_POPUP_WEB;

            $lastConfig = Configuration::where('key', $key)->first();
            if (!empty($lastConfig)) {
                $data = json_decode($lastConfig->value, true);
                $version = $data['version'];
                $lastImage = $data['image'];
                Configuration::where('key', $key)->delete();
            }

            $fileService = new FileServices();
            $file = $fileService->doUploadImage($request, 'image', FileConstants::DISK_S3, true, 'popup');

            $config = $request->all();
            Configuration::create([
                'key' => $key,
                'type' => ConfigConstants::TYPE_CONFIG,
                'value' => json_encode([
                    'image' => empty($file) ? $lastImage : $file['url'],
                    'title' => json_encode([
                        'vi' => $config['title']['vi'],
                        'en' => $config['title']['en'],
                    ]),
                    'route' => isset($config['route']) ? $config['route'] : "",
                    'args' => isset($config['args']) ? $config['args'] : "",
                    'version' => (int)$version + 1,
                    'status' => isset($config['status']) && $config['status'] == 'on' ? 1 : 0,
                ]),
            ]);
            return redirect()->back()->with('notify', 'Cập nhật thành công');
        }
        $appConfig = Configuration::where('key', ConfigConstants::CONFIG_HOME_POPUP)->first();
        if ($appConfig) {
            $temp = json_decode($appConfig->value, true);
            //  dd(is_object((json_decode($temp['title']))));
            if (!is_object((json_decode($temp['title'])))) {
                $temp['title'] = json_encode([
                    'vi' => $temp['title'],
                    'en' => $temp['title'],
                ]);
            }
            // dd($temp);
            $temp['title'] = json_decode($temp['title']);
            $this->data['config'] = $temp;
        }
        $webConfig = Configuration::where('key', ConfigConstants::CONFIG_HOME_POPUP_WEB)->first();
        if ($webConfig) {
            $web = json_decode($webConfig->value, true);
            if (!is_object((json_decode($web['title'])))) {
                $web['title'] = json_encode([
                    'vi' => $web['title'],
                    'en' => $web['title'],
                ]);
            }
            $web['title'] = json_decode($web['title']);
            $this->data['webconfig'] = $web;
        }
        $this->data['navText'] = __('Quản lý Popup Trang Chủ APP/WEB');
        return view('config.homepopup', $this->data);
    }


    public function homeClasses(Request $request)
    {
        if ($request->get('save')) {
            $key = ConfigConstants::CONFIG_HOME_SPECIALS_CLASSES;
            $lastConfig = Configuration::where('key', $key)->first();

            if (!empty($lastConfig)) {
                $data = json_decode($lastConfig->value, true);
                Configuration::where('key', $key)->delete();
            }

            $configs = $request->all();
            $values = [];
            foreach ($configs['block'] as $index => $config) {
                if ($config['classes'] != null) {
                    if (empty($config['title'])) {
                        $values[$index] = [];
                    } else {
                        $values[$index] = $config;
                    }
                }
            }
            // dd($values);
            Configuration::create([
                'key' => $key,
                'type' => ConfigConstants::TYPE_CONFIG,
                'value' => json_encode($values),
            ]);
            return redirect()->back()->with('notify', 'Cập nhật thành công');
        }
        $config = Configuration::where('key', ConfigConstants::CONFIG_HOME_SPECIALS_CLASSES)->first();
        $this->data['configs'] = [
            [], [], [], [], [], //5
        ];
        if ($config) {
            $values = json_decode($config->value, true);
            for ($i = 0; $i < count($this->data['configs']); $i++) {
                $this->data['configs'][$i] = empty($values[$i]) ? [] : $values[$i];
            }
        }
        // if ($config) {
        //     $values = json_decode($config->value, true);
        //     for ($i = 0; $i < count($this->data['configs']); $i++) {
        //         if (!empty($values[$i])) {
        //             if (empty($values[$i]['title'])) {
        //                     $values[$i]['title'] = json_encode([
        //                         'vi' => null,
        //                         'en' => null,
        //                     ]);
        //             }
        //             if($values[$i]['title']){
        //                 $values[$i]['title'] = json_encode([
        //                     'vi' => $values[$i]['title'],
        //                     'en' => $values[$i]['title'],
        //                 ]);
        //             }
        //          $values[$i]['title'] = json_decode($values[$i]['title'], true);
        //         }
        //         // dd($values[$i]['title']);
        //         $config = empty($values[$i]) ? [] : $values[$i];
        //             $this->data['configs'][$i] = $config;
        //     }
        // }
        //   dd($this->data['configs']);
        $this->data['navText'] = __('Quản lý Các Khoá học Đặc biệt trên HOME APP');
        return view('config.homeclasses', $this->data);
    }


    public function locationTree($level, $parentCode)
    {
        if (!in_array($level, ['ward', 'district', 'ward_path'])) {
            return "";
        }

        if ($level  == 'district') {
            $districts = District::where('parent_code', $parentCode)->orderby('name')->get();
            return response()->json($districts);
        } else if ($level == 'ward') {
            $wards = Ward::where('parent_code', $parentCode)->orderby('name')->get();;
            return response()->json($wards);
        } else if ($level == 'ward_path') {
            $ward = Ward::where('code', $parentCode)->first();
            return response()->json($ward);
        }
    }

    public function locationGeo($address)
    {

        // return response()->json($data);
    }

    public function tagsManager(Request $request)
    {
        $this->data['tags'] = Tag::select(DB::raw('distinct tag'), 'status')
            ->where('type', 'class')
            ->get();
        $this->data['navText'] = __('Quản lý TAGs');
        return view('config.tags', $this->data);
    }

    public function touchTagStatus($tag)
    {
        $rs = Tag::where('tag', $tag)->update(
            [
                'status' => DB::raw('1 - status')
            ]
        );
        return redirect()->back();
    }
}
