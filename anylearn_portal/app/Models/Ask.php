<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ask extends Model
{
    const TYPE_QUESTION = 'question';
    const TYPE_ANSWER = 'answer';
    const TYPE_COMMENT = 'comment';

    protected $fillable = [
        'user_id', 'ask_id', 'type', 'is_selected_answer',
        'like', 'unlike', 'is_pro_answer', 'status', 'title', 'content',
    ];

    public function newQuestion($input, $userId)
    {
    }

    public function answer($questionId, $content, $userId)
    {
    }

    public function selectAnswer($questionId, $answerId)
    {
    }

    public function vote($type, $askId, $userId)
    {
    }

    public function listQuestions($size = 3)
    {
    }

    public function listAnswers($questionId, $size = 10)
    {
    }
}
