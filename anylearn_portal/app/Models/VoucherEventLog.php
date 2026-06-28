<?php

namespace App\Models;

use App\Constants\NotifConstants;
use App\Mail\VoucherEventEmail;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class VoucherEventLog extends Model
{
    protected $table = 'voucher_event_logs';

    protected $fillable = [
        'voucher_event_id', 'user_id', 'trigger', 'target', 'data', 'voucher_id'
    ];

    public function useEvent($type, $userId, $triggerId)
    {
        $existsEvents = VoucherEvent::where('type', $type)
            ->whereIn('trigger', [0, $triggerId])
            ->where('status', 1)
            ->orderby('id', 'desc')
            ->get();
        if (!$existsEvents || empty($existsEvents)) {
            return false;
        }

        try {
            foreach ($existsEvents as $existsEvent) {
                $eventLogged = $this->where('voucher_event_id', $existsEvent->id)->count();
                if ($eventLogged >= $existsEvent->qtt) {
                    continue;
                }

                $notifM = new Notification();
                $voucherGroupIds = explode(',', $existsEvent->targets);
                foreach ($voucherGroupIds as $voucherId) {
                    $voucherGroup = VoucherGroup::where('id', trim($voucherId))
                        ->where('status', 1)
                        ->first();
                    if (!$voucherGroup) {
                        continue;
                    }
                    if ($voucherGroup->generate_type == VoucherGroup::GENERATE_MANUALLY) {
                        $voucher = Voucher::where('voucher_group_id', $voucherGroup->id)->first();
                    } else {
                        $voucher = DB::table('vouchers')
                            ->leftJoin('voucher_event_logs AS vel', 'vel.voucher_id', '=', 'vouchers.id')
                            ->leftJoin('vouchers_used AS vu', 'vu.voucher_id', '=', 'vouchers.id')
                            ->where('vouchers.voucher_group_id', $voucherGroup->id)
                            ->whereNull('vel.id')
                            ->whereNull('vu.id')
                            ->select('vouchers.*')
                            ->first();
                    }
                    if (!$voucher) {
                        continue;
                    }

                    $newEventLog = VoucherEventLog::create([
                        'voucher_event_id' => $existsEvent->id,
                        'user_id' => $userId,
                        'trigger' => $triggerId,
                        'target' => $voucherId,
                        'voucher_id' => $voucher->id,
                        'data' => $voucher->voucher,
                    ]);
                    if ($newEventLog) {
                        if ($voucherGroup->type == VoucherGroup::TYPE_MONEY || $voucherGroup->type == VoucherGroup::TYPE_PAYMENT) {
                            $notifM->createNotif(NotifConstants::VOUCHER_MONEY_SENT, $userId, [
                                'voucher' => $voucher->voucher,
                                'amount' => $voucher->value,
                            ], $voucher->voucher, "", $existsEvent->notif_template);
                        } elseif ($voucherGroup->type == VoucherGroup::TYPE_CLASS) {
                            $classesDB = DB::table('items')->whereIn('id', explode(',', $voucherGroup->ext))
                                ->select(DB::raw("GROUP_CONCAT(title SEPARATOR ', ') AS class"), DB::raw("GROUP_CONCAT(id SEPARATOR ',') AS ids"))
                                ->first();
                            if (!empty($classesDB)) {
                                $notifData = [
                                    'voucher' => $voucher->voucher,
                                    'class' => $classesDB->class,
                                ];
                                $firstId = explode(",", $classesDB->ids)[0];
                                $notifData['args'] = $firstId;
                                $notifM->createNotif(NotifConstants::VOUCHER_CLASS_SENT, $userId, $notifData, "", "", $existsEvent->notif_template);
                            }
                        } elseif ($voucherGroup->type == VoucherGroup::TYPE_PARTNER) {
                            $notifM->createNotif(NotifConstants::VOUCHER_PARTNER_SENT, $userId, [
                                'voucher' => $voucher->voucher,
                                'partner' => $voucherGroup->prefix,
                            ], $voucher->voucher, "", $existsEvent->notif_template);
                        }
                        if ($existsEvent->email_template) {
                            $user = User::find($userId);

                            //@TODO just temporary
                            if (!empty($user->email)) {
                                Mail::to($user->email)
                                ->bcc(env('MAIL_ADMIN_BCC', 'info.anylearn@gmail.com'))
                                ->send(new VoucherEventEmail([
                                    'template' => $existsEvent->email_template,
                                    'data' => [
                                        'voucher' => $voucher->voucher,
                                    ]
                                ]));
                            }
                        }
                    }
                }
            }
        } catch (Exception $e) {
            Log::error($e);
            return false;
        }
        return true;
    }
}
