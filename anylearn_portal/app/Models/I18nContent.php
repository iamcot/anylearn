<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class I18nContent extends Model
{
    static $supports = ['vi', 'en'];
    const DEFAULT = 'vi';
    static $itemCols = [
        'title' => 'input',
        'short_content' => 'textarea',
        'content' => 'editor',
    ];
    static $userCols = [
        'introduce' =>'textarea',
        'full_content' =>'textarea',
    ];
    static $categoryCols = [
        'title' =>'input',
        'url' =>'input',
    ];
    static $knowledgetopicCols=[
        'title' =>'input',
        'url' =>'input',
    ];
    static $knowledge_categoriesCols=[
        'title' =>'input',
        'url' =>'input',
    ];
    static $knowledgeCols=[
        'title' =>'input',
        'url' =>'input',
        'content' =>'editor',
        'content_bot' =>'editor_bot',
    ];
    static $articleCols = [
        'title' =>'input',
        'short_content'=>'textarea',
        'content' =>'editor',
    ];
    protected $table = 'i18n_contents';
    protected $fillable = [
        'locale', 'tbl', 'col', 'content_id', 'i18n_content', 'status'
    ];
    public function i18nSave($locale, $table, $contentId, $col, $content)
    {
        $exists = $this->where('tbl', $table)
            ->where('content_id', $contentId)
            ->where('col', $col)
            ->where('locale', $locale)
            ->first();
        try {
            if (!$exists) {
                $this->create([
                    'locale' => $locale,
                    'tbl' => $table,
                    'content_id' => $contentId,
                    'col' => $col,
                    'i18n_content' => $content
                ]);
            } else {
                // dd($content);
                $exists->update([
                    'i18n_content' => isset($content) ? $content:""
                ]);
            }
        } catch (\Exception $ex) {
            return false;
        }

        return true;
    }

    public function i18nGet($locale, $table, $contentId, $col)
    {
        $exists = $this->where('tbl', $table)
            ->where('content_id', $contentId)
            ->where('col', $col)
            ->where('locale', $locale)
            ->select('i18n_content')
            ->first();
        if ($exists) {
            return $exists->i18n_content;
        }
        return "";
    }

    public function i18nGets($table, $contentId, $col)
    {
        $allContents = $this->where('tbl', $table)
            ->where('content_id', $contentId)
            ->where('col', $col)
            ->get();
        $data = [];
        foreach ($allContents as $content) {
            $data[$content->locale] = $content->i18n_content;
        }
        return $data;
    }

    public function i18nItem($itemId, $locale)
    {
        $i18n = $this->where('tbl', 'items')
            ->where('content_id', $itemId)
            ->where('locale', $locale)
            ->get();
        $data = [];
        foreach ($i18n as $row) {
            $data[$row->col] = $row->i18n_content;
        }
        return $data;
    }
    public function i18nCategory($catId, $locale)
    {
        $i18n = $this->where('tbl', 'categories')
            ->where('content_id', $catId)
            ->where('locale', $locale)
            ->get();
        // dd($i18n);
        $data = [];
        foreach ($i18n as $row) {
            $data[$row->col] = $row->i18n_content;
        }
        // dd($data);
        return $data;

    }
    public function i18nUser($userId, $locale)
    {
        $i18n = $this->where('tbl', 'users')
            ->where('content_id', $userId)
            ->where('locale', $locale)
            ->get();
        $data = [];

        foreach ($i18n as $row) {
            $data[$row->col] = $row->i18n_content;
        }
        return $data;
    }

    public function i18nTopic($id,$locale)
    {
        $i18n = $this->where('tbl', 'knowledge_topics')
            ->where('content_id', $id)
            ->where('locale', $locale)
            ->get();
        $data = [];

        foreach ($i18n as $row) {
            $data[$row->col] = $row->i18n_content;
        }
        return $data;
    }
    public function i18nknowledgeCategory($id,$locale)
    {
        $i18n = $this->where('tbl', 'knowledge_categories')
            ->where('content_id', $id)
            ->where('locale', $locale)
            ->get();
        $data = [];

        foreach ($i18n as $row) {
            $data[$row->col] = $row->i18n_content;
        }
        return $data;
    }
    public function i18nKnowledge($id,$locale)
    {
        $i18n = $this->where('tbl', 'knowledges')
            ->where('content_id', $id)
            ->where('locale', $locale)
            ->get();
        $data = [];

        foreach ($i18n as $row) {
            $data[$row->col] = $row->i18n_content;
        }
        return $data;
    }
    public function i18nArticle($id,$locale)
    {
        $i18n = $this->where('tbl', 'articles')
            ->where('content_id', $id)
            ->where('locale', $locale)
            ->get();
        $data = [];

        foreach ($i18n as $row) {
            $data[$row->col] = $row->i18n_content;
        }
        return $data;
    }
    public function i18nNotif($locale, $notifKey)
    {
    }
}
