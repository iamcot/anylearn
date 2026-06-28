<?php

namespace App\Services;

use App\Constants\OrderConstants;
use App\Models\Article;
use App\Models\VoucherEvent;
use Illuminate\Support\Facades\DB;


class ArticleServices
{
    public function getArticles()
    {
        return Article::where('status', 1)
            ->whereIn('type', [Article::TYPE_READ, Article::TYPE_VIDEO])
            ->orderByDesc('id')
            ->take(6)
            ->get()
            ->makeHidden(['content']);
    }
    public function getArticlesByType($type = Article::TYPE_READ) {
        return Article::where('status', 1)
            ->where('type', $type)
            ->orderby('is_hot', 'desc')
            ->orderby('id', 'desc');
    }
    public function getArticlesByTags($tags = null)
    {
        return Article::where('status', 1)
            ->where('tags', $tags)
            ->orderby('is_hot', 'desc')
            ->orderby('id', 'desc');
    }
    public function getHotArticlesByType($type = Article::TYPE_READ) {
        return Article::where('status', 1)
            ->where('type', $type)
            ->where('is_hot', 1)
            ->orderby('id', 'desc')
            ->take(6)
            ->get();
    }

    public function getPromotions()
    {
        return Article::where('type', Article::TYPE_PROMOTION)
            ->where('status', 1)
            ->orderByDesc('id')
            ->take(5)
            ->get();
    }
}
