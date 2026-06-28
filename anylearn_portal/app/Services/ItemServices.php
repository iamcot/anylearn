<?php

namespace App\Services;

use App\Constants\ConfigConstants;
use App\Constants\FileConstants;
use App\Constants\ItemConstants;
use App\Constants\NotifConstants;
use App\Constants\OrderConstants;
use App\Constants\UserConstants;
use App\Models\ItemCodeNotifTemplate;
use App\Models\Article;
use App\Models\ClassTeacher;
use App\Models\Configuration;
use App\Models\CourseSeries;
use App\Models\I18nContent;
use App\Models\Item;
use App\Models\ItemActivity;
use App\Models\ItemCategory;
use App\Models\ItemResource;
use App\Models\ItemUserAction;
use App\Models\ItemVideoChapter;
use App\Models\ItemVideoLesson;
use App\Models\Notification;
use App\Models\OrderDetail;
use App\Models\Participation;
use App\Models\Schedule;
use App\Models\SocialPost;
use App\Models\Tag;
use App\Models\User;
use Aws\Endpoint\Partition;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ItemServices
{
    const PP = 20;
    const CONTENT_ADVANTAGE = 'content_advantage';
    const CONTENT_STANDARD = 'content_standard';
    const CONTENT_EFFICIENCY = 'content_efficiency';
    const CONTENT_ACHIVEMENT = 'content_achivement';
    const CONTENT_CSVC = 'content_csvc';
    const CONTENT_RESULT = 'content_result';
    const CONTENT_PARENTS = 'content_parents';
    const CONTENT_FEEDBACK = 'content_feedback';
    const CONTENT_OLD = 'content_old';

    public static $CONTENT_FIELDS = [
        self::CONTENT_ADVANTAGE => 'Ưu điểm nổi bật',
        self::CONTENT_STANDARD => 'Tiêu chuẩn chất lượng',
        self::CONTENT_EFFICIENCY => 'Hiệu quả đào tạo',
        self::CONTENT_ACHIVEMENT => 'Thành tựu của nhà trường',
        self::CONTENT_CSVC => 'Cơ sở vật chất',
        self::CONTENT_RESULT => 'Kết quả học sinh',
        self::CONTENT_PARENTS => 'Phản hồi của PHHS',
        self::CONTENT_FEEDBACK => 'Chia sẻ của cựu học sinh',
        self::CONTENT_OLD => 'Nội dung của định dạng cũ',
    ];
    public static $CONTENT_FIELDS_I18N = [
        'en' => [
            self::CONTENT_ADVANTAGE => 'Advantages',
            self::CONTENT_STANDARD => 'Standards',
            self::CONTENT_EFFICIENCY => 'Efficency',
            self::CONTENT_ACHIVEMENT => 'Achivements',
            self::CONTENT_CSVC => 'School Pictures',
            self::CONTENT_RESULT => 'Results',
            self::CONTENT_PARENTS => 'Parents comments',
            self::CONTENT_FEEDBACK => 'Feedbacks',
            self::CONTENT_OLD => 'Nội dung của định dạng cũ',
        ]
    ];
    public function footertopKnowledge()
    {
        $topKnowledge = DB::table('knowledges')
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
            ->take(5)->get();
        return $topKnowledge;
    }
    public function footerNews()
    {
        return Article::where('status', 1)->orderby('id', 'desc')->take(5)->get();
    }

    public function checkoutHasScheduleBox($item)
    {
        if ($item->subtype == 'video' || $item->subtype == 'digital') {
            return false;
        }
        return true;
    }

    public function checkoutHasExtrafeeBox($item)
    {
        if ($item->subtype == 'offline') {
            return true;
        }
        return false;
    }

    public function getItemsByPartner($id, $isHot = 0)
    {
        return DB::table('items')
            ->join('users', 'users.id', '=', 'items.user_id')
            ->where('items.status', ItemConstants::STATUS_ACTIVE)
            ->where('items.user_status', ItemConstants::USERSTATUS_ACTIVE)
            ->whereNull('items.item_id')
            ->where('items.is_hot', $isHot)
            ->where('items.user_id', $id)
            ->select(
                'items.id',
                'items.title',
                'items.image',
                'items.price',
                'items.short_content',
                'items.boost_score',
                'items.created_at'
            )
            ->orderByRaw('items.boost_score desc', 'items.created_at desc')
            ->take(ConfigConstants::CONFIG_NUM_ITEM_DISPLAY)
            ->get();
    }

    public function getItemReviewsByPartner($id)
    {
        return DB::table('items')
            ->join('item_user_actions as iua', 'iua.item_id', '=', 'items.id')
            ->join('users', 'users.id', '=', 'iua.user_id')
            ->where('items.user_id', $id)
            ->where('iua.type', 'rating')
            ->select(
                'iua.*',
                'users.name',
                'users.image'
            )
            ->orderByDesc('iua.created_at')
            ->take(3)
            ->get();
    }

    public function getLastRegistered($id)
    {
        return DB::table('orders')
            ->join('order_details as od', 'od.order_id', '=', 'orders.id')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->where('orders.status', OrderConstants::STATUS_DELIVERED)
            ->where('orders.user_id', $id)
            ->orderByDesc('od.created_at')
            ->first();
    }

    public function getLastCompleted($id)
    {
        return DB::table('orders')
            ->join('order_details as od', 'od.order_id', '=', 'orders.id')
            ->join('participations as pa', 'pa.schedule_id', '=', 'od.id')
            ->join('items', 'items.id', '=', 'od.item_id')
            ->where('pa.organizer_confirm', 1)
            ->where('pa.participant_confirm', 1)
            ->where('orders.user_id', $id)
            ->orderByDesc('pa.created_at')
            ->first();
    }

    public function getItemsByPartners($partners, $subtype)
    {
        $data = [];
        $commonS = new CommonServices();

        foreach ($partners as $pt) {
            $items = DB::table('items')
                ->join('items_categories as ic', 'ic.item_id', '=', 'items.id')
                ->join('categories', 'categories.id', '=', 'ic.category_id')
                ->leftjoin(
                    DB::raw('(select item_id, avg(value) as rating from item_user_actions where type = "rating" group by(item_id)) as rv'),
                    'rv.item_id',
                    'items.id'
                )
                ->whereNull('items.item_id')
                ->where('items.status', ItemConstants::STATUS_ACTIVE)
                ->where('items.user_status', ItemConstants::USERSTATUS_ACTIVE)
                ->where('items.user_id', $pt->id)
                ->where('items.subtype', $subtype)
                ->select(
                    'items.id',
                    'items.title',
                    'items.image',
                    'items.price',
                    'items.is_hot',
                    'items.boost_score',
                    'rv.rating',
                    DB::raw('group_concat(categories.title) as categories')
                )
                ->orderByRaw('items.is_hot desc, items.boost_score desc')
                ->groupBy('items.id')
                ->take(ConfigConstants::CONFIG_NUM_ITEM_DISPLAY)
                ->get();

            if (count($items) > 0) {
                $data[] = $commonS->setTemplate('/', 'Các lớp học của ' . $pt->name, $items);
            }
        }

        return $data;
    }

    public function getCategoriesBySubtype($subtype)
    {
        return DB::table('items')
            ->join('items_categories as ic', 'ic.item_id', '=', 'items.id')
            ->join('categories', 'categories.id', '=', 'ic.category_id')
            ->where('items.subtype', $subtype)
            ->select(
                'categories.id',
                'categories.title',
                DB::raw('count(items.id) as num')
            )
            ->groupBy('categories.id')
            ->orderByDesc('num')
            ->take(ConfigConstants::CONFIG_NUM_CATEGORY_DISPLAY)
            ->get();

        /*return DB::table('items')
            ->join('items_categories as ic', 'ic.item_id', '=', 'items.id')
            ->join('categories', 'categories.id', '=', 'ic.category_id')
            ->where('items.subtype', $subtype)
            ->select(
                'categories.id',
                'categories.title'
            )
            ->distinct('categories.id')
            ->get();*/
    }

    public function getItemsByCategories($categories, $subtype)
    {
        $data = [];
        $commonS = new CommonServices();

        foreach ($categories as $ct) {
            $items = DB::table('items')
                ->join('items_categories as ic', 'ic.item_id', '=', 'items.id')
                ->join('categories', 'categories.id', '=', 'ic.category_id')
                ->leftjoin(
                    DB::raw('(select item_id, avg(value) as rating from item_user_actions where type = "rating" group by(item_id)) as rv'),
                    'rv.item_id',
                    'items.id'
                )
                ->whereNull('items.item_id')
                ->where('items.status', ItemConstants::STATUS_ACTIVE)
                ->where('items.user_status', ItemConstants::USERSTATUS_ACTIVE)
                ->where('subtype', $subtype)
                ->where('ic.category_id', $ct->id)
                ->select(
                    'items.id',
                    'items.title',
                    'items.image',
                    'items.price',
                    'items.is_hot',
                    'items.boost_score',
                    'rv.rating',
                    DB::raw('group_concat(categories.title) as categories')
                )
                ->orderByRaw('items.is_hot desc, items.boost_score desc')
                ->groupBy('items.id')
                ->take(ConfigConstants::CONFIG_NUM_ITEM_DISPLAY)
                ->get();

            if (count($items) > 0) {
                $data[] = $commonS->setTemplate('/', 'Các lớp học của ' . $ct->title, $items);
            }
        }

        return $data;
    }

    public function getConfigItemsByCategories(Request $request, $allowIOS = 1)
    {
        $homeClasses = [];
        $homeClassesDb = Configuration::where('key', ConfigConstants::CONFIG_HOME_SPECIALS_CLASSES)->first();

        if ($homeClassesDb) {
            $appLocale = App::getLocale();
            foreach (json_decode($homeClassesDb->value, true) as $block) {
                if (empty($block)) {
                    continue;
                }
                $items = Item::whereIn('id', explode(",", $block['classes']))
                    ->whereNotIn("subtype", !$allowIOS ? [ItemConstants::SUBTYPE_VIDEO, ItemConstants::SUBTYPE_DIGITAL, ItemConstants::SUBTYPE_ONLINE] : [])
                    ->where('status', 1)
                    ->where('user_status', 1)
                    ->get();
                $homeClasses[] = [
                    'title' => isset($block['title'][$appLocale]) ? $block['title'][$appLocale] : json_encode($block['title']),
                    'classes' => $items
                ];
            }
        }

        return $homeClasses;
    }

    public function pdpData(Request $request, $itemId, $user)
    {
        $item = Item::find($itemId);
        if (!$item) {
            throw new Exception("Trang không tồn tại", 404);
        }

        // Auto shift date
        $today = Carbon::now();
        if ($today->format('Y-m-d') > $item->date_start) {
            if ($item->subtype == 'extra' || $item->subtype == 'offline') {
                $item->date_start = $today->addDay(30);
                $item->date_end   = null;
            } else {
                $item->date_start = $today->addDay(15);
                $item->date_end   = null;
            }

            $item->save();
        }

        $item = $item->makeVisible(['content']);
        $locale = App::getLocale() ?? I18nContent::DEFAULT;

        if ($locale != I18nContent::DEFAULT) {
            $i18 = new I18nContent();
            $item18nData = $i18->i18nItem($item->id, $locale);
            $supportCols = array_keys(I18nContent::$itemCols);

            foreach ($item18nData as $col => $content) {
                if (in_array($col, $supportCols)) {
                    if ($col == 'content') {
                        $item->content = $this->buildContentToPDP($content, $locale);
                    } else {
                        $item->$col = $content;
                    }
                }
            }
        } else {
            $item->content = $this->buildContentToPDP($item->content);
        }

        $configM = new Configuration();
        $configs = $configM->gets([ConfigConstants::CONFIG_IOS_TRANSACTION, ConfigConstants::CONFIG_BONUS_RATE, ConfigConstants::CONFIG_DISCOUNT, ConfigConstants::CONFIG_DISABLE_ANYPOINT]);
        $author = User::find($item->user_id);

        $userService = new UserServices();
        $authorCommissionRate = $item->commission_rate > 0 ? $item->commission_rate : $author->commission_rate;
        if ($item->company_commission != null) {
            $overrideConfigs = json_decode($item->company_commission, true);
            foreach ($overrideConfigs as $key => $value) {
                if ($value != null) {
                    $configs[$key] = $value;
                }
            }
        }
        $commission = $userService->calcCommission($item->price, $authorCommissionRate, $configs[ConfigConstants::CONFIG_DISCOUNT], $configs[ConfigConstants::CONFIG_BONUS_RATE]);
        $hotItems = Item::where('status', ItemConstants::STATUS_ACTIVE)
            ->where('user_status', ItemConstants::STATUS_ACTIVE)
            ->where('id', '!=', $itemId)
            ->whereNull('item_id')
            ->orderby('is_hot', 'desc')
            ->orderby('id', 'desc')
            ->take(5)->get();
        if ($locale != I18nContent::DEFAULT) {
            $i18 = new I18nContent();
            foreach ($hotItems as $row) {
                // dd($row);
                $item18nData = $i18->i18nItem($row->id, $locale);
                // dd($item18nData);
                $supportCols = array_keys(I18nContent::$itemCols);
                foreach ($item18nData as $col => $content) {
                    if (in_array($col, $supportCols) && $content != "") {
                        $row->$col = $content;
                    }
                }
            }
        }
        $plans = $this->getClassSchedulePlan($itemId);
        $numSchedule = 0; //array_sum(array_map("count", $plans));

        $itemUserActionM = new ItemUserAction();
        $item->num_favorite = $itemUserActionM->numFav($itemId);
        $item->num_cart = $itemUserActionM->numReg($itemId);
        $item->rating = $itemUserActionM->rating($itemId);
        $item->openings = [];
        $item->url = "Khoá học " . $item->title . " cực hay trên anyLEARN bạn có biết chưa " . $this->classUrl($itemId);
        $categories = DB::table('items_categories')
            ->join('categories', 'categories.id', '=', 'items_categories.category_id')
            ->where('item_id', $itemId)
            ->select('categories.id', 'categories.url', 'categories.title')
            ->get();
        foreach ($categories as $row) {
            if ($locale != I18nContent::DEFAULT) {
                $i18 = new I18nContent();
                $item18nData = $i18->i18nCategory($row->id, $locale);
                // dd($item18nData);
                $supportCols = array_keys(I18nContent::$categoryCols);
                foreach ($item18nData as $col => $content) {
                    if (in_array($col, $supportCols)) {
                        $row->$col = $content;
                    }
                }
            }
        }
        $teachers = DB::table('users')
            ->join('class_teachers AS ct', function ($join) use ($item) {
                $join->on('ct.user_id', '=', 'users.id')
                    ->where('ct.class_id', '=', DB::raw($item->id));
            })
            ->where('users.user_id', $item->user_id)
            ->where('users.role', UserConstants::ROLE_TEACHER)
            ->select('users.*')
            ->get();
        $reviews = DB::table('item_user_actions AS iua')
            ->join('users', 'users.id', '=', 'iua.user_id')
            ->where('iua.item_id', $itemId)
            ->where('iua.type', ItemUserAction::TYPE_RATING)
            ->orderby('iua.id', 'desc')
            ->select('iua.*', DB::raw('(CASE WHEN users.name = \'Admin\' THEN \'anyLEARN\' ELSE users.name END) AS user_name'), 'users.id AS user_id', 'users.image AS user_image')
            ->get();

        $videos = [];
        if ($item->subtype == 'video') {
            $videoServ = new VideoServices();
            $videos = $videoServ->getAllChapterAndLessons($itemId);
        }

        return [
            'commission' => $commission,
            'disable_anypoint' => (int)$configs[ConfigConstants::CONFIG_DISABLE_ANYPOINT],
            'author' => $author,
            'item' => $item,
            'num_schedule' => $numSchedule,
            'ios_transaction' => $configM->enableIOSTrans($request),
            'is_fav' =>  !($user instanceof User) ? false : $itemUserActionM->isFav($itemId, $user->id),
            'categories' => $categories,
            'teachers' => $teachers,
            'reviews' => $reviews,
            'videos' => $videos,
            'plans' => $plans,
            'hotItems' =>  [
                'route' => '/event',
                'title' => 'Sản phẩm liên quan',
                'list' => $hotItems
            ],
        ];
    }

    public function countCartItems($user)
    {
        return DB::table('orders')
            ->join('order_details as od', 'od.order_id', '=', 'orders.id')
            ->where('orders.user_id', $user->id)
            ->where('orders.status', OrderConstants::STATUS_NEW)
            ->groupby('orders.user_id')
            ->count();
    }

    public function getClassSchedulePlan($itemId)
    {
        $planWithLocation = DB::table('item_schedule_plans')
            ->join('user_locations', 'user_locations.id', '=', 'item_schedule_plans.user_location_id')
            ->where('item_schedule_plans.item_id', $itemId)
            ->orderby('item_schedule_plans.date_start')
            ->select('user_locations.id AS location_id', 'user_locations.title AS location_title', 'user_locations.address', 'item_schedule_plans.*')
            ->get();
        if (empty($planWithLocation)) {
            return [];
        }
        $data = [];
        foreach ($planWithLocation as $plan) {
            if (!isset($data[$plan->location_id])) {
                $data[$plan->location_id]['location'] = [
                    'id' => $plan->id,
                    'location_id' => $plan->location_id,
                    'location_title' => $plan->location_title,
                    'address' => $plan->address,
                ];
            }
            $data[$plan->location_id]['plans'][] = json_decode(json_encode($plan), true);
        }
        return $data;
    }

    public function classUrl($id)
    {
        $item = Item::find($id);
        if (!$item) {
            return "";
        }

        $url = route('page.pdp', ['id' => $id, 'url' => $item->seo_url ?? Str::slug($item->title) . '.html']);
        $url = str_replace("https://api.", "https://", $url);
        return $url;
    }

    public function classVideoUrl($id, $lessonId = null)
    {
        $item = Item::find($id);
        if (!$item) {
            return "";
        }

        $url = route('page.video', [
            'id' => $id,
            'url' => $item->seo_url ?? Str::slug($item->title) . '.html',
            'lessonId' => $lessonId
        ]);
        $url = str_replace("https://api.", "https://", $url);
        return $url;
    }

    public function articleUrl($id)
    {
        $item = Article::find($id);
        if (!$item) {
            return "";
        }
        $url = route('page.article', ['id' => $id, 'url' => Str::slug($item->title) . '.html']);
        $url = str_replace("https://api.", "https://", $url);
        return $url;
    }

    public function itemList(Request $request, $userId = null, $itemType = ItemConstants::TYPE_COURSE)
    {
        $courses = Item::where('type', $itemType)->whereNull('item_id');
        if ($userId) {
            $courses = $courses->where('user_id', $userId);
        }
        if ($request->input('id_f') > 0) {
            if ($request->input('id_t') > 0) {
                $courses = $courses->where('id', '>=', $request->input('id_f'))->where('id', '<=', $request->input('id_t'));
            } else {
                $courses = $courses->where('id', $request->input('id_f'));
            }
        }
        if ($request->input('name')) {
            $courses = $courses->where('title', 'like', '%' . $request->input('name') . '%');
        }

        if ($request->input('ref_id') > 0) {
            $courses = $courses->where('user_id', $request->input('ref_id'));
        }

        if ($request->input('date')) {
            $courses = $courses->whereDate('created_at', '>', $request->input('date'));
        }

        if ($request->input('s')) {
            $courses = $courses->where(function ($query) use ($request) {
                $query->where('items.id',  $request->input('s'));
                $query->orwhere('items.title',  'like', '%' . $request->input('s') . '%');
                $query->orwhere('items.subtype', $request->input('s'));
            });
        }

        $requester = Auth::user();
        // if ($requester->role == UserConstants::ROLE_SALE) {
        //     $courses = $courses->join('users AS author', 'author.id', '=', 'items.user_id')
        //         ->whereRaw('((items.sale_id = ?) OR (items.sale_id is null AND author.sale_id = ?))', [$requester->id, $requester->id]);
        // }
        $courses = $courses->orderby('is_hot', 'desc')
            ->orderby('id', 'desc')
            ->select(
                'items.*',
                DB::raw("(select count(*) from order_details where order_details.item_id = items.id AND order_details.status = '" . OrderConstants::STATUS_DELIVERED . "') AS sum_reg"),
                DB::raw('(select count(*) from item_user_actions where item_user_actions.item_id = items.id AND item_user_actions.type=\'rating\') AS sum_rating')
            )
            ->with('series', 'user')
            ->paginate(self::PP);
        return $courses;
    }
    public function statusText($status)
    {
        $locale = App::getLocale();
        if ($locale == "vi") {
            if ($status == ItemConstants::STATUS_ACTIVE) {
                return '<span class="text-success">Đã duyệt</span>';
            } else {
                return '<span class="text-danger">Chờ duyệt</span>';
            }
        } else {
            if ($status == ItemConstants::STATUS_ACTIVE) {
                return '<span class="text-success">Approved</span>';
            } else {
                return '<span class="text-danger">Pending</span>';
            }
        }
    }
    public function activity($user, $type, $input, $itemId)
    {
        ItemActivity::create([
            "item_id" => $itemId,
            "type" => $type,
            "user_id" => $user->id,
            "date" => $input["date"],
            "note" => $input["note"],
            "status" => ItemConstants::STATUS_INACTIVE,
        ]);
    }
    public function statusOperation($itemId, $status)
    {
        if ($status == ItemConstants::STATUS_ACTIVE) {
            return '<a class="btn btn-sm btn-danger border-0" href="' . route('item.status.touch', ['itemId' => $itemId]) . '"><i class="fas fa-lock"></i></a>';
        } else {
            return '<a class="btn btn-sm btn-success border-0" href="' . route('item.status.touch', ['itemId' => $itemId]) . '"><i class="fas fa-unlock"></i></a>';
        }
    }

    public function userStatusOperation($itemId, $status)
    {
        if ($status == ItemConstants::STATUS_INACTIVE) {
            return '<a class="btn btn-sm btn-success border-0" href="' . route('item.userstatus.touch', ['itemId' => $itemId]) . '"><i class="fas fa-unlock"></i></a>';
        } else {
            return '<a class="btn btn-sm btn-danger border-0" href="' . route('item.userstatus.touch', ['itemId' => $itemId]) . '"><i class="fas fa-lock"></i></a>';
        }
    }

    public function articleStatusOperation($itemId, $status)
    {
        if ($status == ItemConstants::STATUS_ACTIVE) {
            return '<a class="btn btn-sm btn-danger" href="' . route('article.status.touch', ['articleId' => $itemId]) . '"><i class="fas fa-lock"></i> Khóa</a>';
        } else {
            return '<a class="btn btn-sm btn-success" href="' . route('article.status.touch', ['articleId' => $itemId]) . '"><i class="fas fa-unlock"></i> Mở</a>';
        }
    }

    public function typeOperation($item)
    {
        if ($item->type == ItemConstants::TYPE_COURSE) {
            return '<a class="btn btn-sm btn-info" href="' . route('item.type.change', ['itemId' => $item->id, 'newType' => ItemConstants::TYPE_CLASS]) . '"><i class="fas fa-exchange-alt"></i> Lớp-học</a>';
        } else {
            return '<a class="btn btn-sm btn-info" href="' . route('item.type.change', ['itemId' => $item->id, 'newType' => ItemConstants::TYPE_COURSE]) . '"><i class="fas fa-exchange-alt"></i> Khóa-học</a>';
        }
    }


    public function itemResources($courseId)
    {
        $files = ItemResource::where('item_id', $courseId)->get();
        if ($files) {
            $files = $files->toArray();
        }
        $fileService = new FileServices();
        for ($i = 0; $i < sizeof($files); $i++) {
            $files[$i]['data'] = $fileService->urlFromPath(FileConstants::DISK_S3, $files[$i]['data']);
        }
        return $files;
    }

    public function buildContentToSave($content)
    {
        if (is_array($content)) {
            return json_encode($content);
        }
        return $content;
    }

    public function buildContentToEdit($content)
    {
        try {
            $contentObj = json_decode($content, true);
            if (is_array($contentObj)) {
                return $contentObj;
            }
        } catch (\Exception $ex) {
        }
        $data = self::$CONTENT_FIELDS;
        $data = array_map(function () {
        }, $data);
        $data[self::CONTENT_OLD] = $content;

        return $data;
    }

    public function buildContentToPDP($content, $locale = I18nContent::DEFAULT)
    {
        try {
            $contentObj = json_decode(json_encode(json_decode($content, true)), true);
            if (is_array($contentObj)) {
                $buildContent = "";
                foreach (self::$CONTENT_FIELDS as $type => $name) {
                    if (!empty($contentObj[$type])) {
                        $buildContent .= (($type == self::CONTENT_OLD) ? "" : "<h4 style=\"color: #01A652 !important;\">" . ($locale != I18nContent::DEFAULT && isset(self::$CONTENT_FIELDS_I18N[$locale][$type])  ? self::$CONTENT_FIELDS_I18N[$locale][$type] : $name) . "</h4>")
                            . $contentObj[$type];
                    }
                }

                return $buildContent;
            }
        } catch (\Exception $ex) {
            Log::error($ex);
        }
        return $content;
    }

    public function itemInfo($courseId)
    {
        $item = Item::find($courseId)->makeVisible(['content']);
        if (!$item) {
            return false;
        }
        $i18nModel = new I18nContent();
        foreach (I18nContent::$supports as $locale) {
            if ($locale == I18nContent::DEFAULT) {
                foreach (I18nContent::$itemCols as $col => $type) {
                    if ($col == 'content') {
                        $item->$col = $this->buildContentToEdit($item->$col);
                    }
                    $item->$col =  [I18nContent::DEFAULT => $item->$col];
                }
            } else {
                $item18nData = $i18nModel->i18nItem($courseId, $locale);
                $supportCols = array_keys(I18nContent::$itemCols);

                foreach ($supportCols as $col) {
                    if (empty($item18nData[$col])) {
                        $item->$col = $item->$col + [$locale => ""];
                    } else {
                        if ($col == 'content') {
                            $item18nData[$col] = $this->buildContentToEdit($item18nData[$col]);
                        }
                        $item->$col = $item->$col + [$locale => $item18nData[$col]];
                    }
                }
            }
        }

        $data['info'] = $item;
        $data['resource'] = $this->itemResources($courseId);
        $data['schedule'] = Schedule::where('item_id', $courseId)->get();
        // dd($data);
        return $data;
    }

    public function assignCategoryToItem($itemId, $categories)
    {
        ItemCategory::where('item_id', $itemId)->delete();
        foreach ($categories as $cat) {
            ItemCategory::create([
                'item_id' => $itemId,
                'category_id' => $cat,
            ]);
        }
    }

    public function createItem($request, $itemType = ItemConstants::TYPE_CLASS, $userApi = null)
    {
        $input = $request->all();
        $user = $userApi ?? Auth::user();

        $orgInputs = $input;

        foreach (I18nContent::$itemCols as $col => $type) {
            if (is_array($input[$col])) {
                $input[$col] = $input[$col][I18nContent::DEFAULT];
            }
        }

        $validator = $this->validate($input);
        if ($validator->fails()) {
            return $validator;
        }

        // if (isset($input['series_id']) && $input['series_id'] == ItemConstants::NEW_COURSE_SERIES && !empty($input['series'])) {
        //     $newSeriesId = $this->createCourseSeries($user->id, $input['series']);
        //     if ($newSeriesId === false) {
        //         $validator->errors()->add('series', __('Tạo chuỗi khóa học mới không thành công'));
        //         return $validator;
        //     }
        //     $input['series_id'] = $newSeriesId;
        // }

        $input['type'] = $itemType;
        $input['user_id'] = !empty($input['user_id']) ? $input['user_id'] : $user->id;

        $input['is_test'] = $user->is_test;

        if (!empty($input['nolimit_time']) && $input['nolimit_time'] == 'on') {
            $input['nolimit_time'] = 1;
        } else {
            $input['nolimit_time'] = 0;
        }

        if (!empty($input['is_paymentfee']) && $input['is_paymentfee'] == 'on') {
            $input['is_paymentfee'] = 1;
        } else {
            $input['is_paymentfee'] = 0;
        }

        if (!empty($input['allow_re_register']) && $input['allow_re_register'] == 'on') {
            $input['allow_re_register'] = 1;
        } else {
            $input['allow_re_register'] = 0;
        }
        if (!empty($input['activiy_trial']) && $input['activiy_trial'] == 'on') {
            $input['activiy_trial'] = 1;
        } else {
            $input['activiy_trial'] = 0;
        }
        if (!empty($input['activiy_test']) && $input['activiy_test'] == 'on') {
            $input['activiy_test'] = 1;
        } else {
            $input['activiy_test'] = 0;
        }
        if (!empty($input['activiy_visit']) && $input['activiy_visit'] == 'on') {
            $input['activiy_visit'] = 1;
        } else {
            $input['activiy_visit'] = 0;
        }

        if (!empty($input['ages_range'])) {
            $agesRange = explode("-", $input['ages_range']);
            if (count($agesRange) == 2) {
                $input['ages_min'] = $agesRange[0];
                $input['ages_max'] = $agesRange[1];
            }
        }

        $input['content'] = $this->buildContentToSave($input['content']);
        $newCourse = Item::create($input);

        if ($newCourse) {
            $i18nModel = new I18nContent();

            foreach (I18nContent::$supports as $locale) {
                if ($locale == I18nContent::DEFAULT) {
                    continue;
                }
                $i18nModel->i18nSave($locale, 'items', $newCourse->id, 'title', $newCourse['title']);
                foreach (I18nContent::$itemCols as $col => $type) {
                    if (isset($orgInputs[$col][$locale])) {
                        if ($col == 'content') {
                            $orgInputs[$col][$locale] = $this->buildContentToSave($orgInputs[$col][$locale]);
                        }
                        $i18nModel->i18nSave($locale, 'items', $newCourse->id, $col, $orgInputs[$col][$locale]);
                    }
                }
            }
            if (!empty($input['categories'])) {
                $this->assignCategoryToItem($newCourse->id, $input['categories']);
            }
            $tagsModel = new Tag();
            $tagsModel->createTagFromItem($newCourse, Tag::TYPE_CLASS);
            // if ($newCourse->type == ItemConstants::TYPE_COURSE) {
            // Schedule::create([
            //     'item_id' => $newCourse->id,
            //     'date' => $newCourse->date_start,
            //     'time_start' => $newCourse->time_start,
            // ]);
            $courseImage = $this->changeItemImage($request, $input['id']);
            if ($courseImage) {
                $input['image'] = $courseImage;
                Item::find($newCourse->id)->update(['image' => $courseImage]);
            }
            // }

            // Add item codes to subtype_digital
            if ($newCourse->subtype == ItemConstants::SUBTYPE_DIGITAL) {
                if (isset($input['code'])) {
                    $this->createItemCodes($newCourse->id, $input['code']);
                }
                if (isset($input['email']) || isset($input['notif'])) {
                    ItemCodeNotifTemplate::create([
                        'item_id' => $newCourse->id,
                        'email_template' => $input['email'],
                        'notif_template' => $input['notif'],
                    ]);
                }
            }
            return $newCourse->id;
        }
        return false;
    }

    public function createItemCodes($itemId, $codes)
    {
        $codes = str_replace(' ', '', $codes);
        $codes = explode("\n", str_replace(["\r\n", "\r"], "\n", $codes));

        $data = [];
        $datetime = Carbon::now();
        foreach ($codes as $code) {
            $data[] = array(
                'item_id' => $itemId,
                'code' => $code,
                'created_at' => $datetime,
                'updated_at' => $datetime,
            );
        }
        return DB::table('item_codes')->insertOrIgnore($data);
    }

    public function updateItem(Request $request, $input, $userApi = null)
    {
        $user = $userApi ?? Auth::user();
        $itemUpdate = Item::find($input['id']);
        if (!in_array($user->role, UserConstants::$modRoles) && $user->id != $itemUpdate->user_id) {
            return false;
        }
        $orgInputs = $input;
        foreach (I18nContent::$itemCols as $col => $type) {
            $input[$col] = isset($input[$col][I18nContent::DEFAULT]) ? $input[$col][I18nContent::DEFAULT] : "";
        }

        // $validator = $this->validate($input);
        // if ($validator->fails()) {
        //     return $validator;
        // }
        if (!empty($input['company'])) {
            $companyCommission = $input['company'];
            $input['company_commission'] = json_encode($companyCommission);
        }

        $canAddResource = $this->addItemResource($request, $input['id']);

        // if (isset($input['series_id']) && $input['series_id'] == ItemConstants::NEW_COURSE_SERIES && !empty($input['series'])) {
        //     $newSeriesId = $this->createCourseSeries($user->id, $input['series']);
        //     if ($newSeriesId === false) {
        //         $validator->errors()->add('series', __('Tạo chuỗi khóa học mới không thành công'));
        //         return $validator;
        //     }
        //     $input['series_id'] = $newSeriesId;
        // }
        $courseImage = $this->changeItemImage($request, $input['id']);
        if ($courseImage) {
            $input['image'] = $courseImage;
        }

        if (!empty($input['nolimit_time']) && $input['nolimit_time'] == 'on') {
            $input['nolimit_time'] = 1;
        } else {
            $input['nolimit_time'] = 0;
        }
        if (!empty($input['allow_re_register']) && $input['allow_re_register'] == 'on') {
            $input['allow_re_register'] = 1;
        } else {
            $input['allow_re_register'] = 0;
        }
        if (!empty($input['activiy_trial']) && $input['activiy_trial'] == 'on') {
            $input['activiy_trial'] = 1;
        } else {
            $input['activiy_trial'] = 0;
        }
        if (!empty($input['activiy_test']) && $input['activiy_test'] == 'on') {
            $input['activiy_test'] = 1;
        } else {
            $input['activiy_test'] = 0;
        }
        if (!empty($input['activiy_visit']) && $input['activiy_visit'] == 'on') {
            $input['activiy_visit'] = 1;
        } else {
            $input['activiy_visit'] = 0;
        }

        if (!empty($input['is_paymentfee']) && $input['is_paymentfee'] == 'on') {
            $input['is_paymentfee'] = 1;
        } else {
            $input['is_paymentfee'] = 0;
        }

        if (!empty($input['ages_range'])) {
            $agesRange = explode("-", $input['ages_range']);
            if (count($agesRange) == 2) {
                $input['ages_min'] = $agesRange[0];
                $input['ages_max'] = $agesRange[1];
            }
        }

        // if (!empty($input['subtype'])) {}

        $this->updateClassTeachers($request, $input['id']);

        $input['content'] = $this->buildContentToSave($input['content']);
        $canUpdate = $itemUpdate->update($input);

        if ($canUpdate) {
            $i18nModel = new I18nContent();
            foreach (I18nContent::$supports as $locale) {
                if ($locale == I18nContent::DEFAULT) {
                    continue;
                }
                foreach (I18nContent::$itemCols as $col => $type) {
                    if (isset($orgInputs[$col][$locale])) {
                        if ($col == 'content') {
                            $orgInputs[$col][$locale] = $this->buildContentToSave($orgInputs[$col][$locale]);
                        }
                        $i18nModel->i18nSave($locale, 'items', $itemUpdate->id, $col, $orgInputs[$col][$locale]);
                    }
                }
            }
            if (!empty($input['categories'])) {
                $this->assignCategoryToItem($itemUpdate->id, $input['categories']);
            }

            $tagsModel = new Tag();
            $tagsModel->createTagFromItem($itemUpdate, Tag::TYPE_CLASS);

            // $canUpdateSchedule = $this->updateClassSchedule($request, $input);

            // if (
            //     $itemUpdate->date_start != $input['date_start']
            //     || $itemUpdate->time_start != $input['time_start']
            //     || $itemUpdate->location != $input['location']
            // ) {
            //     $registerUsers = OrderDetail::where('item_id', $itemUpdate->id)->get();
            //     $notifServ = new Notification();
            //     foreach ($registerUsers as $user) {
            //         $notifServ->createNotif(
            //             NotifConstants::COURSE_HAS_CHANGED,
            //             $user->user_id,
            //             [
            //                 'course' => $itemUpdate->title
            //             ]
            //         );
            //     }
            // }
        }
        return $canUpdate;
    }

    public function userCourseSeries($userId)
    {
        return CourseSeries::where('user_id', $userId)
            ->orderby('id', 'desc')->get();
    }

    public function encodeDate($date)
    {
        return strtotime($date);
    }

    public function decodeDate($int)
    {
        if ($int == 0) {
            return "";
        }
        return date('Y-m-d', $int);
    }

    private function updateClassTeachers(Request $request, $itemId)
    {
        if ($request->get('tab') == 'teachers') {
            $teachers = $request->get('teachers');
            if (empty($teachers)) {
                return false;
            }
            ClassTeacher::where('class_id', $itemId)->delete();
            $userIds = array_keys($teachers);
            foreach ($userIds as $userId) {
                ClassTeacher::create([
                    'class_id' => $itemId,
                    'user_id' => $userId,
                ]);
            }
            return true;
        }

        return false;
    }

    public function updateClassSchedule(Request $request, $input)
    {
        $itemId = $input['id'];

        if ($request->get('tab') == 'schedule' && $request->get('a') == 'create-opening') {
            $opening = $request->get('opening');
            if (!empty($opening) && !empty($opening['title'])) {
                $hasRegister = OrderDetail::where('item_id', $itemId)->count();
                if (Item::where('item_id', $input['id'])->count() == 0 && $hasRegister > 0) {
                    throw new Exception('Không tạo được khai giảng mới vì khoá học mặc định này đã có học viên đăng ký');
                }
                $rs = DB::statement(
                    "INSERT INTO items (
                    title,
                    `type`,
                    subtype,
                    user_id,
                    price,
                    commission_rate,
                    got_bonus,
                    date_start,
                    time_start,
                    nolimit_time,
                    company_commission,
                    `status`,
                    is_test,
                    item_id,
                    user_location_id
                )
                SELECT
                    ?,
                    `type`,
                    subtype,
                    user_id,
                    price,
                    commission_rate,
                    got_bonus,
                    ?,
                    time_start,
                    nolimit_time,
                    company_commission,
                    1,
                    is_test,
                    ?,
                    ?
                FROM items WHERE id = ? ",
                    [$opening['title'], $opening['date_start'], $input['id'], $opening['location_id'], $input['id']]
                );

                if (Item::where('item_id', $input['id'])->count() == 1) {
                    Schedule::where('item_id', $input['id'])->delete();
                }

                return true;
            }
        } else if ($request->get('tab') == 'schedule' && $request->get('op') > 0) {
            $itemId = $request->get('op');
            $opening = $request->get('opening');
            if (!empty($opening) && !empty($opening['title'])) {
                Item::find($itemId)->update([
                    'title' => $opening['title'],
                    'user_location_id' => $opening['location_id'],
                    'date_start' => $opening['date_start']
                ]);
            }
        }

        // $defaulOpeningthasSchedule = Schedule::where('item_id', $input['id'])->count();
        // if ($defaulOpeningthasSchedule == 1) {
        //     Schedule::where('item_id', $input['id'])->update([
        //         'date' => $input['date_start'],
        //         'time_start' => $input['time_start'],
        //     ]);
        //     return true;
        // }

        $schedule = $request->get('schedule');
        if (empty($schedule)) {
            return false;
        }
        $lastItemData = Item::find($itemId);
        foreach ($schedule as $date) {
            if (empty($date['date'])) {
                continue;
            }
            if (empty($date['id'])) {
                Schedule::create([
                    'item_id' => $itemId,
                    'date' => $date['date'],
                    'time_start' => $date['time_start'],
                ]);
            } else {
                $data = [
                    'date' => $date['date'],
                    'time_start' => $date['time_start'],
                ];
                if ($lastItemData->subtype == ItemConstants::SUBTYPE_ONLINE) {
                    $data['content'] = json_encode($date['content']);
                } else {
                    $data['content'] = $date['content'];
                }
                Schedule::find($date['id'])->update($data);
            }
        }

        return true;
    }

    private function createCourseSeries($userId, $courseName)
    {
        $checkExists = CourseSeries::where('title', $courseName)->count();
        if ($checkExists > 0) {
            return false;
        }
        $newCourse = CourseSeries::create([
            'user_id' => $userId,
            'title' => $courseName,
        ]);
        if ($newCourse) {
            return $newCourse->id;
        }
        return false;
    }

    private function validate($data)
    {
        return Validator::make($data, [
            'title' => ['required', 'string', 'max:250'],
            'price' => ['required', 'numeric', 'min:0'],
            'date_start' => ['required'],
        ]);
    }

    private function itemImageUrl($path)
    {
        $fileService = new FileServices();
        return $fileService->urlFromPath(FileConstants::DISK_S3, $path);
    }

    private function changeItemImage(Request $request, $courseId)
    {
        $fileService = new FileServices();
        $file = $fileService->doUploadImage($request, 'image', FileConstants::DISK_S3, true, FileConstants::FOLDER_ITEMS . '/' . $courseId);
        if ($file !== false) {

            $this->deleteOldItemImage($courseId);
            return $file['url'];
        }
        return '';
    }

    private function addItemResource(Request $request, $courseId)
    {
        $fileService = new FileServices();
        $file = $fileService->doUploadFile($request, 'resource_data', FileConstants::DISK_S3, true, FileConstants::FOLDER_ITEMS . '/' . $courseId);
        if ($file !== false) {
            $resource = $request->get('resource');
            $db = ItemResource::create([
                'item_id' => $courseId,
                'type' => $resource['type'],
                'title' => $resource['title'],
                'desc' => $resource['desc'],
                'data' => $file['path'],
            ]);
            return true;
        }
        return false;
    }

    private function deleteOldItemImage($courseId)
    {
        $course = Item::find($courseId);
        if (!$course) {
            return true;
        }
        $fileService = new FileServices();
        $fileService->deleteUserOldImageOnS3($course->image);
        // $fileService->deleteFiles([$course->image], FileConstants::DISK_S3);
    }

    public function monthItems()
    {
        $configM = new Configuration();
        $pageSize = $configM->get(ConfigConstants::CONFIG_NUM_COURSE);
        $list = Item::whereIn('type', [ItemConstants::TYPE_COURSE, ItemConstants::TYPE_CLASS])
            // ->where('update_doc', UserConstants::STATUS_ACTIVE)
            ->where('status', UserConstants::STATUS_ACTIVE)
            ->where('date_start', '>=', date('Y-m-d'))
            ->where('user_status', ItemConstants::USERSTATUS_ACTIVE)
            ->where('is_hot', 1)
            ->orderby('date_start', 'asc')
            ->take($pageSize)->get();
        return $list;
    }

    /**
     * NOTE use order detail ID to replace scheduleId
     */
    public function comfirmJoinCourse(Request $request, $joinedUserId, $scheduleId)
    {
        $orderDetail = OrderDetail::find($scheduleId);
        if (!$orderDetail) {
            throw new Exception("Thông tin đơn hàng không chính xác!");
        }

        $item = Item::find($orderDetail->item_id);
        $itemSubytpes = [
            ItemConstants::SUBTYPE_EXTRA,
            ItemConstants::SUBTYPE_ONLINE,
            ItemConstants::SUBTYPE_OFFLINE,
            ItemConstants::SUBTYPE_PRESCHOOL,
        ];

        if (!$item || !in_array($item->subtype, $itemSubytpes)) {
            throw new Exception("Thông tin khóa học không chính xác!");
        }

        $join = Participation::where('item_id', $item->id)
            ->where('schedule_id',  $scheduleId)
            ->first();

        if (!$join) {
            // Tạo một bản ghi mới
            $join = new Participation();
            $join->item_id = $item->id;
            $join->schedule_id = $scheduleId;
            $join->participant_user_id = $joinedUserId;
            $join->organizer_user_id = $item->user_id;
            $join->organizer_confirm = 0;
            $join->participant_confirm = 0;

            $join->save();
        }

        if ($join->participant_user_id == $joinedUserId) {
            if ($join->participant_confirm > 0) {
                throw new Exception("Bạn đã xác nhận rồi");
            } else {
                $join->update([
                    "participant_confirm" => 1
                ]);
            }
        }

        if ($join->organizer_confirm > 0) {
            throw new Exception("Trường đã xác nhận rồi");
        } else {
            $join->update([
                "organizer_confirm" => 1
            ]);
        }

        $user = User::find($joinedUserId);
        $unpaiedOrders = OrderDetail::where('item_id', $item->id)
            ->where('user_id', $user->id)
            ->where('status', OrderConstants::STATUS_NEW)
            ->count();

        if ($unpaiedOrders > 0) {
            throw new Exception("Học viên chưa thanh toán cho khoá học này");
        }

        $notifServ = new Notification();
        $notifServ->createNotif(NotifConstants::COURSE_JOINED, $item->user_id, [
            'username' => $user->name,
            'course' => $item->title,
        ]);

        if ($join->participant_confirm  == 1 || $join->organizer_confirm == 1) {
            $transService = new TransactionService();
            $transService->approveTransactionsAfterPayment($scheduleId);
        }

        SocialPost::create([
            'type' => SocialPost::TYPE_CLASS_COMPLETE,
            'user_id' => $user->id,
            'ref_id' => $item->id,
            'image' => $item->image,
            'day' => date('Y-m-d'),
        ]);
    }

    // public function comfirmJoinCourse(Request $request, $joinedUserId, $scheduleId)
    // {
    //     // $checkJoin = $request->input('join');
    //     $user = User::find($joinedUserId);

    //     $orderDetail = OrderDetail::find($scheduleId);
    //     if (!$orderDetail) {
    //         throw new Exception("Không có lịch cho buổi học này");
    //         // return response("Không có lịch cho buổi học này", 404);
    //     }

    //     $item = Item::find($orderDetail->item_id);
    //     if (!$item) {
    //         throw new Exception("Khóa học không tồn tại");
    //         // return response("Khóa học không tồn tại", 404);
    //     }

    //     $itemId = $item->id;
    //     // $userC = DB::table('users')->where('user_id', $user->id)->where('is_child', 1)->orWhere('id', $user->id)->get();
    //     // $who = $userC->pluck('id')->toArray();

    //     // $isConfirmed = Participation::where('item_id', $itemId)
    //     //     ->where('schedule_id',  $orderDetail->id)
    //     //     ->where('participant_user_id', $joinedUserId)
    //     //     ->count();

    //     // if ($isConfirmed > 0) {

    //     $check = Participation::where('item_id', $itemId)
    //         ->where('schedule_id',  $scheduleId)
    //         ->where('participant_user_id', $joinedUserId)
    //         ->first();

    //     if (!$check) {
    //         // Tạo một bản ghi mới
    //         $newConfirmed = new Participation();
    //         $newConfirmed->item_id = $itemId;
    //         $newConfirmed->schedule_id = $scheduleId;
    //         $newConfirmed->participant_user_id = $joinedUserId;
    //         $newConfirmed->organizer_user_id = $item->user_id;
    //         $newConfirmed->organizer_confirm = 0;
    //         $newConfirmed->participant_confirm = 0;

    //         $newConfirmed->save();
    //     }

    //     $Confirmed = Participation::where('item_id', $itemId)
    //         ->where('schedule_id',  $scheduleId)
    //         ->where('participant_user_id', $joinedUserId)
    //         ->first();

    //     if ($Confirmed->participant_user_id == $joinedUserId) {
    //         if ($Confirmed->participant_confirm > 0) {
    //             throw new Exception("Bạn đã xác nhận rồi");
    //         } else {
    //             $Confirmed->update([
    //                 "participant_confirm" => 1
    //             ]);
    //         }
    //     }
    //     // $authUser = Auth::user();
    //     // if (
    //     //     in_array($Confirmed->organizer_user_id, $joinedUserId)
    //     //     || ($authUser && ($authUser->role == 'admin' || $authUser->role == 'mod'))
    //     // ) {
    //     if ($Confirmed->organizer_confirm > 0) {
    //         throw new Exception("Trường đã xác nhận rồi");
    //     } else {
    //         $Confirmed->update([
    //             "organizer_confirm" => 1
    //         ]);
    //     }
    //     // }
    //     // } else {
    //     //     if ($checkJoin == null) {
    //     //         throw new Exception("Bạn cần tiếp nhận học viên này trước");
    //     //     } elseif ($checkJoin == 99) {
    //     //         throw new Exception("Bạn cần phải được trường tiếp nhận, mã nhập học của bạn là: ".$scheduleId);
    //     //     }
    //     // }

    //     $unpaiedOrders = OrderDetail::where('item_id', $itemId)
    //         ->where('user_id', $user->id)
    //         ->where('status', OrderConstants::STATUS_NEW)
    //         ->count();

    //     if ($unpaiedOrders > 0) {
    //         throw new Exception("Học viên chưa thanh toán cho khoá học này");
    //         // return response("Bạn chưa thanh toán cho khoá học này", 400);
    //     }
    //     // $checkExists = Participation::where('schedule_id', $scheduleId)->first();
    //     // if ($checkExists == null) {
    //     //     $rs = Participation::create([
    //     //         'item_id' => $itemId,
    //     //         'schedule_id' =>  $scheduleId,
    //     //         'organizer_user_id' => $item->user_id,
    //     //         'participant_user_id' => $joinedUserId,
    //     //         'organizer_confirm' => 0,
    //     //         'participant_confirm' => 0,
    //     //     ]);
    //     // }
    //     $author = User::find($item->user_id);

    //     $notifServ = new Notification();
    //     $notifServ->createNotif(NotifConstants::COURSE_JOINED, $author->id, [
    //         'username' => $user->name,
    //         'course' => $item->title,
    //     ]);

    //     if ($user->is_child) {
    //         $orderUser = User::find($user->user_id);
    //     } else {
    //         $orderUser = $user;
    //     }

    //     // approve direct and indirect commission
    //     $transService = new TransactionService();
    //     $directCommission = DB::table('transactions')
    //         ->join('order_details AS od', 'od.id', '=', 'transactions.order_id')
    //         ->join('orders', 'orders.id', '=', 'od.order_id')
    //         ->where('orders.user_id', $orderUser->id)
    //         ->where('od.item_id', $item->id)
    //         ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_PENDING)
    //         ->where('transactions.type', ConfigConstants::TRANSACTION_COMMISSION)
    //         ->where('transactions.user_id', $orderUser->id)
    //         ->select('transactions.*')
    //         ->first();

    //     if ($directCommission) {
    //         $addmoney = Participation::where('item_id', '=', $itemId)
    //             ->where('schedule_id', '=', $scheduleId)
    //             ->where('participant_user_id', '=', $joinedUserId)->first();

    //         if ($addmoney->organizer_confirm == 1 || $addmoney->participant_confirm == 1) {
    //             $transService->approveWalletcTransaction($directCommission->id);
    //         } else {
    //             return;
    //         }
    //     }

    //     // approve up tree transaction, just 1 level
    //     $refUser = User::find($orderUser->user_id);
    //     if ($refUser) {
    //         if ($directCommission) {
    //             $inDirectCommission = DB::table('transactions')
    //                 ->join('orders', 'orders.id', '=', 'transactions.order_id')
    //                 ->where('orders.status', OrderConstants::STATUS_DELIVERED)
    //                 ->where('transactions.order_id', $directCommission->order_id)
    //                 ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_PENDING)
    //                 ->where('transactions.type', ConfigConstants::TRANSACTION_COMMISSION)
    //                 ->where('transactions.user_id', $refUser->id)
    //                 ->select('transactions.*')
    //                 ->first();
    //         }

    //         if ($inDirectCommission) {
    //             $transService->approveWalletcTransaction($inDirectCommission->id);
    //         }
    //     }

    //     $trans = DB::table('transactions')
    //         ->join('order_details AS od', function ($query) use ($user) {
    //             $query->on('od.id', '=', 'transactions.order_id')
    //                 ->where('od.user_id', '=', $user->id);
    //         })
    //         ->join('orders', 'orders.id', '=', 'od.order_id')
    //         ->where('orders.status', OrderConstants::STATUS_DELIVERED)
    //         ->where('orders.user_id', $orderUser->id)
    //         ->where('od.item_id', $item->id)
    //         ->where('transactions.user_id', $author->id)
    //         ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_PENDING)
    //         ->where('transactions.type', ConfigConstants::TRANSACTION_PARTNER)
    //         ->select('transactions.*')
    //         ->first();

    //     // approve author transaction
    //     if ($trans) {
    //         if ($item->subtype == "extra" || $item->subtype == "offline") {
    //             $transService->approveWalletmTransaction($trans->id);
    //         }

    //         //approve ref_seller transaction
    //         $refSeller = DB::table('transactions')
    //             ->where('transactions.order_id', $trans->order_id)
    //             ->where('transactions.type', ConfigConstants::TRANSACTION_COMMISSION)
    //             ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_PENDING)
    //             ->first();

    //         if ($refSeller) {
    //             $transService->approveWalletmTransaction($refSeller->id);
    //         }

    //         // approve foundation transaction
    //         DB::table('transactions')
    //             ->where('transactions.order_id', $trans->order_id)
    //             ->where('transactions.status', ConfigConstants::TRANSACTION_STATUS_PENDING)
    //             ->where('transactions.type', ConfigConstants::TRANSACTION_FOUNDATION)
    //             ->update([
    //                 'status' => ConfigConstants::TRANSACTION_STATUS_DONE
    //             ]);
    //     }

    //     //TODO: khi get user social post can lay them record cua child id
    //     SocialPost::create([
    //         'type' => SocialPost::TYPE_CLASS_COMPLETE,
    //         'user_id' => $user->id,
    //         'ref_id' => $itemId,
    //         'image' => $item->image,
    //         'day' => date('Y-m-d'),
    //     ]);
    // }

    public function DigitalCourse(Request $request, $courseId)
    {
        $input = $request->all();
        $courseService = new ItemServices();
        $isDigitalCourse = Item::where('id', $courseId)
            ->where('subtype', ItemConstants::SUBTYPE_DIGITAL)
            ->first();
        if ($isDigitalCourse) {
            if (isset($input['code'])) {
                $courseService->createItemCodes($courseId, $input['code']);
            }

            if (isset($input['email']) || isset($input['notif'])) {
                $notifTemplate = ItemCodeNotifTemplate::where('item_id', $courseId)->first();
                $notifTemplate->update([
                    'email_template' => $input['email'] != "" ? $input['email'] : null,
                    'notif_template' => $input['notif'] != "" ? $input['notif'] : null,
                ]);
            }
        }
    }
}
