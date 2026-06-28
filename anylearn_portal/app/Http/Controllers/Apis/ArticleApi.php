<?php

namespace App\Http\Controllers\Apis;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Ask;
use App\Models\Article;
use App\Models\Tag;
use App\Services\ArticleServices;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ArticleApi extends Controller
{
    public function articles(Request $request) {
        $articles = new \StdClass();
        $articleServices = new ArticleServices();

        $art = $articleServices
            ->getArticlesByType($request->get('type') ? $request->get('type'): Article::TYPE_READ)
            ->paginate($request->get('size', 12), ['*'], 'page', $request->get('page'));
        if ($request->get('tags') !=null) {
            $art = $articleServices
            ->getArticlesByTags($request->get('tags') ? $request->get('tags') : null)
            ->paginate($request->get('size', 12), ['*'], 'page', $request->get('page'));
        }
        $articles->data = $art->items();
        $articles->numPage = ceil($art->total() / $request->get('size', 12));
        $articles->currentPage = (int) $request->get('page', 1);
        $tags = Tag::where('type', 'article')
            ->where('status', 1)
            ->distinct('tag')
            ->pluck('tag');
        $hotEvent = $articleServices->getHotArticlesByType(Article::TYPE_EVENT);
        return response()->json([
            'hotArticles' => $articleServices->getHotArticlesByType(),
            'articles' => $articles,
            'hotEvent' => $hotEvent,
            'tags' => $tags,
        ]);
    }

    public function index()
    {
        $videos = Article::where('status', 1)
            ->where('type', Article::TYPE_VIDEO)
            ->orderby('is_hot', 'desc')
            ->orderby('id', 'desc')
            ->take(3)
            ->get();
        $reads = Article::where('status', 1)
            ->where('type', Article::TYPE_READ)
            ->orderby('is_hot', 'desc')
            ->orderby('id', 'desc')
            ->take(3)
            ->get();
        $asks =  DB::table('asks')
            ->where('asks.type', Ask::TYPE_QUESTION)
            ->where('asks.status', 1)
            ->join('users', 'users.id', '=', 'asks.user_id')
            ->select('asks.*', 'users.name', 'users.image AS user_image', 'users.role AS user_role')
            ->orderBy('asks.id', 'desc')
            ->take(3)->get();
        return response()->json([
            'reads' => $reads,
            'videos' => $videos,
            'asks' => $asks,
        ]);
    }

    public function loadByType(Request $request, $type)
    {
        $data = Article::where('status', 1)
            ->where('type', $type)
            ->orderby('is_hot', 'desc')
            ->orderby('id', 'desc')
            ->paginate(12);

        return response()->json($data);
    }
    public function loadArticle($id)
    {
        $data = Article::find($id);
        if (!$data) {
            return response('Bài viết không có', 404);
        }
        $relateArticles = Article::where('status', 1)
            ->where('type', $data->type)
            ->where('id', '!=', $data->id)
            ->orderBy('id', 'desc')->take(5)->get();
        $data->related = $relateArticles;
        return response()->json($data);
    }

    public function quote()
    {
        $quotes = config('quotes', []);
        $quote = $quotes[mt_rand(0, count($quotes) - 1)];
        return response()->json($quote);
    }
}
