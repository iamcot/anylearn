<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserLocation extends Model
{
    protected $table = 'user_locations';
    protected $fillable = [
        'user_id', 'title', 'ward_code',
        'district_code', 'province_code', 'ward_path', 'longitude', 'latitude',
        'address', 'image', 'status', 'is_head'
    ];
}
