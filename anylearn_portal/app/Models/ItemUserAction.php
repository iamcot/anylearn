<?php

namespace App\Models;

use App\Constants\ActivitybonusConstants;
use App\Models\SocialPost;
use App\Services\ActivitybonusServices;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class ItemUserAction extends Model
{
    const TYPE_FAV = 'fav';
    const TYPE_RATING = 'rating';
    const TYPE_CERT = 'cert';
    const FAV_ADDED = 1;
    const FAV_REMOVED = 0;

    protected $fillable = ['item_id', 'user_id', 'type', 'value', 'extra_value'];

    protected $table = 'item_user_actions';

    public function touchFav($itemId, $userId)
    {
        $exits = $this->where('item_id', $itemId)
            ->where('user_id', $userId)
            ->where('type', self::TYPE_FAV)->first();
        if ($exits) {
            if ($exits->value == 1) {
                SocialPost::where('type', SocialPost::TYPE_CLASS_FAV)
                    ->where('user_id', $userId)
                    ->where('ref_id', $itemId)
                    ->delete();
            }
            $this->where('item_id', $itemId)
                ->where('user_id', $userId)
                ->where('type', self::TYPE_FAV)->update([
                    'value' => 1 - (int) $exits->value,
                ]);
        } else {
            $this->create([
                'item_id' => $itemId,
                'user_id' => $userId,
                'type' => self::TYPE_FAV,
                'value' => self::FAV_ADDED,
            ]);

            $item = Item::find($itemId);
            SocialPost::create([
                'type' => SocialPost::TYPE_CLASS_FAV,
                'user_id' => $userId,
                'ref_id' => $itemId,
                'image' => $item->image,
                'day' => date('Y-m-d'),
            ]);
        }

        $isFav = $this->isFav($itemId, $userId);
        return $isFav;
    }

    public function isFav($itemId, $userId)
    {
        $action = $this->where('item_id', $itemId)
            ->where('user_id', $userId)
            ->where('type', self::TYPE_FAV)->first();
        return $action && $action->value == 1 ? true : false;
    }

    public function numFav($itemId)
    {
        return $this->where('item_id', $itemId)
            ->where('type', self::TYPE_FAV)
            ->where('value', self::FAV_ADDED)
            ->count();
    }

    public function numReg($itemId)
    {
        return OrderDetail::where('item_id', $itemId)
            ->count();
    }

    public function rating($itemId)
    {
        return $this->where('item_id', $itemId)
            ->where('type', self::TYPE_RATING)
            ->avg('value');
    }

    public function saveRating($itemId, $userId, $rating, $comment)
    {
        $exits = $this->where('item_id', $itemId)
            ->where('user_id', $userId)
            ->where('type', self::TYPE_RATING)->first();

        if ($exits) {
            $this->where('item_id', $itemId)
                ->where('user_id', $userId)
                ->where('type', self::TYPE_RATING)->update([
                    'value' => $rating,
                    'extra_value' => $comment,
                ]);
            SocialPost::where('type', SocialPost::TYPE_CLASS_RATING)
                ->where('user_id', $userId)
                ->where('ref_id', $itemId)
                ->update([
                    'content' => $rating,
                    'day' => date('Y-m-d'),
                ]);
        } else {
            $this->create([
                'item_id' => $itemId,
                'user_id' => $userId,
                'type' => self::TYPE_RATING,
                'value' => $rating,
                'extra_value' => $comment,
            ]);
            SocialPost::create([
                'type' => SocialPost::TYPE_CLASS_RATING,
                'user_id' => $userId,
                'ref_id' => $itemId,
                'content' => $rating,
                'day' => date('Y-m-d'),
            ]);
        }
        if ($comment != null) {
            $activityServ = new ActivitybonusServices();
            $activityServ->updateWalletC($userId,ActivitybonusConstants::Activitybonus_Course_Feedback,'Bạn được cộng điểm vì bình luận khóa học',$itemId);
        }
        if ($rating !=null) {
            $activityServ = new ActivitybonusServices();
            $activityServ->updateWalletC($userId,ActivitybonusConstants::Activitybonus_Course_Evaluate,'Bạn được cộng điểm vì đánh giá khóa học',$itemId);
        }
        return true;
    }
}
