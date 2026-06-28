<?php

namespace App\Models;

use App\Constants\ItemConstants;
use App\Constants\NotifConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Models\ItemCodeNotifTemplate;
use App\Mail\OrderSuccess;
use App\Services\ItemServices;
use App\Services\SmsServices;
use DateTime;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use FCM;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Facades\Mail;
use LaravelFCM\Facades\FCM as FacadesFCM;
use LaravelFCM\Message\OptionsBuilder;
use LaravelFCM\Message\PayloadDataBuilder;
use LaravelFCM\Message\PayloadNotificationBuilder;

class Notification extends Model
{
    const PAGESIZE = 20;
    protected $fillable = [
        'user_id', 'title', 'content', 'extra_content',
        'send', 'read', 'route', 'type', 'is_send',
    ];

    public function createNotif($type, $userId, $data, $copy = "", $route = "", $notifTemplate = "", $emailTemplate = "")
    {
        $config = config('notification.' . $type);
        $obj = [
            'type' => $type,
            'user_id' => $userId,
            'title' => $config['title'],
            'content' => $this->buildContent(!empty($notifTemplate) ? $notifTemplate : $config['template'], $data),
            'route' => !empty($route) ? $route : $config['route'],
        ];
        if (!empty($config['args']) && !empty($data['args'])) {
            $obj['extra_content'] = $data['args'];
        }
        if (!empty($config['copy']) && !empty($copy)) {
            $obj['extra_content'] = 'copy';
            $obj['route'] = $copy;
        }
        // dd($obj,$userId);
        $newNotif = $this->create($obj);
        if (!$newNotif) {
            return;
        }
        $user = User::find($userId);
        //email
        if (isset($config['email'])) {
            if (!empty($user->email)) {
                try {
                    if ($type == NotifConstants::COURSE_ACTIVATION_API || $type == NotifConstants::COURSE_ACTIVATION_MANUAL) {
                        $data['mail_content'] =  $this->buildContent(
                            !empty($emailTemplate) ? $emailTemplate : "",
                            $data
                        );
                    }
                    Mail::to($user->email)
                        ->bcc(env('MAIL_ADMIN_BCC', 'info.anylearn@gmail.com'))
                        ->send(new $config['email']($data));
                } catch (\Exception $ex) {
                    Log::error($ex);
                }
            }
        }

        if (!$user->notif_token) {
            return;
        }
        $rs = $this->firebaseMessage($newNotif, $user->notif_token);
        if ($rs) {
            $this->find($newNotif->id)->update([
                'send' => DB::raw('now()'),
                'is_send' => 1,
            ]);
        }
    }

    public function resendUnsentMessage($userId, $notifToken)
    {
        $notSendNotifs = Notification::where('user_id', $userId)
            ->where('is_send', 0)->get();

        if (!$notifToken) {
            return;
        }
        foreach ($notSendNotifs as $notif) {
            $this->firebaseMessage($notif, $notifToken);
            Notification::find($notif->id)->update([
                'is_send' => 1,
                'send' => DB::raw("now()")
            ]);
        }
    }

    public function notifActivation($itemID, $userID, $activationInfo)
    {
        $notifTemplate = ItemCodeNotifTemplate::where('item_id', $itemID)->first();
        if (ItemConstants::ACTIVATION_SUPPORT_API == $activationInfo['method']) {
            return $this->createNotif(
                NotifConstants::COURSE_ACTIVATION_API,
                $userID,
                $activationInfo,
                "",
                "",
                $notifTemplate ? $notifTemplate->notif_template : '',
                $notifTemplate ? $notifTemplate->email_template : '',
            );
        }
        return $this->createNotif(
            NotifConstants::COURSE_ACTIVATION_MANUAL,
            $userID,
            $activationInfo,
            $activationInfo['code'],
            '',
            $notifTemplate ? $notifTemplate->notif_template : '',
            $notifTemplate ? $notifTemplate->email_template : '',
        );
    }

    public function firebaseMessage($notifDB, $token)
    {
        try {
            $optionBuilder = new OptionsBuilder();
            $optionBuilder->setTimeToLive(60 * 20);

            $notificationBuilder = new PayloadNotificationBuilder($notifDB->title);
            $notificationBuilder->setBody($notifDB->content)
                ->setSound('default');

            $dataBuilder = new PayloadDataBuilder();
            if (!empty($notifDB->route)) {
                $obj = [
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
                    'screen' => $notifDB->route,
                ];
                if ($notifDB->extra_content) {
                    $obj['args'] = $notifDB->extra_content;
                }
                $dataBuilder->addData($obj);
            }

            $option = $optionBuilder->build();
            $notification = $notificationBuilder->build();
            $data = $dataBuilder->build();

            $downstreamResponse = FacadesFCM::sendTo($token, $option, $notification, $data);
            return true;
        } catch (\Exception $ex) {
            Log::error($ex);
        }
        return false;
    }

    public function notifNewUser($userId, $name)
    {
        return $this->createNotif(NotifConstants::NEW_USER, $userId, [
            'username' => $name,
            'userid' => $userId,
        ]);
    }

    public function notifNewFriend($userId, $name)
    {
        return $this->createNotif(NotifConstants::NEW_FRIEND, $userId, [
            'friend' => $name,
            'args' => $userId,
        ]);
    }

    public function notifCourseShare($item, $username, $userId)
    {
        return $this->createNotif(NotifConstants::COURSE_SHARE, $userId, [
            'username' => $username,
            'course' => $item->title,
            'args' => $item->id,
        ]);
    }

    public function notifCourseCreated($item)
    {
        $receivers = User::whereIn('role', [UserConstants::ROLE_SALE, UserConstants::ROLE_SALE_CONTENT])
            ->where('status', 1)
            ->get();
        $itemServ = new ItemServices();
        foreach ($receivers as $user) {
            $this->createNotif(NotifConstants::COURSE_CREATED, $user->id, [
                'name' => $user->name,
                'author' => $item->author,
                'class' => $item->title,
                'price' => number_format($item->price, 0, ',', '.'),
                'orgprice' => number_format($item->org_price, 0, ',', '.'),
                'args' => $item->id,
                'url' => $itemServ->classUrl($item->id),
            ]);
        }
    }

    public function notifRemindConfirms($itemId)
    {
        $registers = DB::table('order_details')->where('order_details.item_id', $itemId)
            ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->select('users.id', 'users.name', 'items.title')
            ->get();
        foreach ($registers as $register) {
            $this->notifRemindConfirm($register->id, $register->name, $register->title);
        }
    }

    public function notifRemindJoin($itemId)
    {
        $registers = DB::table('order_details')->where('order_details.item_id', $itemId)
            ->join('users', 'users.id', '=', 'order_details.user_id')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            // ->select('users.id', 'users.nae', 'items.title', 'items.date_start', 'items.time_start')
            ->select('users.id', 'users.name', 'items.title')
            ->get();
        $now = new DateTime('now');

        $nowInDay = date('Y-m-d');
        $nearestSchedule = Schedule::where('item_id', $itemId)
            ->where('date', '>=', $nowInDay)
            ->first();
        if (!$nearestSchedule) {
            return 'Không tìm thấy lịch học cho khóa ID=' . $itemId;
        }
        $diff = null;
        foreach ($registers as $register) {
            if ($diff == null) {
                $itemDate = new DateTime($nearestSchedule->date . ' ' . $nearestSchedule->time_start);
                $diff = date_diff($now, $itemDate);
            }
            if ($diff->d >= 1) {
                $this->createNotif(NotifConstants::REMIND_COURSE_GOING, $register->id, [
                    'username' => $register->name,
                    'course' => $register->title,
                    'day' => $diff->d,
                ]);
            } elseif ($diff->h >= 1) {
                $this->createNotif(NotifConstants::REMIND_COURSE_GOING_JOIN, $register->id, [
                    'username' => $register->name,
                    'course' => $register->title,
                    'time' => $diff->h . ' giờ',
                ]);
            } elseif ($diff->i >= 1) {
                $this->createNotif(NotifConstants::REMIND_COURSE_GOING_JOIN, $register->id, [
                    'username' => $register->name,
                    'course' => $register->title,
                    'time' => $diff->i . ' phút',
                ]);
            } else {
                $this->createNotif(NotifConstants::REMIND_COURSE_JOIN, $register->id, [
                    'course' => $register->title,
                ]);
            }
        }
        return true;
    }
    public function notifRemindConfirm($userId, $userName, $itemName)
    {
        return $this->createNotif(NotifConstants::REMIND_CONFIRM, $userId, [
            'username' => $userName,
            'course' => $itemName,
        ]);
    }

    public function notifCourseStatus($itemId)
    {
        $itemUpdated = Item::find($itemId);
        $author = User::find($itemUpdated->user_id);
        if ($itemUpdated->status == ItemConstants::STATUS_ACTIVE) {
            try {
                $isExists = $this->where('type', NotifConstants::COURSE_CREATED)
                    ->where('extra_content', $itemId)
                    ->count();
                if ($isExists == 0) {
                    $itemUpdated->author = $author->name;
                    $this->notifCourseCreated($itemUpdated);
                }
            } catch (Exception $ex) {
                Log::error($ex);
            }
            return $this->createNotif(NotifConstants::COURSE_APPROVED, $author->id, [
                'course' => $itemUpdated->title,
            ]);
        } else {
            return $this->createNotif(NotifConstants::COURSE_REJECTED, $author->id, [
                'course' => $itemUpdated->title,
                'username' => $author->name,
            ]);
        }
    }

    public function buildContent($template, $data)
    {
        $keys = [];
        foreach ($data as $key => $value) {
            if (!is_object($value)) {
                $keys[] = '{' . $key . '}';
            }
        }

        return str_replace(
            $keys,
            array_values($data),
            $template
        );
    }
}
