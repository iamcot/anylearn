<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserSpecLink extends Model
{
    protected $table = 'user_spec_links';
    protected $fillable = ['item_specs_id', 'user_id','value', 'status'];
}
