<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemVideoLesson extends Model
{
    protected $fillable = [
        'item_id', 'item_video_chapter_id', 'lesson_no', 'title', 'description',
        'length', 'status', 'is_free', 'type', 'type_value'
    ];

    protected $table = 'item_video_lessons';
}
