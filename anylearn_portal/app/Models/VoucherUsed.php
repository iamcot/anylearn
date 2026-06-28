<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoucherUsed extends Model
{
    protected $fillable = [
        'voucher_id', 'user_id', 'order_id'
    ];

    protected $table = 'vouchers_used';
}
