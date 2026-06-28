<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Commission extends Model
{
    protected $fillable = [
        'user_id', 'item_id', 'ref_user_id', 'content', 'amount', 'ref_amount', 'status',
    ];
}
