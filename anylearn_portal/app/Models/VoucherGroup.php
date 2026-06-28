<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoucherGroup extends Model
{
    protected $table = 'voucher_groups';

    protected $fillable = [
        'type', 'generate_type', 'prefix', 'qtt',
        'value_type', 'value', 'status', 'ext', 'rule_min', 'rule_max', 'length'
    ];

    const TYPE_MONEY = 'money';
    const TYPE_CLASS = 'class';
    const TYPE_PARTNER = 'partner';
    const TYPE_PAYMENT = 'payment';

    const GENERATE_MANUALLY = 'manual';
    const GENERATE_AUTO = 'auto';
    const GENERATE_PARTNER = 'partner';

    // const VALUE_FIXED = 'fixed';
    // const VALUE_PERCENT = 'percent';
}
