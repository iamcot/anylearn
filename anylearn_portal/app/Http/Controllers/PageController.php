<?php

namespace App\Http\Controllers;

use App\Constants\ConfigConstants;
use App\Constants\ItemConstants;
use App\Constants\UserConstants;
use App\Models\Article;
use App\Models\Category;
use App\Models\Configuration;
use App\Models\Item;
use App\Models\ItemUserAction;
use App\Models\User;
use App\Models\OrderDetail;
use App\Services\ItemServices;
use App\Services\UserServices;
use App\Models\I18nContent;
use App\Models\ItemVideoChapter;
use App\Models\ItemVideoLesson;
use App\Models\KnowledgeTopic;
use App\Services\CategoryServices;
use App\Services\VideoServices;
use Exception;
use Hamcrest\Core\HasToString;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Illuminate\Routing\Redirector;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Exists;
use Vanthao03596\HCVN\Models\Province;

class PageController extends Controller
{
    public function landing()
    {
        $userService = new UserServices();
        $hotSchools = $userService->hotUsers(UserConstants::ROLE_SCHOOL);
        $hotTeachers = $userService->hotUsers(UserConstants::ROLE_TEACHER);
        $this->data['schools'] = $hotSchools['list'];
        $this->data['teachers'] = $hotTeachers['list'];
        $this->data['categories'] = Category::where('status', 1)->get();
        $quotes = config('quotes', []);
        $quote = $quotes[mt_rand(0, count($quotes) - 1)];
        $this->data['quote'] = $quote;
        return view(env('TEMPLATE', '') . 'landing2', $this->data);
    }

    public function partner()
    {
        return view(env('TEMPLATE', '') . 'partner', $this->data);
    }

    public function home()
    {
        // echo Hash::make('1');
        $lastConfig = Configuration::where('key', ConfigConstants::CONFIG_HOME_POPUP_WEB)->first();
        if (!empty($lastConfig)) {
            $homePopup = json_decode($lastConfig->value, true);
            if ($homePopup['status'] == 1) {
                $this->data['popup'] = $homePopup;
            }
        }
        $quotes = config('quotes', []);
        $quote = $quotes[mt_rand(0, count($quotes) - 1)];
        $this->data['quote'] = $quote;
        $this->data['provinces'] = Province::orderby('name')->get();
        $this->data['promotions'] = Article::where('type', Article::TYPE_PROMOTION)
            ->where('status', 1)->orderby('id', 'desc')->take(5)->get();
        $this->data['promotions_title'] = env('PROMOTIONS_TITLE', 'Ưu đãi độc quyền');
        $this->data['events_title'] = env('EVENTS_TITLE', 'Sự kiện nổi bật');
        $this->data['events'] = Article::where('type', Article::TYPE_EVENT)
            ->where('status', 1)->orderby('id', 'desc')->take(5)->get();
        $temp = Article::whereIn('type', [Article::TYPE_READ, Article::TYPE_VIDEO])
            ->where('status', 1)->orderby('id', 'desc')->take(5)->get();
        $locale = App::getLocale();
        foreach ($temp as $row) {
            if ($locale != I18nContent::DEFAULT) {
                $i18 = new I18nContent();
                $item18nData = $i18->i18nArticle($row->id, $locale);
                // dd($item18nData);
                $supportCols = array_keys(I18nContent::$articleCols);
                foreach ($item18nData as $col => $content) {
                    if (in_array($col, $supportCols) && $content != "") {
                        $row->$col = $content;
                    }
                }
            }
        }
        // dd($temp);
        $this->data['articles'] = $temp;
        $homeClassesDb = Configuration::where('key', ConfigConstants::CONFIG_HOME_SPECIALS_CLASSES)->first();
        $homeClasses = [];
        if ($homeClassesDb) {
            foreach (json_decode($homeClassesDb->value, true) as $block) {
                // json_decode($block->value, true);
                // dd($block);

                if (empty($block)) {
                    continue;
                }

                $items = Item::whereIn('id', explode(",", $block['classes']))
                    ->where('status', 1)
                    ->where('user_status', 1)
                    ->orderByRaw("FIND_IN_SET(id, '" . $block['classes'] . "')")
                    ->get();
                $locale = App::getLocale();
                if (!empty($block['title'][$locale])) {
                    $homeClasses[] = [
                        'title' => $block['title'][$locale],
                        'classes' => $items
                    ];
                } else {
                    $homeClasses[] = [
                        'title' => null,
                        'classes' => $items
                    ];
                }
            }
        }
        $this->data['classes'] = $homeClasses;
        $dbNewBanners = Configuration::where('key', ConfigConstants::CONFIG_APP_BANNERS)->first();
        $newBanners = [];
        if ($dbNewBanners) {
            $newBanners = array_values(json_decode($dbNewBanners->value, true));
        }
        $this->data['banners'] = $newBanners;
        // dd($this->data['banners']);
        return view(env('TEMPLATE', '') . 'home', $this->data);
    }

    public function ref(Request $request, $code = "")
    {
        if (empty($code) || Auth::id()) {
            return redirect('/');
        }

        $refUser = User::where('refcode', $code)->first();
        if (!$refUser) {
            return redirect('/');
        }

        if ($request->get('has-account')) {
            //$this->data['isReg'] = true;
            return redirect()->route('login');
        }

        $this->data['user'] = $refUser;
        $this->data['role'] = $request->get('r');
        $this->data['newUser'] = Auth::user();

        if ($request->get('cb') && trim($request->get('cb'), '/') != url('/')) {
            session()->put('cb', $request->get('cb'));
            if (Request::create($request->get('cb'))->is('class/*')) {
                $this->data['role'] = 'member';
            }
        }

        if ($this->data['role'] == 'member') {
            return view('register.member', $this->data);
        } else if ($this->data['role'] == 'school') {
            return view('register.school', $this->data);
        } else if ($this->data['role'] == 'teacher') {
            return view('register.teacher', $this->data);
        }

        return view('register.index', $this->data);
    }

    public function _ref(Request $request, $code = "")
    {
        $data = [];
        if (empty($code)) {
            return redirect('/');
        }
        $refUser = User::where('refcode', $code)->first();
        if (!$refUser) {
            return redirect('/');
        }
        if ($request->get('has-account') || Auth::user()) {
            $data['isReg'] = true;
        }
        $data['user'] = $refUser;
        $data['newUser'] = Auth::user();
        return view('ref', $data);
    }

    public function videoPage(Request $request, $itemId, $url, $lessonId = null)
    {
        $videoServ = new VideoServices();
        $itemServ = new ItemServices();
        if ($lessonId) {
            $lesson = ItemVideoLesson::where('id', $lessonId)->where('item_id', $itemId)->first();
            if (!$lesson) {
                return redirect()->to('/')->with('notify', 'Bài học không tồn tại');
            }
            if (!$videoServ->checkOrder($itemId) && $lesson->is_free == 2) {
                return redirect()->to($itemServ->classUrl($itemId))
                    ->with(['notify' => 'Vui lòng đăng ký để xem bài học này']);
            }
        }
        $pageData = $videoServ->learnPageData($itemId, $lessonId);

        $this->data['itemId'] = $itemId;
        return view(env('TEMPLATE', '') . 'pdp.learn', $this->data, $pageData);
    }

    public function pdp(Request $request, $itemId)
    {
        if ($request->get('action') == 'activiy_trial' | $request->get('action') == 'activiy_visit' | $request->get('action') == 'activiy_test') {
            return redirect()->route('add2cart', ['class' => $itemId, 'action' => $request->get('action')]);
        }
        $itemService = new ItemServices();

        $user = Auth::user();
        if ($request->get('action') == 'rating') {
            $itemId = $request->get('class-id', 0);
            $rating = $request->get('rating', 5);
            $comment = $request->get('comment', '');
            if ($itemId <= 0) {
                return redirect()->back()->with(['notify' => 'Khóa học không tồn tại.']);
            }
            $itemUserActionM = new ItemUserAction();
            $rs = $itemUserActionM->saveRating($itemId, $user->id, $rating, $comment);
            return redirect()->back()->with(['notify' => $rs]);
        }

        try {
            $data = $itemService->pdpData($request, $itemId, $user);
            $data['breadcrumb'] = [
                [
                    'url' => $data['author']->role == 'school' ? '/schools' : '/teachers',
                    'text' => $data['author']->role == 'school' ? 'Trung Tâm' : 'Chuyên gia',
                ],
                [
                    'url' => route('classes', [
                        'role' => $data['author']->role,
                        'id' => $data['author']->id,
                    ]),
                    'text' => $data['author']->name,
                ],
                [
                    'text' => 'Khoá học',
                ]
            ];

            $data['registered'] = OrderDetail::where('item_id', $itemId)
                ->where('status', 'delivered')
                ->count();

            return view(env('TEMPLATE', '') . 'pdp.index', $data, $this->data);
        } catch (Exception $e) {
            return redirect()->to('/')->with('notify', 'Có lỗi khi tải trang');
        }
    }
    public function article(Request $request, $id)
    {
        $article = Article::find($id);
        if (!$article) {
            return redirect()->to('/');
        }
        $locale = App::getLocale();
        if ($locale != I18nContent::DEFAULT) {
            $i18 = new I18nContent();
            $item18nData = $i18->i18nArticle($article->id, $locale);
            // dd($item18nData);
            $supportCols = array_keys(I18nContent::$articleCols);
            foreach ($item18nData as $col => $content) {
                if (in_array($col, $supportCols) && $content != "") {
                    $article->$col = $content;
                }
            }
        }

        $data['article'] = $article;
        $morearticle = Article::where('status', 1)
            ->where('id', '!=', $id)
            ->orderby('id', 'desc')
            ->take(10)->get();
        foreach ($morearticle as $row) {
            if ($locale != I18nContent::DEFAULT) {
                $i18 = new I18nContent();
                $item18nData = $i18->i18nArticle($row->id, $locale);
                // dd($item18nData);
                $supportCols = array_keys(I18nContent::$articleCols);
                foreach ($item18nData as $col => $content) {
                    if (in_array($col, $supportCols) && $content != "") {
                        $row->$col = $content;
                    }
                }
            }
        }
        $data['moreArticles'] = $morearticle;
        return view(env('TEMPLATE', '') . 'pdp.article', $data);
    }

    public function search(Request $request)
    {
        if ($request->get('a') == 'search') {
            if (!in_array($request->get('o'), ['schools', 'teachers', 'classes'])) {
                return redirect()->back()->with('notify', 'Yêu cầu không hợp lệ');
            }
            return redirect()->route($request->get('o'), [
                'a' => 'search',
                'p' => $request->get('p'),
                'd' => $request->get('d'),
            ]);
        }
        return redirect()->back()->with('notify', 'Yêu cầu không hợp lệ');
    }

    public function schools(Request $request)
    {
        $list = DB::table('users')
            ->where('users.role', UserConstants::ROLE_SCHOOL)
            ->where('users.status', UserConstants::STATUS_ACTIVE)
            ->where('users.is_test', 0)
            ->where('users.is_child', 0)
            ->where('users.is_signed', UserConstants::CONTRACT_APPROVED)
            ->groupBy('users.name', 'users.image', 'users.id')
            ->select('users.name', 'users.image', 'users.id')
            ->orderBy('users.is_hot', 'desc');
        $listSearch = clone ($list);
        $data['hasSearch'] = false;
        if ($request->get('a') == 'search') {
            $data['hasSearch'] = true;
            $search = $request->get('s');
            $province = $request->get('p');
            $district = $request->get('d');
            $searchType = $request->get('t');
            $searchCategory = $request->get('c');
            if ($search) {
                $listSearch = $listSearch->where('users.name', 'LIKE', "%$search%");
            }
            if ($province) {
                $listSearch = $listSearch->leftJoin('user_locations AS ul', 'ul.user_id', '=', 'users.id')
                    ->where('ul.province_code', $province);
                if ($district) {
                    $listSearch = $listSearch->where('ul.district_code', $district);
                }
            }
            if ($searchType) {
                $listSearch  = $listSearch->join(DB::raw("(SELECT user_id, count(*) AS numrow FROM items WHERE subtype = '" . preg_replace('/[^a-z]/', '', $searchType) . "' group by user_id ) AS t1"), function ($query) {
                    $query->on("t1.user_id", "=", "users.id")
                        ->where('t1.numrow', ">", 0);
                });
            }
            if ($searchCategory) {
                $listSearch  = $listSearch->join(DB::raw("(SELECT user_id, count(*) AS numrow FROM items JOIN items_categories AS ic ON ic.item_id = items.id  WHERE ic.category_id = '" . preg_replace('/[^0-9]/', '', $searchCategory) . "' group by user_id ) AS t2"), function ($query) {
                    $query->on("t2.user_id", "=", "users.id")
                        ->where('t2.numrow', ">", 0);
                });
            }
        }
        $listSearch = $listSearch->paginate();

        if ($listSearch->total() == 0) {
            $data['searchNotFound'] = true;
            $list = $list->paginate();
        } else {
            $list = $listSearch;
            $data['searchNotFound'] = false;
        }

        $data['provinces'] = Province::orderby('name')->get();

        $data['listPaginate'] = $list->appends($request->query())->links();
        $data['list'] = [];
        foreach ($list as $user) {
            $userCategories = DB::table('items')
                ->join('items_categories', 'items_categories.item_id', '=', 'items.id')
                ->join('categories', 'categories.id', '=', 'items_categories.category_id')
                ->where('items.user_id', $user->id)
                ->groupBy('categories.id', 'categories.url', 'categories.title')
                ->select('categories.id', 'categories.url', 'categories.title')
                ->take(4)
                ->get();
            $locale = App::getLocale();
            foreach ($userCategories as $row) {
                if ($locale != I18nContent::DEFAULT) {
                    $i18 = new I18nContent();
                    $item18nData = $i18->i18nCategory($row->id, $locale);
                    // dd($item18nData);
                    $supportCols = array_keys(I18nContent::$categoryCols);
                    foreach ($item18nData as $col => $content) {
                        if (in_array($col, $supportCols) && $content != "") {
                            $row->$col = $content;
                        }
                    }
                }
            }
            $user->categories = $userCategories;
            $data['list'][] = $user;
        }

        $data['breadcrumb'] = [
            [
                'text' => 'Trung Tâm & Trường học'
            ]
        ];
        $category = Category::all();
        $locale = App::getLocale();
        foreach ($category as $row) {
            if ($locale != I18nContent::DEFAULT) {
                $i18 = new I18nContent();
                $item18nData = $i18->i18nCategory($row->id, $locale);
                // dd($item18nData);
                $supportCols = array_keys(I18nContent::$categoryCols);
                foreach ($item18nData as $col => $content) {
                    if (in_array($col, $supportCols) && $content != "") {
                        $row->$col = $content;
                    }
                }
            }
        }
        $data['categories'] = $category;
        $data['query'] = $request->input();
        return view(env('TEMPLATE', '') . 'list.school', $data);
    }

    public function teachers(Request $request)
    {
        $list = DB::table('users')
            ->where('users.role', UserConstants::ROLE_TEACHER)
            ->where('users.status', UserConstants::STATUS_ACTIVE)
            ->where('users.is_test', 0)
            ->where('users.is_child', 0)
            ->where('users.is_signed', UserConstants::CONTRACT_APPROVED)
            ->groupBy('users.name', 'users.image', 'users.id')
            ->select('users.name', 'users.image', 'users.id')
            ->orderBy('users.is_hot', 'desc');

        $data['hasSearch'] = false;
        $listSearch = clone ($list);
        if ($request->get('a') == 'search') {
            $data['hasSearch'] = true;
            $search = $request->get('s');
            $searchType = $request->get('t');
            $searchCategory = $request->get('c');
            $province = $request->get('p');
            $district = $request->get('d');
            if ($search) {
                $listSearch = $listSearch->where('users.name', 'LIKE', "%$search%");
            }
            if ($province) {
                $listSearch = $listSearch->leftJoin('user_locations AS ul', 'ul.user_id', '=', 'users.id')
                    ->where('ul.province_code', $province);
                if ($district) {
                    $listSearch = $listSearch->where('ul.district_code', $district);
                }
            }
            if ($searchType) {
                $listSearch  = $listSearch->join(DB::raw("(SELECT user_id, count(*) AS numrow FROM items WHERE subtype = '" . preg_replace('/[^a-z]/', '', $searchType) . "' group by user_id ) AS t1"), function ($query) {
                    $query->on("t1.user_id", "=", "users.id")
                        ->where('t1.numrow', ">", 0);
                });
            }
            if ($searchCategory) {
                $listSearch  = $listSearch->join(DB::raw("(SELECT user_id, count(*) AS numrow FROM items JOIN items_categories AS ic ON ic.item_id = items.id  WHERE ic.category_id = '" . preg_replace('/[^0-9]/', '', $searchCategory) . "' group by user_id ) AS t2"), function ($query) {
                    $query->on("t2.user_id", "=", "users.id")
                        ->where('t2.numrow', ">", 0);
                });
            }
        }
        $listSearch = $listSearch->paginate();

        if ($listSearch->total() == 0) {
            $data['searchNotFound'] = true;
            $list = $list->paginate();
        } else {
            $list = $listSearch;
            $data['searchNotFound'] = false;
        }

        $data['listPaginate'] = $list->appends($request->query())->links();
        $data['list'] = [];
        foreach ($list as $user) {
            $userCategories = DB::table('items')
                ->join('items_categories', 'items_categories.item_id', '=', 'items.id')
                ->join('categories', 'categories.id', '=', 'items_categories.category_id')
                ->where('items.user_id', $user->id)
                ->groupBy('categories.id', 'categories.url', 'categories.title')
                ->select('categories.id', 'categories.url', 'categories.title')
                ->take(4)
                ->get();
            $locale = App::getLocale();
            foreach ($userCategories as $row) {
                if ($locale != I18nContent::DEFAULT) {
                    $i18 = new I18nContent();
                    $item18nData = $i18->i18nCategory($row->id, $locale);
                    // dd($item18nData);
                    $supportCols = array_keys(I18nContent::$categoryCols);
                    foreach ($item18nData as $col => $content) {
                        if (in_array($col, $supportCols) && $content != "") {
                            $row->$col = $content;
                        }
                    }
                }
            }
            $user->categories = $userCategories;
            $data['list'][] = $user;
        }

        $data['breadcrumb'] = [
            [
                'text' => 'Chuyên gia & Giảng Viên'
            ]
        ];
        $data['provinces'] = Province::orderby('name')->get();
        $category = Category::all();
        $locale = App::getLocale();
        foreach ($category as $row) {
            if ($locale != I18nContent::DEFAULT) {
                $i18 = new I18nContent();
                $item18nData = $i18->i18nCategory($row->id, $locale);
                // dd($item18nData);
                $supportCols = array_keys(I18nContent::$categoryCols);
                foreach ($item18nData as $col => $content) {
                    if (in_array($col, $supportCols) && $content != "") {
                        $row->$col = $content;
                    }
                }
            }
        }
        $data['categories'] = $category;
        $data['query'] = $request->input();
        return view(env('TEMPLATE', '') . 'list.teacher', $data);
    }

    public function classes(Request $request, $role = null, $id = null)
    {
        $itemService = new ItemServices();
        $classes = DB::table('items')
            ->join('users', 'users.id', '=', 'items.user_id')
            ->where('users.status', UserConstants::STATUS_ACTIVE)
            ->where('items.type', ItemConstants::TYPE_CLASS)
            ->where('items.status', ItemConstants::STATUS_ACTIVE)
            ->where('items.user_status', '>', ItemConstants::STATUS_INACTIVE)
            ->whereNull('items.item_id')
            // ->join('items_categories', 'items_categories.item_id', '=', 'items.id')
            // ->join('categories', 'categories.id', '=', 'items_categories.category_id')
            // ->select('items.*', 'categories.id AS category_id', 'categories.url AS category_url', 'categories.title AS category_title')
            ->select('items.*')
            ->orderBy('items.is_hot', 'desc')
            ->orderBy('items.id', 'desc');

        if ($id) {
            $author = User::find($id);
            if (empty($author)) {
                return redirect()->back()->with('notify', 'Yêu cầu không hợp lệ');
            }
            $locale = App::getLocale();
            if ($locale != I18nContent::DEFAULT) {
                $i18 = new I18nContent();
                $item18nData = $i18->i18nUser($author->id, $locale);
                // dd($item18nData);
                $supportCols = array_keys(I18nContent::$userCols);
                foreach ($item18nData as $col => $content) {
                    if (in_array($col, $supportCols) && $content != "") {
                        $author->$col = $content;
                    }
                }
            }
            $data['author'] = $author;
            $classes = $classes->where('items.user_id', $id);
            $data['breadcrumb'] = [
                [
                    'url' => $data['author']->role == 'school' ? '/schools' : '/teachers',
                    'text' => $data['author']->role == 'school' ? 'Trung Tâm' : 'Chuyên gia',
                ],
                [
                    'text' => __('Các khoá học của ') . $data['author']->name,
                ]
            ];
        } else {
            $data['breadcrumb'] = [
                [
                    'text' => 'Các khoá học đang mở',
                ]
            ];
        }
        $data['hasSearch'] = false;
        $listSearch = clone ($classes);
        
        if ($request->get('a') == 'search') { 
            $data['hasSearch'] = true;
            $searchTitle = $request->get('s');
            $searchType = $request->get('t');
            $searchCategory = $request->get('c');
            $searchPrice = $request->get('price');

            if ($searchTitle) {
                $listSearch  = $listSearch->where('items.title', 'LIKE', "%$searchTitle%");
            }
            if ($searchPrice) {
                $listSearch  = $listSearch->where('items.price', '<=', $searchPrice);
            }
            if ($searchType) {
                $listSearch  = $listSearch->where('items.subtype', $searchType);
            }
            if ($searchCategory) {
                $listSearch  = $listSearch->join('items_categories AS ic', function ($query) use ($searchCategory) {
                    $query->on('ic.item_id', '=', 'items.id')
                        ->where('ic.category_id', $searchCategory);
                });
            }
        }
        $listSearch = $listSearch->paginate();

        if ($listSearch->total() == 0) {
            $data['searchNotFound'] = true;
            $classes = $classes->paginate();
        } else {
            $classes = $listSearch;
            $data['searchNotFound'] = false;
        }
        $locale = App::getLocale();
        if ($locale != I18nContent::DEFAULT) {
            $i18 = new I18nContent();
            foreach ($classes as $row) {
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
        // $data['classes'] = $classes;
        $data['classesPaginate'] = $classes->appends($request->query())->links();
        $data['classes'] = [];
        $itemUserActionM = new ItemUserAction();
        foreach ($classes as $class) {
            $class->rating = $itemUserActionM->rating($class->id);
            $data['classes'][] = $class;
        }
        $category = Category::all();
        $locale = App::getLocale();
        foreach ($category as $row) {
            if ($locale != I18nContent::DEFAULT) {
                $i18 = new I18nContent();
                $item18nData = $i18->i18nCategory($row->id, $locale);
                // dd($item18nData);
                $supportCols = array_keys(I18nContent::$categoryCols);
                foreach ($item18nData as $col => $content) {
                    if (in_array($col, $supportCols) && $content != "") {
                        $row->$col = $content;
                    }
                }
            }
        }
        // dd($category);
        $data['categories'] = $category;
        // $data['categories'] = Category::all();
        return view(env('TEMPLATE', '') . 'list.class', $data);
    }

    public function helpcenter(Request $request)
    {
        $configM = new Configuration();
        $data['member'] = $configM->getDoc(ConfigConstants::GUIDE_MEMBER);
        $data['teacher'] = $configM->getDoc(ConfigConstants::GUIDE_TEACHER);
        $data['school'] = $configM->getDoc(ConfigConstants::GUIDE_SCHOOL);
        $data['checkout'] = $configM->getDoc(ConfigConstants::GUIDE_CHECKOUT);
        if (!$request->session()->get('tab') && $request->get('tab')) {
            $request->session()->flash('tab', $request->get('tab'));
        }

        return view(env('TEMPLATE', '') . 'helpcenter.index', $data);
    }
    public function helpcenterseller(Request $request)
    {
        $configM = new Configuration();
        $data['member'] = $configM->getDoc(ConfigConstants::GUIDE_MEMBER);
        $data['teacher'] = $configM->getDoc(ConfigConstants::GUIDE_TEACHER);
        $data['school'] = $configM->getDoc(ConfigConstants::GUIDE_SCHOOL);
        $data['checkout'] = $configM->getDoc(ConfigConstants::GUIDE_CHECKOUT);
        if (!$request->session()->get('tab') && $request->get('tab')) {
            $request->session()->flash('tab', $request->get('tab'));
        }
        $data['topKnowledge'] = DB::table('knowledges')
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
        $data['topics'] = KnowledgeTopic::where('status', '>', 0)->where('type', 'seller')->get();
        $data['breadcrumb'] = [
            [
                'text' => 'Trung tâm hỗ trợ',
            ]
        ];

        return view(env('TEMPLATE', '') . 'helpcenter.partner.index', $data);
    }

    public function guide(Request $request)
    {
        $page = $request->get('p');
        if (!$page) {
            return redirect('/');
        }
        $configM = new Configuration();
        $configData = $configM->getDoc($page);
        if ($configData) {
            $data['guide'] = $configData['value'];
        } else {
            $data['guide'] = "";
        }
        return view(env('TEMPLATE', '') . 'helpcenter.guide', $data);
    }
}
