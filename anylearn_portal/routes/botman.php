<?php

$botman = app('botman');

$botman->hears('(hi|hello|chào|Xin chào|chao|hey|êi|good morning|good afternoon)', 'App\Services\Chatbot\RegularReply@handleHi');
$botman->hears('(bye|goodbye|tạm biệt|chào nhé)', 'App\Services\Chatbot\RegularReply@handleBye');

//$botman->hears('{question}', 'App\Services\Chatbot\RegularReply@handleKnowledge');

$botman->fallback(function($bot) {
    // $bot->typesAndWaits(1);
    $bot->reply('Xin lỗi nha, tôi còn bé xíu nên chưa hiểu được câu hỏi vừa rồi. Bạn có thể hỏi lại câu khác được không ạ?');
});