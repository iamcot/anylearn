<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    const TYPE_READ = 'read';
    const TYPE_VIDEO = 'video';
    const TYPE_EVENT = 'event';
    const TYPE_PROMOTION = 'promotion';

    protected $fillable = [
        'user_id', 'category', 'type', 'title', 'image', 'video',
        'short_content', 'content', 'view', 'status', 'is_hot', 'tags',
    ];

}
