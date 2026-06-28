<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemCodeNotifTemplate extends Model
{
    protected $table = 'item_codes_notif_templates';
    protected $fillable = ['email_template', 'notif_template', 'item_id'];
}
