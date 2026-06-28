<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemCategory extends Model
{
    protected $table = 'items_categories';
    protected $fillable = ['category_id', 'item_id'];
}
