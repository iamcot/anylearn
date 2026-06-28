<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Knowledge extends Model
{
    protected $fillable = ['title', 'url', 'description', 'status', 'knowledge_category_id', 'content', 'content_bot', 'thumb_up', 'thumb_down', 'is_top_question','type'];

    protected $table = 'knowledges';
}
