<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemVideoChapter extends Model
{
    protected $fillable = ['item_id', 'chapter_no', 'title', 'description', 'status'];

    protected $table = 'item_video_chapters';
}
