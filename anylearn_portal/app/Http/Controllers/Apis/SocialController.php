<?php

namespace App\Http\Controllers\Apis;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Models\SocialPost;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SocialController extends Controller
{
    const PER_PAGE = 10;

    public function profile(Request $request, $userId = null)
    {
        if ($userId) {
            $user = User::find($userId);
        } else {
            $user = $request->get('_user');
        }
        if (!$user) {
            return response('Profile không tồn tại.', 400);
        }
        $user = User::select('id', 'name', 'first_name', 'dob', 'image', 'banner', 'role', 'introduce')->find($user->id);

        $dbPosts = SocialPost::where('user_id', $user->id)
            ->whereNotIn('type', [SocialPost::TYPE_ACTION_COMMENT, SocialPost::TYPE_ACTION_LIKE, SocialPost::TYPE_ACTION_DISLIKE, SocialPost::TYPE_ACTION_SHARE])
            ->where('status', 1)
            ->orderby('day', 'desc')
            ->paginate(self::PER_PAGE);

        $dbPosts->getCollection()->transform(function ($value) use ($user, $userId) {
            $value->title = $this->titleFromPostType($userId ? $user->name : __("Bạn"), $value->type, $value->ref_id);
            $value->description = "";
            $value->like_counts = SocialPost::where('type', SocialPost::TYPE_ACTION_LIKE)->where('post_id', $value->id)->count();
            $value->share_counts = SocialPost::where('type', SocialPost::TYPE_ACTION_SHARE)->where('post_id', $value->id)->count();
            $value->comment_counts = SocialPost::where('type', SocialPost::TYPE_ACTION_COMMENT)->where('post_id', $value->id)->count();
            $value->user = $user;
            $value->comments = [];
            $value->like = [];
            $value->isliked = SocialPost::where('type', SocialPost::TYPE_ACTION_LIKE)
                            ->where('user_id', $user->id)
                            ->where('post_id', $value->id)
                            ->count();
            return $value;
        });
        return response()->json([
            'profile' => $user,
            'posts' => $dbPosts,
        ]);
    }

    public function post(Request $request, $postId)
    {
        $data = SocialPost::find($postId);
        if (!$data) {
            return response("Không có dữ liệu.", 404);
        }
        $user = User::select('id', 'name', 'first_name', 'dob', 'image', 'banner', 'role', 'introduce')->find($data->user_id);

        $data->title = $this->titleFromPostType($user->name, $data->type, $data->ref_id);
        $data->description = "";
        $data->like_counts = SocialPost::where('type', SocialPost::TYPE_ACTION_LIKE)->where('post_id', $postId)->count();
        $data->share_counts = SocialPost::where('type', SocialPost::TYPE_ACTION_SHARE)->where('post_id', $postId)->count();
        $data->user = $user;
        $data->comments = DB::table('social_posts')
        ->join('users', 'users.id', '=', 'social_posts.user_id')
        ->where('type', SocialPost::TYPE_ACTION_COMMENT)
        ->where('post_id', $postId)
        ->select('social_posts.*', 'users.first_name AS comment_user_first_name', 'users.name AS comment_user_name', 'users.image AS comment_user_image', 'users.id AS comment_user_id')
        ->get();
        $data->like = [];
        $data->isliked = SocialPost::where('type', SocialPost::TYPE_ACTION_LIKE)
                            ->where('user_id', $user->id)
                            ->where('post_id', $postId)
                            ->count();
        return response()->json($data);
    }

    public function action(Request $request, $postId)
    {
        $user = $request->get('_user');
        $actionObj = $request->all();
        $postDB = SocialPost::find($postId);
        if (!$postDB) {
            return response("Post không có.", 404);
        }
        if (!isset($actionObj['type']) || !in_array($actionObj['type'], [SocialPost::TYPE_ACTION_LIKE, SocialPost::TYPE_ACTION_DISLIKE, SocialPost::TYPE_ACTION_COMMENT, SocialPost::TYPE_ACTION_SHARE])) {
            return response("Action không hỗ trợ.", 400);
        }
        if ($actionObj['type'] == SocialPost::TYPE_ACTION_DISLIKE) {
            SocialPost::where('post_id', $postId)
                ->where('type', SocialPost::TYPE_ACTION_LIKE)
                ->where('user_id', $user->id)
                ->delete();
            return response()->json(['result' => 1]);
        }
        $newAction = SocialPost::create([
            'post_id' => $postId,
            'ref_id' => $postId,
            'user_id' => $user->id,
            'type' => $actionObj['type'],
            'content' => isset($actionObj['content']) ? $actionObj['content'] : null,
            'day' => date('Y-m-d'),
        ]);
        if ($newAction) {
            return response()->json(['result' => 1]);
        }
        return response("Có lỗi xảy ra, vui lòng thử lại.", 400);
    }

    private function titleFromPostType($userName, $action, $refId)
    {
        switch ($action) {
            case SocialPost::TYPE_CLASS_REGISTER:
                $item = Item::find($refId);
                return __(":name đã đăng ký khóa học :class", [
                    'name' => $userName,
                    'class' => $item->title
                ]);
            case SocialPost::TYPE_CLASS_COMPLETE:
                $item = Item::find($refId);
                return __(":name đã hoàn thành khóa học :class", [
                    'name' => $userName,
                    'class' => $item->title
                ]);
            case SocialPost::TYPE_CLASS_CERT:
                $item = Item::find($refId);
                return __(":name đã đạt được chứng chỉ hoàn thành khóa học :class", [
                    'name' => $userName,
                    'class' => $item->title
                ]);
            case SocialPost::TYPE_CLASS_FAV:
                $item = Item::find($refId);
                return __(":name đã ưa thích khóa học :class", [
                    'name' => $userName,
                    'class' => $item->title
                ]);
            case SocialPost::TYPE_CLASS_REGISTER:
                $item = Item::find($refId);
                return __(":name đã chia sẻ khóa học :class", [
                    'name' => $userName,
                    'class' => $item->title
                ]);
            case SocialPost::TYPE_CLASS_RATING:
                $item = Item::find($refId);
                return __(":name đã đánh giá khóa học :class", [
                    'name' => $userName,
                    'class' => $item->title
                ]);
        }
        return "";
    }
}
