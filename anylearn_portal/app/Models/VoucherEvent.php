<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoucherEvent extends Model
{
    const TYPE_CLASS = 'class';
    const TYPE_REGISTER = 'register';
    const TYPE_PARTNER = 'partner';
    const TYPE_PROMOTE = 'promote';

    protected $table = 'voucher_events';

    protected $fillable = [
        'type', 'status', 'title', 'trigger', 'targets', 'qtt', 'ref_user_id', 'commission_rate', 'notif_template', 'email_template'
    ];
}
