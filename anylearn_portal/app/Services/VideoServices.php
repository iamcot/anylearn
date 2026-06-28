<?php

namespace App\Services;

use App\Constants\ItemConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Models\Item;
use App\Models\ItemUserAction;
use App\Models\ItemVideoChapter;
use App\Models\ItemVideoLesson;
use App\Models\OrderDetail;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VideoServices
{
    public function createChapter(Request $request, $input)
    {
        $result = ItemVideoChapter::create([
            'item_id' => $input['id'],
            'chapter_no' => $input['chapterno'],
            'title' => $input['chaptitle'],
            'description' => $input['chapdes'] ?? ""
        ]);
        return $result;
    }
    public function createLesson(Request $request, $input)
    {
        $result = ItemVideoLesson::create([
            'item_id' => $input['id'],
            'item_video_chapter_id' => $input['idchaplklesson'],
            'lesson_no' => $input['lessonno'],
            'title' => $input['lessonname'],
            'description' => $input['lessondes'],
            'is_free' => $input['is_free'],
            'type' => $input['typelesson'],
            'length' => $input['length'] ?? "",
            'type_value' => isset($input['youtube']) ? $input['youtube'] : (isset($input['file']) ? $input['file'] : $input['stream']),
        ]);
        return $result;
    }

    public function getlinkYT($link)
    {
        preg_match("#(?<=v=)[a-zA-Z0-9-]+(?=&)|(?<=youtube.com/embed\/)[a-zA-Z0-9-]+|(?<=v\/)[^&\n]+(?=\?)|(?<=v=)[^&\n]+|(?<=youtu.be/)[^&\n]+#", $link, $matches);
        return isset($matches[0]) ? $matches[0] : "";
    }

    public function getTeacher($itemid)
    {
        $item = Item::Where('id', $itemid)->first();
        $teacher = User::find($item->user_id);
        return $teacher;
    }

    public function checkOrder($itemid, $userId = null)
    {
        if ($userId == null && !auth()->check()) {
            return false;
        }
        $userId = $userId ?? auth()->user()->id;
        $item = Item::find($itemid);
        if ($item && $item->user_id == $userId) {
            return true;
        }
        $check = OrderDetail::where('item_id', $itemid)
        ->where('user_id', $userId)
        ->where('status', OrderConstants::STATUS_DELIVERED)
        ->count();
        return $check > 0;
    }

    public function getAllChapterAndLessons($itemId)
    {
        $videos = [];
        $chapters = ItemVideoChapter::where('item_id', $itemId)
            ->orderby('chapter_no')->get();

        foreach ($chapters as $chapter) {
            $lessons = ItemVideoLesson::where('item_video_chapter_id', $chapter->id)->orderby('lesson_no')->get();
            $videos[$chapter->chapter_no] = [
                'chapter' => $chapter,
                'lessons' => $lessons
            ];
        }
        return $videos;
    }

    public function learnPageData($itemId, $lessonId = null)
    {
        $itemData = Item::find($itemId);
        $ratings =  DB::table('item_user_actions AS iua')
            ->join('users', 'users.id', '=', 'iua.user_id')
            ->where('iua.item_id', $itemId)
            ->where('iua.type', ItemUserAction::TYPE_RATING)
            ->orderby('iua.id', 'desc')
            ->select('iua.*', DB::raw('(CASE WHEN users.name = \'Admin\' THEN \'anyLEARN\' ELSE users.name END) AS user_name'), 'users.id AS user_id', 'users.image AS user_image')
            ->get();
        $authorClasses = Item::where('status', ItemConstants::STATUS_ACTIVE)
            ->where('user_status', ItemConstants::STATUS_ACTIVE)
            ->where('id', '!=', $itemId)
            ->where('user_id', $itemData->user_id)
            ->whereNull('item_id')
            ->orderby('is_hot', 'desc')
            ->orderby('id', 'desc')
            ->take(5)->get();
        $categories = DB::table('items_categories')
            ->join('categories', 'categories.id', '=', 'items_categories.category_id')
            ->where('item_id', $itemId)
            ->select('categories.id', 'categories.url', 'categories.title')
            ->get();
        return [
            'lessonData' => ItemVideoLesson::find($lessonId),
            'itemData' => $itemData,
            'author' => User::find($itemData->user_id),
            'categories' => $categories,
            'ratings' => $ratings,
            'authorClasses' => $authorClasses,
            'videos' => $this->getAllChapterAndLessons($itemId),
            'isRegistered' => $this->checkOrder($itemId),
        ];
    }
}
