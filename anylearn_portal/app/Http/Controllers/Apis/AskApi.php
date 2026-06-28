<?php

namespace App\Http\Controllers\Apis;

use App\Constants\NotifConstants;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Ask;
use App\Models\AskVote;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AskApi extends Controller
{
    public function getList(Request $request)
    {
        $pageSize = $request->get('page_size', 99);
        $list = DB::table('asks')
            ->where('asks.type', Ask::TYPE_QUESTION)
            ->where('asks.status', 1)
            ->join('users', 'users.id', '=', 'asks.user_id')
            ->select('asks.*', 'users.name', 'users.image AS user_image', 'users.role AS user_role')
            ->orderBy('asks.id', 'desc')
            ->paginate($pageSize);
        return response()->json($list);
    }

    public function getThread(Request $request, $askId)
    {
        if ($request->get('api_token')) {
            $user = User::where('api_token', $request->get('api_token'))->first();
        } else {
            $user = null;
        }
        $db = DB::table('asks')
            ->where('asks.status', 1)
            ->where(function ($q) use ($askId) {
                $q->where('asks.id', $askId)
                    ->orWhere('asks.ask_id', $askId);
            })
            ->join('users', 'users.id', '=', 'asks.user_id');
        if ($user) {
            $db = $db->select(
                'asks.*',
                'users.name',
                'users.image AS user_image',
                'users.role AS user_role',
                DB::raw('(SELECT ask_votes.type FROM ask_votes where ask_votes.user_id = ' . $user->id . ' AND asks.id = ask_votes.ask_id) AS my_vote')
            );
        } else {
            $db = $db->select(
                'asks.*',
                'users.name',
                'users.image AS user_image',
                'users.role AS user_role',
                DB::raw('NULL AS my_vote')
            );
        }

        $db = $db->orderBy('asks.is_selected_answer', 'desc')->get();
        $data = [
            'question' => null,
            'comments' => [],
            'answers' => [],
        ];
        $answers = [];
        $answerIds = [];
        foreach ($db as $ask) {
            if ($ask->type == Ask::TYPE_QUESTION) {
                $data['question'] = $ask;
            }
            if ($ask->type == Ask::TYPE_COMMENT) {
                $data['comments'][] = $ask;
            }
            if ($ask->type == Ask::TYPE_ANSWER) {
                $answers[$ask->id] = json_decode(json_encode($ask), true);
                $answerIds[] = $ask->id;
            }
        }
        $answerComments = DB::table('asks')->whereIn('ask_id', $answerIds)
            ->where('asks.type', Ask::TYPE_COMMENT)
            ->where('asks.status', 1)
            ->join('users', 'users.id', '=', 'asks.user_id')
            ->select('asks.*', 'users.name', 'users.image AS user_image', 'users.role AS user_role')
            ->get();
        foreach ($answerComments as $comment) {
            $answers[$comment->ask_id]['comments'][] = $comment;
        }
        $data['answers'] = array_values($answers);
        return response()->json($data);
    }

    public function create(Request $request, $type)
    {
        $user = $request->get('_user');
        if (!in_array($type, [Ask::TYPE_ANSWER, Ask::TYPE_QUESTION, Ask::TYPE_COMMENT])) {
            return response('Dữ liệu không đúng', 400);
        }
        $content = $request->get('content');
        $title = $request->get('title');

        if (($type == Ask::TYPE_QUESTION && empty($title))  || empty($content)) {
            return response('Dữ liệu chưa đủ', 400);
        }

        if ($type == Ask::TYPE_QUESTION) {
            $existAsk = Ask::where('user_id', $user->id)
                ->where('title', $title)
                ->count();
            if ($existAsk) {
                return response('Bạn đã hỏi chủ đề này, vui lòng không gửi tiếp.', 400);
            }
        }

        $data = [
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'content' => $content,
        ];
        $askId = $request->get('ask_id', 0);
        if (intval($askId) > 0) {
            $data['ask_id'] = $askId;
        }
        $newAsk = Ask::create($data);

        if ($newAsk) {
            $notifServ = new Notification();
            if (intval($askId) > 0) {
                $parentAsk = Ask::find($askId);
                if ($newAsk->type == Ask::TYPE_ANSWER) {
                    $notifServ->createNotif(NotifConstants::ASK_NEW_ANSWER,  $parentAsk->user_id, [
                        'args' => $parentAsk->id,
                    ]);
                } elseif ($newAsk->type == Ask::TYPE_COMMENT) {
                    $question = Ask::find($parentAsk->ask_id);
                    $notifServ->createNotif(NotifConstants::ASK_NEW_COMMENT,  $parentAsk->user_id, [
                        'args' => $question->id,
                    ]);
                }
            }

            return response()->json(['result' => true]);
        }
        return response('Không thể tạo mới, vui lòng thử lại.', 500);
    }

    public function edit(Request $request, $askId)
    {
    }

    public function selectAnswer(Request $request, $askId)
    {
        $user = $request->get('_user');
        $answer = Ask::find($askId);
        if (!$answer || $answer->type != Ask::TYPE_ANSWER) {
            return response('Yêu cầu không đúng', 400);
        }
        $question = Ask::find($answer->ask_id);
        if (!$question || $question->type != Ask::TYPE_QUESTION || $question->user_id != $user->id) {
            return response('Yêu cầu không đúng', 400);
        }
        Ask::where('ask_id', $question->id)
            ->where('type', Ask::TYPE_ANSWER)
            ->update([
                'is_selected_answer' => 0,
            ]);
        $rs = $answer->update([
            'is_selected_answer' => 1,
        ]);
        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::ASK_ANSWER_SELECTED, $answer->user_id, [
            'args' => $question->id,
        ]);
        return response()->json([
            'result' => $rs > 0
        ]);
    }

    public function vote(Request $request, $askId, $type)
    {
        $user = $request->get('_user');
        if (!in_array($type, [AskVote::VOTE_LIKE, AskVote::VOTE_DISLIKE])) {
            return response("Yêu cầu không đúng", 400);
        }
        $answer = Ask::find($askId);
        if (!$answer || $answer->type != Ask::TYPE_ANSWER) {
            return response('Yêu cầu không đúng', 400);
        }
        if ($answer->user_id == $user->id) {
            // return redirect("Bạn không thể đánh giá trả lời của chính mình.", 400);
        }
        $existVote = AskVote::where('ask_id', $askId)
            ->where('user_id', $user->id)
            ->first();
        if ($existVote) {
            if ($existVote->type == $type) {
                return response('Bạn đã đánh giá', 400);
            }
            AskVote::find($existVote->id)->update([
                'type' => $type,
            ]);
            $answer->update([
                'like' => $answer->like + ($type == AskVote::VOTE_LIKE ? 1 : -1),
                'unlike' => $answer->unlike + ($type == AskVote::VOTE_DISLIKE ? 1 : -1),
            ]);
        } else {
            AskVote::create([
                'ask_id' => $askId,
                'user_id' => $user->id,
                'type' => $type,
            ]);

            $answer->update([
                'like' => $answer->like + ($type == AskVote::VOTE_LIKE ? 1 : 0),
                'unlike' => $answer->unlike + ($type == AskVote::VOTE_DISLIKE ? 1 : 0),
            ]);
        }
        return response()->json([
            'result' => true
        ]);
    }

    // public function touchStatus(Request $request, $askId, $status)
    // {
    //     $user = $request->get('_user');
    // }
}
