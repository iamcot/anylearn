<?php

namespace App\Http\Controllers;

use App\Constants\FileConstants;
use App\Models\Article;
use App\Models\Knowledge;
use App\Models\KnowledgeCategory;
use App\Models\KnowledgeTopic;
use App\Models\KnowledgeTopicCategoryLink;
use App\Models\Tag;
use App\Services\FileServices;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HelpcenterController extends Controller
{
    public function index(Request $request)
    {
        $this->data['topKnowledge'] = DB::table('knowledges')
            ->join('knowledge_categories', 'knowledge_categories.id', '=', 'knowledges.knowledge_category_id')
            ->join('knowledge_topic_category_links', 'knowledge_topic_category_links.knowledge_category_id', '=', 'knowledge_categories.id')
            ->join('knowledge_topics', 'knowledge_topics.id', '=', 'knowledge_topic_category_links.knowledge_topic_id')
            ->where('knowledges.status', '>', 0)
            ->where('knowledge_categories.status', '>', 0)
            ->where('knowledge_topics.status', '>', 0)
            ->where('knowledges.type', 'buyer')
            ->orderBy('knowledges.is_top_question', 'desc')
            ->orderby('knowledges.view', 'desc')
            ->select('knowledges.*')
            ->take(8)->get();
        $this->data['topics'] = KnowledgeTopic::where('status', '>', 0)->where('type', 'buyer')->get();
        $this->data['breadcrumb'] = [
            [
                'text' => 'Trung tâm hỗ trợ',
            ]
        ];
        return view(env('TEMPLATE', '') . 'helpcenter.index', $this->data);
    }
    public function indexpartner(Request $request)
    {
        $this->data['topKnowledge'] = DB::table('knowledges')
            ->join('knowledge_categories', 'knowledge_categories.id', '=', 'knowledges.knowledge_category_id')
            ->join('knowledge_topic_category_links', 'knowledge_topic_category_links.knowledge_category_id', '=', 'knowledge_categories.id')
            ->join('knowledge_topics', 'knowledge_topics.id', '=', 'knowledge_topic_category_links.knowledge_topic_id')
            ->where('knowledges.status', '>', 0)
            ->where('knowledge_categories.status', '>', 0)
            ->where('knowledge_topics.status', '>', 0)
            ->where('knowledges.type', 'seller')
            ->orderBy('knowledges.is_top_question', 'desc')
            ->orderby('knowledges.view', 'desc')
            ->select('knowledges.*')
            ->take(10)->get();
        $this->data['topics'] = KnowledgeTopic::where('status', '>', 0)->where('type', 'seller')->get();
        $this->data['breadcrumb'] = [
            [
                'text' => 'Trung tâm hỗ trợ đối tác',
            ]
        ];
        return view(env('TEMPLATE', '') . 'helpcenter.index', $this->data);
    }
    public function topic(Request $request, $topicUrl)
    {
        $topic = KnowledgeTopic::where('url', $topicUrl)->where('status', '>', 0)->first();
        if (!$topic) {
            return redirect()->route('helpcenter');
        }
        $this->data['topic'] = $topic;
        $catsInTopic = DB::table('knowledge_topic_category_links')
            ->where('knowledge_topic_id', $topic->id)
            ->where('knowledge_categories.status', '>', 0)
            ->join('knowledge_categories', 'knowledge_categories.id', '=', 'knowledge_topic_category_links.knowledge_category_id')
            ->select('title', 'knowledge_categories.id')
            ->get();
        $catwithKnowledge = [];
        foreach ($catsInTopic as $cat) {
            $knowledges = Knowledge::where('knowledge_category_id', $cat->id)->where('status', '>', 0)
                ->get();
            if ($knowledges) {
                $catwithKnowledge[$cat->id] = [
                    'cat' => $cat->title,
                    'knowledges' => $knowledges,
                ];
            }
        }
        $this->data['breadcrumb'] = [
            [
                'url' => '/helpcenter',
                'text' => 'Trung tâm hỗ trợ',
            ],
            [
                'text' => $topic->title,
            ]
        ];
        $this->data['catWithKnowledge'] = $catwithKnowledge;
        $this->data['topics'] = KnowledgeTopic::where('id', '!=', $topic->id)->where('status', '>', 0)->get();
        return view(env('TEMPLATE', '') . 'helpcenter.topic', $this->data);
    }
    public function knowledge(Request $request, $id, $url)
    {
        $this->data['knowledge'] = Knowledge::find($id);
        $topic = DB::table('knowledge_topics')
            ->join('knowledge_topic_category_links', 'knowledge_topic_category_links.knowledge_topic_id', '=', 'knowledge_topics.id')
            ->where('knowledge_topic_category_links.knowledge_category_id', $this->data['knowledge']->knowledge_category_id)
            ->where('knowledge_topics.status', '>', 0)
            ->select('knowledge_topics.*')
            ->first();
        if (empty($topic)) {
            return redirect()->back();
        }

        $this->data['others'] = Knowledge::where('id', '!=', $id)
            ->where('status', '>', 0)
            ->where('knowledge_category_id', $this->data['knowledge']->knowledge_category_id)->get();
        $this->data['breadcrumb'] = [
            [
                'url' => '/helpcenter',
                'text' => 'Trung tâm hỗ trợ',
            ],
            [
                'url' => route('helpcenter.topic', ['url' => $topic->url]),
                'text' => $topic->title,
            ],
            [
                'text' => $this->data['knowledge']->title,
            ]
        ];
        return view(env('TEMPLATE', '') . 'helpcenter.knowledge', $this->data);
    }

    public function chatbot()
    {
        $this->data['greetingCard'] = view(env('TEMPLATE', '') . 'helpcenter.chatbot.greetingcard')->render();
        return view(env('TEMPLATE', '') . 'helpcenter.chatbot', $this->data);
    }
}
