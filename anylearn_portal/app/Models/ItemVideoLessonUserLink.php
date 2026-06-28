<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemVideoLessonUserLink extends Model
{
    protected $fillable = [
       'item_video_lesson_id', 'user_id', 'checkpoint', 'complete'
    ];

    protected $table = 'item_video_lesson_user_links';
}
