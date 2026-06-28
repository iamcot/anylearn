<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

use App\Http\Middleware\Role;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

// Route::get('/', 'PageController@home')->name('home');
Route::get('/info', 'PageController@landing')->name('info');
Route::get('/partner', 'PageController@partner');
Route::get('/landing', 'PageController@landing');
Route::get('/ref/{code}', 'PageController@ref')->name('refpage');
Route::post('/ref/{code}', 'Auth\RegisterController@registerRefPage');
Route::middleware(['auth', 'access.mod'])->get('/zalo-oa', 'ConfigController@zaloOA')->name('zalo.oa');
Route::middleware(['auth', 'access.mod'])->get('/zalo', 'ConfigController@zalo');

Route::any('/bot', function() {
    app('botman')->listen();
});
Route::get('/bot/chat', 'HelpcenterController@chatbot');

// Route::get('/search', 'PageController@search')->name('search');
Route::get('/schools', 'PageController@schools')->name('schools');
Route::get('/classes', 'PageController@classes')->name('allclasses');
Route::get('/teachers', 'PageController@teachers')->name('teachers');
Route::get('/{role}/{id}/classes', 'PageController@classes')->name('classes');

//public page
Route::get('/privacy', 'ConfigController@privacy');
Route::get('/helpcenter', 'PageController@helpcenter');
Route::get('/partner/helpcenter', 'PageController@helpcenterseller')->name('helpcenter.parnter');


Route::get('/login/{provider}', 'Auth\LoginController@redirectToProvider');
Route::get('/login/facebook/callback', 'Auth\LoginController@handleFacebookCallback');

Route::get('/login/apple/callback', 'Auth\LoginController@handleAppleCallback');

Route::any('/class/{itemId}/{url}/video/{lessonId}', 'PageController@videoPage')->name('page.video');
//Route::any('/class/{itemId}/{url}', 'PageController@pdp')->name('page.pdp');
// Route::get('/article/{id}/{url}', 'PageController@article')->name('page.article');
Route::get('/location-tree/{level}/{parentCode}', 'ConfigController@locationTree')->name('location-tree');

Route::any('/payment-notify/{payment}', 'TransactionController@notify')->name('checkout.notify');
Route::any('/payment-return/{payment}', 'TransactionController@return')->name('checkout.return');
Route::get('/payment-result/{payment}', 'TransactionController@paymentResult')->name('checkout.result');

Route::get('/guide', 'PageController@guide')->name('guide');

Route::get('/helpcenter', 'HelpcenterController@index')->name('helpcenter');
Route::get('/helpcenter/{topic}', 'HelpcenterController@topic')->name('helpcenter.topic');
Route::get('/helpcenter/{id}/{url}.html', 'HelpcenterController@knowledge')->name('helpcenter.knowledge');

Route::get('/help/partner', 'HelpcenterController@indexpartner')->name('helpcenter.parnter.index');
// Route::get('/partner/helpcenter/{topic}', 'HelpcenterController@topic')->name('helpcenter.parnter.topic');
// Route::get('/partner/helpcenter/{id}/{url}.html', 'HelpcenterController@knowledge')->name('helpcenter.parnter.knowledge');

Route::any('/password/otp', 'Auth\OTPResetPasswordController@showOtpRequestForm')->name('password.otp');
Route::any('/password/otp/reset', 'Auth\OTPResetPasswordController@sendOtp')->name('password.resetotp');
Route::any('/password/update', 'Auth\OTPResetPasswordController@updatePassword')->name('password.updateotp');

Route::get('/anylog.gif', 'CrmController@anylog')->name('anylog');


// For existing pages - v3
Route::middleware('version')->group(function () {
    Route::get('/', 'PageController@home')->name('home');
    Route::get('/search', 'PageController@search')->name('search');
    Route::any('/class/{itemId}/{url}', 'PageController@pdp')->name('page.pdp');
    Route::get('/article/{id}/{url}', 'PageController@article')->name('page.article');
    Route::get('/articles', 'PageController@article');

    // Route::middleware(['auth'])->prefix('me')->group(function () {
    //     Route::get('/', 'DashboardController@meDashboard')->name('me.dashboard');
    //     Route::any('/admitstudent', 'UserController@admitstudent')->name('me.admitstudent');
    //     Route::get('/profile', 'UserController@meProfile')->name('me.profile');
    //     // Route::any('/admitstudent', 'UserController@admitstudent')->name('me.admitstudent');
    //     // Route::get('/profile', 'UserController@meProfile')->name('me.profile');
    //     // Route::get('/class', 'ClassController@list')->name('me.class');
    //     // Route::any('/class/create', 'ClassController@create')->name('me.class.create');
    //     // Route::any('/withdraw','UserController@withdraw')->name('me.withdraw');
    //     Route::get('/child', 'UserController@meProfile');
    //     Route::get('/friend-list', 'UserController@meProfile');
    //     Route::get('/confirm-course', 'UserController@meProfile');
    //     Route::get('/calendar', 'UserController@meProfile');
    //     Route::get('/pending-course', 'UserController@meProfile');
    //     Route::get('/order-return', 'UserController@meProfile');
    //     Route::get('/trans', 'UserController@meProfile');

    //     Route::get('/class', 'ClassController@list')->name('me.class');
    //     Route::any('/class/create', 'ClassController@create')->name('me.class.create');
    //     Route::any('/withdraw', 'UserController@withdraw')->name('me.withdraw');

    //     Route::middleware('access.item')->get('/class/{id}', 'ClassController@detail')->name('me.class.detail');
    //     Route::middleware('access.item')->any('/class/{id}/edit', 'ClassController@edit')->name('me.class.edit');
    //     Route::middleware('access.item')->any('/class/{id}/del-schedule', 'ClassController@delSchedule')->name('me.class.del.schedule');

    //     Route::any('/edit', 'UserController@meEdit')->name('me.edit');

    //     Route::any('/orders', 'UserController@orders')->name('me.orders');
    //     Route::any('/courseconfirm', 'UserController@courseConfirm')->name('me.courseconfirm');

    //     Route::any('/orders/{id}/schedule', 'UserController@schedule')->name('me.orders.schedule');
    //     Route::any('/resetpassword', 'UserController@mePassword')->name('me.resetpassword');
    //     Route::any('/ischild', 'UserController@meChild')->name('me.child');
    //     Route::any('/editchild', 'UserController@meChildEdit')->name('me.editchild');
    //     Route::any('/childhistory/{id}', 'UserController@meChildHistory')->name('me.childhistory');

    //     Route::get('/order-return', 'TransactionController@deliveredOrders')->name('me.order.return');
    //     Route::get('/order-return/send-request/{orderId}', 'TransactionController@sendReturnRequest')->name('me.order.return.send-request');

    //     Route::any('/history', 'UserController@meHistory')->name('me.history');
    //     Route::any('/transactionhistory', 'UserController@meTransHistory')->name('me.transactionhistory');
    //     Route::any('/introduce', 'UserController@meIntroduce')->name('me.introduce');
    //     Route::any('/friend', 'UserController@meFriend')->name('me.friend');
    //     Route::any('/work', 'UserController@meWork')->name('me.work');

    //     Route::any('/class/{itemId}/author-confirm-join', 'ClassController@versionmd')->name('class.author.confirmjoin');
    //     Route::any('/class/{itemId}/cert/{userId}', 'ClassController@authorCert')->name('class.author.cert');

    //     Route::any('/pending-orders', 'UserController@pendingOrders')->name('me.pendingorders');
    //     Route::any('/cancel-pending/{id}', 'UserController@cancelPending')->name('me.cancelpending');
    //     Route::any('/notification', 'UserController@notification')->name('me.notification');
    //     Route::any('/contract', 'UserController@contract')->name('me.contract');
    //     Route::any('/contract/{id}/sign', 'UserController@contractSign')->name('me.contract.sign');
    //     Route::any('/certificate', 'UserController@certificate')->name('me.certificate');
    //     Route::any('/finance', 'UserController@finance')->name('me.finance');
    //     Route::any('/remove-certificate/{fileId}', 'UserController@removeCert')->name('me.remove-cert');
    // });
});

// For new pages - v3
Route::get('/subtype/{sutype}', 'ReactController@index')->name('subtype');
Route::get('/partner/{id}', 'ReactController@index')->name('partner');
Route::get('/listing', 'ReactController@index')->name('listing');
Route::get('/map', 'ReactController@index')->name('map');

Route::middleware('auth')->group(function () {
    Route::get('/auth/logout', 'Auth\LoginController@logout')->name('auth.logout');
});

Route::group( [ 'domain' => 'info.anylearn.vn' ], function () {
    Route::get('/', 'PageController@landing' );
});

Auth::routes();
Route::middleware(['auth'])->prefix('me')->group(function () {
    Route::get('/', 'DashboardController@meDashboard')->name('me.dashboard');
    Route::any('/admitstudent', 'UserController@admitstudent')->name('me.admitstudent');
        Route::get('/profile', 'UserController@meProfile')->name('me.profile');
    Route::get('/class', 'ClassController@list')->name('me.class');
    Route::any('/class/create', 'ClassController@create')->name('me.class.create');
    Route::any('/withdraw','UserController@withdraw')->name('me.withdraw');

    Route::middleware('access.item')->get('/class/{id}', 'ClassController@detail')->name('me.class.detail');
    Route::middleware('access.item')->any('/class/{id}/edit', 'ClassController@edit')->name('me.class.edit');
    Route::middleware('access.item')->any('/class/{id}/del-schedule', 'ClassController@delSchedule')->name('me.class.del.schedule');

    Route::any('/edit', 'UserController@meEdit')->name('me.edit');

    Route::any('/orders', 'UserController@orders')->name('me.orders');
    Route::any('/courseconfirm', 'UserController@courseConfirm')->name('me.courseconfirm');

    Route::any('/orders/{id}/schedule', 'UserController@schedule')->name('me.orders.schedule');
    Route::any('/resetpassword', 'UserController@mePassword')->name('me.resetpassword');
    Route::any('/ischild', 'UserController@meChild')->name('me.child');
    Route::any('/editchild', 'UserController@meChildEdit')->name('me.editchild');
    Route::any('/childhistory/{id}', 'UserController@meChildHistory')->name('me.childhistory');

    Route::get('/order-return', 'TransactionController@deliveredOrders')->name('me.order.return');
    Route::get('/order-return/send-request/{orderId}', 'TransactionController@sendReturnRequest')->name('me.order.return.send-request');

    Route::any('/history', 'UserController@meHistory')->name('me.history');
    Route::any('/transactionhistory', 'UserController@meTransHistory')->name('me.transactionhistory');
    Route::any('/introduce', 'UserController@meIntroduce')->name('me.introduce');
    Route::any('/friend', 'UserController@meFriend')->name('me.friend');
    Route::any('/work', 'UserController@meWork')->name('me.work');

    Route::any('/class/{itemId}/author-confirm-join', 'ClassController@authorConfirmJoinCourse')->name('class.author.confirmjoin');
    Route::any('/class/{itemId}/cert/{userId}', 'ClassController@authorCert')->name('class.author.cert');

    Route::any('/pending-orders', 'UserController@pendingOrders')->name('me.pendingorders');
    Route::any('/cancel-pending/{id}', 'UserController@cancelPending')->name('me.cancelpending');
    Route::any('/notification', 'UserController@notification')->name('me.notification');
    Route::any('/contract', 'UserController@contract')->name('me.contract');
    Route::any('/contract/{id}/sign', 'UserController@contractSign')->name('me.contract.sign');
    Route::any('/certificate', 'UserController@certificate')->name('me.certificate');
    Route::any('/finance', 'UserController@finance')->name('me.finance');
    Route::any('/remove-certificate/{fileId}', 'UserController@removeCert')->name('me.remove-cert');

});

Route::middleware(['auth'])->group(function () {
    Route::post('/upload/ckimage', 'FileController@ckEditorImage')->name('upload.ckimage');
    Route::post('/upload/ckimage5', 'FileController@ckEditorImage5')->name('upload.ckimage5');

    Route::get('/location-geo/{address}', 'ConfigController@locationGeo')->name('location-geo');
    Route::get('/location', 'UserController@locationList')->name('location');
    Route::any('/location/create', 'UserController@locationCreate')->name('location.create');
    Route::any('/location/{id}', 'UserController@locationEdit')->name('location.edit');
    Route::get('/item/userstatus/{itemId}', 'CourseController@userStatusTouch')->name('item.userstatus.touch');
    Route::get('/class-like/{itemId}', 'ClassController@likeTouch')->name('class.like');
});

Route::middleware(['webappauth'])->group(function () {
    Route::any('/add2cart', 'TransactionController@add2cart')->name('add2cart');
    Route::get('/cart', 'TransactionController@cart')->name('cart');
    Route::post('/payment', 'TransactionController@payment')->name('payment');
    Route::post('/applyvoucher', 'TransactionController@applyVoucher')->name('applyvoucher');
    Route::post('/exchangePoint', 'TransactionController@exchangePoint')->name('exchangePoint');
    Route::get('/payment-help', 'TransactionController@paymentHelp')->name('checkout.paymenthelp');
    Route::get('/finish', 'TransactionController@finish')->name('checkout.finish');
    Route::get('/remove2cart/{odId}', 'TransactionController@remove2cart')->name('checkout.remove2cart');
});

Route::middleware(['auth','role'])->prefix('admin')->group(function () {
    Route::get('/', 'DashboardController@index')->name('dashboard');
    Route::any('/config/activitybonus','ConfigController@activitybonus')->name('config.activitybonus');
    Route::any('/config/banner', 'ConfigController@banner')->name('config.banner');
    Route::any('/config/site', 'ConfigController@site')->name('config.site');
    Route::get('/config/banner/del/{index}', 'ConfigController@delBanner')->name('config.banner.del');
    Route::get('/config/guide/{type}', 'ConfigController@guide')->name('config.guide');
    Route::get('/config/guide/{type}/{id}', 'ConfigController@guidepdf')->name('config.guidepdf');
    Route::any('/config/homepopup', 'ConfigController@homePopup')->name('config.homepopup');
    Route::any('/config/homeclasses', 'ConfigController@homeClasses')->name('config.homeclasses');
    Route::any('/config/email', 'ConfigController@email')->name('config.email');
    Route::post('/config/guide/{type}', 'ConfigController@guideUpdate');

    Route::any('/config/voucher', 'ConfigController@voucher')->name('config.voucher');
    Route::any('/config/voucher/create', 'ConfigController@voucherEdit')->name('config.voucher.create');
    Route::any('/config/voucher/{id}', 'ConfigController@voucherEdit')->name('config.voucher.edit');
    Route::any('/config/voucher/{id}/list', 'ConfigController@voucherList')->name('config.voucher.list');
    Route::any('/config/voucher/{id}/csv', 'ConfigController@voucherCsv')->name('config.voucher.csv');
    Route::any('/config/voucher/{type}/{id}/close', 'ConfigController@voucherClose')->name('config.voucher.close');

    Route::get('/config/voucher-event', 'ConfigController@voucherEvent')->name('config.voucherevent');
    Route::post('/config/voucher-event/create', 'ConfigController@voucherEventEdit')->name('config.voucherevent.create');
    Route::any('/config/voucher-event/{id}', 'ConfigController@voucherEventEdit')->name('config.voucherevent.edit');
    Route::get('/config/voucher-event/{id}/log', 'ConfigController@voucherEventLog')->name('config.voucherevent.log');
    Route::any('/config/voucher-event/{id}/close', 'ConfigController@voucherEventClose')->name('config.voucherevent.close');
    Route::any('/config/tags', 'ConfigController@tagsManager')->name('config.tag');
    Route::any('/config/tags/touch/{tag}', 'ConfigController@touchTagStatus')->name('config.tag.statustouch');

    Route::any('/user/update-doc', 'UserController@updateDoc')->name('user.update_doc');

    Route::any('/user/mods/create', 'UserController@modCreate')->name('user.mods.create');
    Route::any('/user/mods/{userId}', 'UserController@modEdit')->name('user.mods.edit');
    Route::get('/user/mods', 'UserController@mods')->name('user.mods');
    Route::get('/user/modspartner', 'UserController@modspartner')->name('user.modspartner');
    Route::any('/user/mods/access/{userId}', 'UserController@modAccess')->name('user.mods.access');

    Route::any('/user/members', 'UserController@members')->name('user.members');
    Route::any('/user/members/add', 'UserController@addMember')->name('user.members.add');
    Route::any('/user/activity', 'UserController@activity')->name('user.activity');
    Route::any('/user/members/{userId}', 'UserController@memberEdit')->name('user.members.edit');
    Route::get('/user/contract', 'UserController@contractList')->name('user.contract');
    Route::any('/user/contract/{id}', 'UserController@contractInfo')->name('user.contract.info');

    Route::any('/crm/sale/{userId}', 'CrmController@memberSale')->name('crm.sale');
    Route::any('/sale/request', 'CrmController@requestSale')->name('crm.requestsale');
    Route::any('/crm/save-note', 'CrmController@saveNote')->name('crm.save-note');
    Route::any('/crm/save-call', 'CrmController@saveCall')->name('crm.save-call');
    Route::any('/crm/save-chat', 'CrmController@saveChat')->name('crm.save-chat');
    Route::any('/crm/activity-del/{id}', 'CrmController@delActivity')->name('crm.activity.del');
    Route::get('/crm/activity/{id}', 'CrmController@viewActivityContent')->name('crm.activity');
    Route::get('/crm/change-priority/{userId}', 'CrmController@changeSalePriority')->name('crm.change-priority');

    Route::any('/user/no-profile', 'UserController@userNoProfile')->name('user.noprofile');
    Route::any('/user/remind-profile/{userId}', 'UserController@remindProfile')->name('user.noprofile.remind');

    Route::get('/user/status/{userId}', 'UserController@statusTouch')->name('user.status.touch');
    Route::get('/item/status/{itemId}', 'CourseController@statusTouch')->name('item.status.touch');
    Route::get('/item/type/change/{itemId}/{newType}', 'CourseController@typeChange')->name('item.type.change');


    Route::get('/course', 'CourseController@list')->name('course');
    Route::any('/course/create', 'CourseController@create')->name('course.create');
    Route::middleware('access.item')->get('/course/{id}', 'CourseController@detail')->name('course.detail');
    Route::middleware('access.item')->any('/course/{id}/edit', 'CourseController@edit')->name('course.edit');
    Route::middleware('access.resource')->get('/resource/{id}/delete', 'CourseController@resourceDelete')->name('resource.delete');

    Route::get('/notif/remind-confirm/{id}', 'CourseController@remindConfirm')->name('notif.remind_confirm');
    Route::get('/notif/remind-join/{id}', 'CourseController@remindJoin')->name('notif.remind_join');

    Route::any('/class', 'ClassController@list')->name('class');
    Route::any('/class/create', 'ClassController@create')->name('class.create');
    // Route::middleware('access.item')->get('/class/{id}', 'ClassController@detail')->name('class.detail');
    Route::get('/class/activities', 'ClassController@activities')->name('class.activities');
    Route::middleware('access.item')->any('/class/{id}/edit', 'ClassController@edit')->name('class.edit');
    Route::middleware('access.item')->any('/class/{id}/del', 'ClassController@del')->name('class.del');
    Route::middleware('access.item')->any('/class/{id}/del-schedule', 'ClassController@delSchedule')->name('class.del.schedule');
    Route::any('/codes', 'ClassController@codes')->name('codes');
    Route::any('/codes/resend/{id}', 'ClassController@reSendItemCode')->name('codes.resend');
    Route::any('/codes/refresh/{id}', 'ClassController@refreshItemCode')->name('codes.refresh');

    //Route::middleware('access.item')->any('/class/{itemId}/authorConfirmJoin', 'ClassController@authorConfirmJoinCourse')->name('class.author.confirmjoin');
    //Route::middleware('access.item')->any('/class/{itemId}/cert/{userId}', 'ClassController@authorCert')->name('class.author.cert');

    Route::get('/confirm', 'Controller@developing')->name('confirm');
    Route::get('/product', 'Controller@developing')->name('product');
    Route::get('/order', 'Controller@developing')->name('order');

    Route::get('/feedback', 'DashboardController@feedback')->name('feedback');

    Route::get('/transaction', 'TransactionController@transaction')->name('transaction');
    Route::get('/order-open', 'TransactionController@orderOpen')->name('order.open');
    Route::get('/order-all', 'TransactionController@allOrder')->name('order.all');
    Route::get('/order-approve/{orderId}', 'TransactionController@approveOrder')->name('order.approve');
    Route::get('/order-return/{orderId}/{trigger}', 'TransactionController@returnOrder')->name('order.return');
    Route::get('/order-refund/{orderId}', 'TransactionController@refundOrder')->name('order.refund');
    Route::get('/order-reject/{orderId}', 'TransactionController@rejectOrder')->name('order.reject');
    Route::get('/transaction/commission', 'TransactionController@commission')->name('transaction.commission');
    Route::get('/transaction/{id}/status/{status}', 'TransactionController@status')->name('transaction.status.touch');

    Route::any('/fin/expenditures', 'TransactionController@finExpenditures')->name('fin.expenditures');
    Route::any('/fin/salereport', 'TransactionController@finSaleReport')->name('fin.salereport');

    Route::get('/article', 'ArticleController@list')->name('article');
    Route::post('/article/create', 'ArticleController@create')->name('article.create');
    Route::any('/article/{id}', 'ArticleController@edit')->name('article.edit');
    Route::get('/article/status/{articleId}', 'ArticleController@statusTouch')->name('article.status.touch');

    Route::get('category', 'ClassController@category')->name('category');
    Route::any('category-edit/{id?}', 'ClassController@categoryEdit')->name('category.edit');
    Route::get('/service/touch-status/{table}/{id}', 'Controller@touchStatus')->name('service.touch.status');

    Route::get('/knowledge/category', 'KnowledgeController@category')->name('knowledge.category');
    Route::any('/knowledge/category/edit/{id?}', 'KnowledgeController@categoryEdit')->name('knowledge.category.edit');
    Route::get('/knowledge/article', 'KnowledgeController@knowledge')->name('knowledge');
    Route::any('/knowledge/article/edit/{id?}', 'KnowledgeController@knowledgeEdit')->name('knowledge.edit');
    Route::get('/knowledge/topic', 'KnowledgeController@topic')->name('knowledge.topic');
    Route::any('/knowledge/topic/edit/{id?}', 'KnowledgeController@topicEdit')->name('knowledge.topic.edit');
    Route::any('/knowledge/topic/{id}/category', 'KnowledgeController@topicCategory')->name('knowledge.topic.category');

    Route::middleware('access.mod')->any('/devtools/change-test', 'DevToolsController@changeTestBranch')->name('devtools.change-test');

    Route::get('/spm', 'DashboardController@spm')->name('spm.general');
});

Route::get('/inactive', 'UserController@inactivePage')->name('user.inactive');

//Ajax
Route::get('/ajax/toc', 'AjaxController@toc')->name('ajax.toc');
Route::middleware(['auth', 'access.mod'])->get('/ajax/touch-is-hot/{table}/{id}', 'AjaxController@touchIsHot')->name('ajax.touch.ishot');
Route::middleware(['auth'])->get('/ajax/doc/{userId}', 'AjaxController@userDocs')->name('ajax.user.docs');
Route::middleware(['auth'])->get('/ajax/remove-doc/{userId}', 'AjaxController@userRemoveUpdateDoc')->name('ajax.user.docs.remove');
Route::middleware(['auth'])->get('/ajax/allow-doc/{userId}', 'AjaxController@userAllowUpdateDoc')->name('ajax.user.docs.remove');
