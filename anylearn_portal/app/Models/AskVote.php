<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AskVote extends Model
{
    const VOTE_LIKE = 'like';
    const VOTE_DISLIKE = 'dislike';

    protected $table = 'ask_votes';
    protected $fillable = ['user_id', 'ask_id', 'type',];
}
