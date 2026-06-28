<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Constants\ConfigConstants;

class OrderItemExtra extends Model{
    protected $fillable = [
        'order_detail_id', 'item_id', 'title', 'price', 'updated_at', 'created_at'
    ];
}
