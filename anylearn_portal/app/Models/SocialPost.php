<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialPost extends Model
{
    const TYPE_CLASS_REGISTER = 'class_registered';
    const TYPE_CLASS_FAV = 'class_fav';
    const TYPE_CLASS_COMPLETE = 'class_complete';
    const TYPE_CLASS_SHARED = 'class_shared';
    const TYPE_CLASS_CERT = 'class_cert';
    const TYPE_CLASS_RATING = 'class_rating';
    
    const TYPE_ACTION_LIKE = 'action_like';
    const TYPE_ACTION_DISLIKE = 'action_dislike';
    const TYPE_ACTION_COMMENT = 'action_comment';
    const TYPE_ACTION_SHARE = 'action_share';

    const TYPE_FRIEND_NEW = 'friend_new';

    public $timestamps = true;

    protected $table = 'social_posts';
    protected $fillable = [
        'type', 'ref_id', 'user_id', 'post_id', 'content', 'image', 'status', 'day', 'created_at'
    ];
}
