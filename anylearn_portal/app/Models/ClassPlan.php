<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassPlan extends Model
{
    protected $fillable = [
        'item_id', 'title', 'start',
        'user_location_id', 'extra_info', 'status'
    ];
}
