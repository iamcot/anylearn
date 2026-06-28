<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    const TYPE_ARTICLE = 'article';
    const TYPE_CLASS = 'class';

    protected $fillable = ['tag', 'item_id', 'type',];

    public function createTagFromItem($item, $type)
    {
        $this->where('item_id', $item->id)
            ->where('type', $type)
            ->delete();

        $tags = explode(",", $item->tags);
        if (!empty($tags)) {
            foreach ($tags as $tag) {
                if (empty(trim($tag))) {
                    continue;
                }
                $this->create([
                    'tag' => trim($tag),
                    'item_id' => $item->id,
                    'type' => $type,
                ]);
            }
        }
    }
}
