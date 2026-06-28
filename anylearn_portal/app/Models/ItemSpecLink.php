<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemSpecLink extends Model
{
    protected $table = 'item_spec_links';
    protected $fillable = ['item_specs_id', 'item_id','value', 'status'];
}
