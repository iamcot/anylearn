<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemSpec extends Model
{
    protected $table = 'item_specs';
    protected $fillable = ['title', 'description', 'status'];
}
