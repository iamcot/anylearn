<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemActivity extends Model
{
    const TYPE_TRIAL = 'trial';
    const TYPE_TEST = 'test';
    const TYPE_VISIT = 'visit';

    protected $table = 'item_activities';

    protected $fillable = [
        'item_id', 'type', 'user_id', 'date', 'note', 'status',
    ];
}
