<?php

namespace App\Services\Chatbot;
use Illuminate\Support\Facades\Auth;

class RegularReply
{
    public function handleHi($bot)
    {
        $userName = Auth::check() ? Auth::user()->name : '';
        $bot->reply("Xin chào {$userName}, anyLEARN hân hạnh hỗ trợ bạn");
    }

    public function handleBye($bot)
    {
        $userName = Auth::check() ? Auth::user()->name : '';
        $bot->reply("Tạm biệt {$userName}, rất vui vì được hỗ trợ bạn, nhớ quay lại với anyLEARN sớm nhé.");
    }

    public function handleKnowledge($bot, $question) {
        if ($question) {
            $bot->reply($question);
        } else {
            $bot->reply('Xin lỗi nha, tôi còn bé xíu nên chưa hiểu được câu hỏi vừa rồi. Bạn có thể hỏi lại câu khác được không ạ?');
        }
    }
}
