<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemSchedulePlan extends Model
{
    protected $table = 'item_schedule_plans';

    protected $fillable = [
        'item_id', 'user_location_id', 'title', 'weekdays',
        'date_start', 'date_end', 'time_start', 'time_end', 'status', 'info',
    ];
}
