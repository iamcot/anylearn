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

class KnowledgeController extends Controller
{
    public function category(Request $request)
    {
        $this->data['categories'] = KnowledgeCategory::paginate();
        return view('knowledge.category.index', $this->data);
    }

    public function categoryEdit(Request $request, $id = null)
    {
        if ($request->get('save')) {
            $category = $request->get('title');
            $type = $request->get('type');
            $url = Str::slug($category);
            $catId = $request->get('id');
            $data = [
                'title' => $category,
                'url' => $url,
                'type'=> $type,
            ];
            if ($catId) {
                KnowledgeCategory::find($catId)->update($data);
            } else {
                KnowledgeCategory::create($data);
            }
            return redirect()->route('knowledge.category')->with('notify', 'Thành công');
        }
        if ($id) {
            $this->data['category'] = KnowledgeCategory::find($id);
        }
        return view('knowledge.category.form', $this->data);
    }

    public function knowledge(Request $request)
    {
        $this->data['articles'] = Knowledge::paginate();
        return view('knowledge.article.index', $this->data);
    }

    public function knowledgeEdit(Request $request, $id = null)
    {
        if ($request->get('save')) {
            $title = $request->get('title');
            $url = Str::slug($title);
            $articleId = $request->get('id');
            $catId = $request->get('knowledge_category_id');
            $content = $request->get('content');
            $contentBot = $request->get('content_bot');
            $type = $request->get('type');
            $data = [
                'title' => $title,
                'url' => $url,
                'knowledge_category_id' => $catId,
                'content' => $content,
                'content_bot' => $contentBot,
                'type'=> $type,
            ];
            if ($articleId) {
                Knowledge::find($articleId)->update($data);
            } else {
                Knowledge::create($data);
            }
            return redirect()->route('knowledge')->with('notify', 'Thành công');
        }
        if ($id) {
            $this->data['article'] = Knowledge::find($id);
        }
        $this->data['categories'] = KnowledgeCategory::all();
        return view('knowledge.article.form', $this->data);
    }

    public function topic(Request $request)
    {
        $this->data['categories'] = KnowledgeTopic::paginate();
        return view('knowledge.topic.index', $this->data);
    }

    public function topicEdit(Request $request, $id = null)
    {
        if ($request->get('save')) {
            $category = $request->get('title');
            $url = Str::slug($category);
            $catId = $request->get('id');
            $type = $request->get('type');
            $data = [
                'title' => $category,
                'url' => $url,
                'type'=>$type
            ];
            if ($catId) {
                KnowledgeTopic::find($catId)->update($data);
            } else {
                KnowledgeTopic::create($data);
            }
            return redirect()->route('knowledge.topic')->with('notify', 'Thành công');
        }
        if ($id) {
            $this->data['category'] = KnowledgeTopic::find($id);
        }
        return view('knowledge.topic.form', $this->data);
    }

    public function topicCategory(Request $request, $topicId) {
        if ($request->get('save')) {
            $categories = $request->get('categories');
            KnowledgeTopicCategoryLink::where('knowledge_topic_id', $topicId)->delete();
            if ($categories) {
                $catIds = array_keys($categories);
                foreach($catIds as $id) {
                    KnowledgeTopicCategoryLink::create([
                        'knowledge_topic_id' => $topicId,
                        'knowledge_category_id' => $id
                    ]);
                }
            }
            return redirect()->route('knowledge.topic.category', ['id' => $topicId])->with('notify', 'Thành công');
        }
        $top = KnowledgeTopic::find($topicId);
        $this->data['topic'] =$top;
        $this->data['categories'] = KnowledgeCategory::all()->where('type',$top->type);
        $links = KnowledgeTopicCategoryLink::where('knowledge_topic_id', $topicId)->get();
        $this->data['topicCategories'] = [];
        if ($links) {
            foreach($links as $link) {
                $this->data['topicCategories'][] = $link->knowledge_category_id;
            }
        }
        $this->data['hasBack'] = route('knowledge.topic');
        return view('knowledge.topic.category', $this->data);
    }

    public function statusTouch($userId)
    {
        $rs = Article::find($userId)->update(['status' => DB::raw('1 - status')]);
        return redirect()->back()->with('notify', $rs);
    }
}
