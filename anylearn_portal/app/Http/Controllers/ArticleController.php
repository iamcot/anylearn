<?php

namespace App\Http\Controllers;

use App\Constants\FileConstants;
use App\Models\Article;
use App\Models\I18nContent;
use App\Models\Tag;
use App\Services\FileServices;
use App\Services\UserServices;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ArticleController extends Controller
{
    public function list(Request $request)
    {
        $data = Article::orderby('id', 'desc')->paginate(20);
        $locale = App::getLocale();
        $i18nModel = new I18nContent();
        // change vi->en
        foreach ($data as $row) {
            foreach (I18nContent::$supports as $locale) {
                if ($locale == I18nContent::DEFAULT) {
                    foreach (I18nContent::$articleCols as $col => $type) {
                        $row->$col =  [I18nContent::DEFAULT => $row->$col];
                    }
                } else {
                    $item18nData = $i18nModel->i18nArticle($row->id, $locale);
                    $supportCols = array_keys(I18nContent::$articleCols);

                    foreach ($supportCols as $col) {
                        if (empty($item18nData[$col])) {
                            $row->$col = $row->$col + [$locale => ""];
                        } else {
                            $row->$col = $row->$col + [$locale => $item18nData[$col]];
                        }
                    }
                }
            }
        }
        // dd($data);
        $this->data['list'] = $data;
        return view('article.list', $this->data);
    }

    public function create(Request $request)
    {
        $i18n = new I18nContent();
        if ($request->get('save')) {
            foreach (I18nContent::$supports as $locale) {
                $input = $request->all();
                $fileService = new FileServices();
                $file = $fileService->doUploadImage($request, 'image', FileConstants::DISK_S3, true, 'articles');
                if ($file !== false) {
                    $input['image'] = $file['url'];
                }
                // dd($input);
                $title = $input['title'];
                $short_content = $input['short_content'];
                $content = $input['content'];
                $data = [
                    '_token' => $input['_token'],
                    'id' => $input['id'],
                    'title' => $title[$locale],
                    'short_content' => $short_content[$locale],
                    'content' => $content[$locale],
                    'type' => $input['type'],
                    'image' => isset($input['image'])?$input['image']:null,
                    'video' => $input['video'],
                    'tags' => $input['tags']
                ];
                $data['user_id'] = Auth::user()->id;
                if ($locale == I18nContent::DEFAULT) {
                    $newArticle = Article::create($data);
                }
                $id = $newArticle->id;
                if ($locale != I18nContent::DEFAULT) {
                    $i18n->i18nSave($locale, 'articles', $id, 'title', $data['title']);
                    $i18n->i18nSave($locale, 'articles', $id, 'short_content', $data['short_content']);
                    $i18n->i18nSave($locale, 'articles', $id, 'content', $data['content']);;
                }
                $tagsModel = new Tag();
                $tagsModel->createTagFromItem($newArticle, Tag::TYPE_ARTICLE);
            }
            return redirect()->route('article')->with('notify', $newArticle ? 1 : 0);
        }
        return view('article.form', $this->data);
    }

    public function edit(Request $request, $id)
    {
        $locale = App::getLocale();
        $i18n = new I18nContent();
        if ($request->get('save')) {
            foreach (I18nContent::$supports as $locale) {
            $input = $request->all();
            $fileService = new FileServices();
            $file = $fileService->doUploadImage($request, 'image', FileConstants::DISK_S3, true, 'articles');
            if ($file !== false) {
                $input['image'] = $file['url'];
            }
            $title = $input['title'];
            $short_content = $input['short_content'];
            $content = $input['content'];
            $data = [
                '_token' => $input['_token'],
                'id' => $input['id'],
                'title' => $title[$locale],
                'short_content' => $short_content[$locale],
                'content' => $content[$locale],
                'type' => $input['type'],
                'image' => isset($input['image'])?$input['image']:Article::find($id)->image,
                'video' => $input['video'],
                'tags' => $input['tags']
            ];
            $data['user_id'] = Auth::user()->id;
            if ($locale != I18nContent::DEFAULT) {
                    $i18n->i18nSave($locale, 'articles', $id, 'title', $data['title']);
                    $i18n->i18nSave($locale, 'articles', $id, 'short_content', $data['short_content']);
                    $i18n->i18nSave($locale, 'articles', $id, 'content', $data['content']);
            } else {
                $newArticle = Article::find($id)->update($data);
            }
            $tagsModel = new Tag();
            $tagsModel->createTagFromItem(Article::find($id), Tag::TYPE_ARTICLE);
        }
            return redirect()->route('article')->with('notify', $newArticle ? 1 : 0);
        }
        $data = Article::find($id);
        // dd($data);
        if ($data != null) {
            foreach (I18nContent::$supports as $locale) {
                if ($locale == I18nContent::DEFAULT) {
                    foreach (I18nContent::$articleCols as $col => $type) {
                        $data->$col = [I18nContent::DEFAULT => $data->$col];
                    }
                } else {
                    $supportCols = array_keys(I18nContent::$articleCols);
                    $item18nData = $i18n->i18nArticle($data->id, $locale);
                    foreach ($supportCols as $col) {
                        if (empty($item18nData[$col])) {
                            $data->$col = $data->$col + [$locale => ""];
                        } else {
                            $data->$col = $data->$col + [$locale => $item18nData[$col]];
                        }
                    }
                }
            }
        }

        $this->data['article'] = $data;
        return view('article.form', $this->data);
    }

    public function statusTouch($userId)
    {
        $rs = Article::find($userId)->update(['status' => DB::raw('1 - status')]);
        return redirect()->back()->with('notify', $rs);
    }
}
