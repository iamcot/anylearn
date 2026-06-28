<?php

namespace App\Console\Commands;

use App\Constants\OrderConstants;
use App\Models\ItemUserAction;
use App\Models\OrderDetail;
use App\Models\SocialPost;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixSocialPost extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'fixposts';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Data fix social posts';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        // SocialPost::TYPE_CLASS_REGISTER
        $orders = DB::table('order_details')
            ->join('orders', 'orders.id', '=', 'order_details.order_id')
            ->join('items', 'items.id', '=', 'order_details.item_id')
            ->where('order_details.status', OrderConstants::STATUS_DELIVERED)
            ->select('order_details.*', 'orders.user_id AS mainUserId', 'items.image')
            ->get();
        foreach ($orders as $order) {
            SocialPost::updateOrCreate([
                'type' => SocialPost::TYPE_CLASS_REGISTER,
                'user_id' => $order->mainUserId,
                'ref_id' => $order->item_id,
                'image' => $order->image,
                'day' => date('Y-m-d', strtotime($order->updated_at)),
                'created_at' => $order->created_at,
            ]);
            print("\nAdd " . SocialPost::TYPE_CLASS_REGISTER . " user_id:" . $order->mainUserId . ", ref_id:" . $order->item_id);
        }

        // SocialPost::TYPE_CLASS_COMPLETE
        $completes = DB::table('participations')
            ->join('items', 'items.id', '=', 'participations.item_id')
            ->groupBy('participations.item_id', 'participations.participant_user_id', 'date')
            ->select(DB::raw('MAX(participations.created_at) AS created_at'),'participations.participant_user_id', 'participations.item_id', 'items.image', DB::raw('DATE(participations.created_at) as date'))
            ->get();
        foreach ($completes as $complete) {
            SocialPost::updateOrCreate([
                'type' => SocialPost::TYPE_CLASS_COMPLETE,
                'user_id' => $complete->participant_user_id,
                'ref_id' => $complete->item_id,
                'image' => $complete->image,
                'day' => date('Y-m-d', strtotime($complete->date)),
                'created_at' => $complete->created_at,
            ]);
            print("\nAdd " . SocialPost::TYPE_CLASS_COMPLETE . " user_id:" . $complete->participant_user_id . ", ref_id:" . $complete->item_id);
        }

        // SocialPost::TYPE_CLASS_CERT & FAV & RATING
        $userActions = DB::table('item_user_actions')
            ->join('items', 'items.id', '=', 'item_user_actions.item_id')
            ->select('item_user_actions.created_at', 'item_user_actions.user_id', 'item_user_actions.type', 'item_user_actions.item_id', 'item_user_actions.value', 'items.image', 'item_user_actions.created_at')
            ->get();
        foreach ($userActions as $action) {
            $socialType = $this->socialTypeFromUserAction($action->type);
            if ($socialType) {
                SocialPost::updateOrCreate([
                    'type' => $socialType,
                    'user_id' => $action->user_id,
                    'ref_id' => $action->item_id,
                    'content' => $action->type == ItemUserAction::TYPE_RATING ? $action->value : "",
                    'image' => $action->type == ItemUserAction::TYPE_CERT ? $action->value : $action->image,
                    'day' => date('Y-m-d', strtotime($action->created_at)),
                    'created_at' => $action->created_at,
                ]);
                print("\nAdd " . $socialType . " user_id:" . $action->user_id . ", ref_id:" . $action->item_id);
            } else {
                print("\nUser Action Type $action->type chưa hỗ trợ");
            }
        }
        print("\n---ALL DONE---\n");
    }

    private function socialTypeFromUserAction($actionType)
    {
        switch ($actionType) {
            case ItemUserAction::TYPE_FAV:
                return SocialPost::TYPE_CLASS_FAV;
            case ItemUserAction::TYPE_RATING:
                return SocialPost::TYPE_CLASS_RATING;
            case ItemUserAction::TYPE_CERT:
                return SocialPost::TYPE_CLASS_CERT;
        }
        return "";
    }
}
