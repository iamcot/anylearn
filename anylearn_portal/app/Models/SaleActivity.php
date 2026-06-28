<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SaleActivity extends Model
{

    const TYPE_CHAT = 'chat';
    const TYPE_CALL = 'call';
    const TYPE_NOTE = 'note';

    protected $table = 'sale_activities';

    public $timestamps = true;

    protected $fillable = [
        'sale_id', 'member_id', 'type', 'logwork', 'content', 'status', 'created_at'
    ];
}
