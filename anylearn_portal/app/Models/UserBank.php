<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserBank extends Model
{
    protected $table = 'user_banks';

    protected $fillable = ['user_id', 'token_num', 'token_exp', 'card_type', 'status', 'card_uid'];
}
