<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseSeries extends Model
{
    protected $fillable = [
        'user_id', 'title', 'content', 'status'    
    ];
}
