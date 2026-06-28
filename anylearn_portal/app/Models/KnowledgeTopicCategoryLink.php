<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KnowledgeTopicCategoryLink extends Model
{
    protected $fillable = ['knowledge_topic_id', 'knowledge_category_id',];

    protected $table = 'knowledge_topic_category_links';
}
