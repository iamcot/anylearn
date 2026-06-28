<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassTeacher extends Model
{
    protected $table = 'class_teachers';
    
    protected $fillable = ['class_id', 'user_id', 'status'];
}
