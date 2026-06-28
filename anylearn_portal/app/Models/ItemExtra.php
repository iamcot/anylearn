<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemExtra extends Model
{
    protected $table = 'item_extras';
    protected $fillable = [
        'item_id','title','price','status','created_at','updated_at'
    ];
}
