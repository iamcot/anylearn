<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ZNSContent extends Model
{
    protected $table = 'zns_contents';
    protected $fillable = ['phone', 'template_id', 'template_data', 'tracking_id'];
}
