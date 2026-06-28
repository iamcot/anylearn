<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('first_name')->index()->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->unique();
            $table->string('refcode')->unique();
            $table->string('password');
            $table->string('api_token')->unique()->nullable();
            $table->string('role', 20)->index();
            $table->tinyInteger('status')->index()->default(0);
            $table->integer('user_category_id')->index()->default(0);
            $table->tinyInteger('update_doc')->default(0);
            $table->integer('package_id')->default(0);
            $table->integer('expire')->index()->default(0);
            $table->bigInteger('wallet_m')->default(0);
            $table->bigInteger('wallet_c')->default(0);
            $table->float('commission_rate')->default(0.2);
            $table->bigInteger('user_id')->index()->nullable();
            $table->tinyInteger('is_hot')->index()->default(0);
            $table->integer('boost_score')->index()->default(0);
            $table->text('image')->nullable();
            $table->text('banner')->nullable();
            $table->text('introduce')->nullable();
            $table->string('title')->nullable();
            $table->date('dob')->nullable();
            $table->text('address')->nullable();
            $table->string('country')->nullable();
            $table->integer('num_friends')->default(0);
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();
        }); 

        Schema::create('user_documents', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->string('type');
            $table->string('store')->default('local');
            $table->string('file_ext')->nullable();
            $table->string('data');
            $table->timestamps();
        });

        Schema::create('items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('series_id')->nullable();
            $table->text('title');
            $table->string('type', 20)->index();
            $table->bigInteger('user_id')->index();
            $table->integer('item_category_id')->index()->default(0);
            $table->text('image')->nullable();
            $table->text('short_content')->nullable();
            $table->longText('content')->nullable();
            $table->bigInteger('price')->default(0);
            $table->bigInteger('org_price')->nullable();
            $table->date('date_start')->index();
            $table->string('time_start')->nullable();
            $table->date('date_end')->nullable();
            $table->string('time_end')->nullable();
            $table->string('location_type')->nullable();
            $table->string('location')->nullable();
            $table->tinyInteger('is_hot')->index()->default(0);
            $table->tinyInteger('status')->index()->default(0);
            $table->tinyInteger('user_status')->index()->default(0);
            $table->integer('boost_score')->index()->default(0);
            $table->text('seo_title')->nullable();
            $table->string('seo_url')->nullable();
            $table->text('seo_desc')->nullable();
            $table->timestamps();
        });

        Schema::create('course_series', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->string('title');
            $table->text('content')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('schedules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->date('date')->index();
            $table->string('time_start');
            $table->string('time_end')->nullable();
            $table->text('content')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('item_reviews', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->bigInteger('user_id')->index();
            $table->float('rating');
            $table->text('comment');
            $table->timestamps();
        });

        Schema::create('user_reviews', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('from_user_id')->index();
            $table->bigInteger('to_user_id')->index();
            $table->bigInteger('ref_item_id')->nullable()->index();
            $table->float('rating');
            $table->text('content');
            $table->timestamps();
        });

        Schema::create('participations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->bigInteger('schedule_id')->index();
            $table->bigInteger('organizer_user_id')->index();
            $table->bigInteger('participant_user_id')->index();
            $table->tinyInteger('organizer_confirm')->default(0);
            $table->tinyInteger('participant_confirm')->default(0);
            $table->string('organizer_comment')->nullable();
            $table->string('participant_comment')->nullable();
            $table->timestamps();
        });

        Schema::create('item_resources', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->string('type', 20)->index();
            $table->text('title')->nullable();
            $table->text('desc')->nullable();
            $table->text('data');
            $table->timestamps();
        });

        Schema::create('configurations', function (Blueprint $table) {
            $table->string('key')->unique();
            $table->text('value');
            $table->string('type');
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->integer('quantity')->default(1);
            $table->bigInteger('amount')->default(0);
            $table->string('status')->index();
            $table->string('delivery_name')->nullable();
            $table->string('delivery_address')->nullable();
            $table->string('delivery_phone')->nullable();
            $table->string('payment')->nullable();
            $table->timestamps();
        });

        Schema::create('order_details', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('order_id')->index();
            $table->bigInteger('user_id')->index();
            $table->bigInteger('item_id')->index();
            $table->bigInteger('unit_price');
            $table->bigInteger('paid_price');
            $table->integer('quanity')->default(1);
            $table->string('status')->index();
            $table->timestamps();
        });

        // Schema::create('commissions', function (Blueprint $table) {
        //     $table->bigIncrements('id');
        //     $table->bigInteger('user_id')->index();
        //     $table->bigInteger('order_id')->index();
        //     $table->bigInteger('ref_user_id')->index();
        //     $table->string('content')->nullable();
        //     $table->bigInteger('amount');
        //     $table->bigInteger('ref_amount');
        //     $table->integer('status')->index();
        //     $table->timestamps();
        // });

        Schema::create('transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->bigInteger('ref_user_id')->index()->nullable();
            $table->string('type')->index();
            $table->bigInteger('amount');
            $table->bigInteger('ref_amount')->nullable();
            $table->string('pay_method')->nullable();
            $table->text('pay_info')->nullable();
            $table->bigInteger('order_id')->index()->nullable();
            $table->string('content')->nullable();
            $table->integer('status')->index()->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('user_documents');
        Schema::dropIfExists('items');
        Schema::dropIfExists('schedules');
        Schema::dropIfExists('item_resources');
        Schema::dropIfExists('participations');
        Schema::dropIfExists('configurations');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('order_details');
        // Schema::dropIfExists('commissions');
        Schema::dropIfExists('course_series');
        Schema::dropIfExists('item_reviews');
        Schema::dropIfExists('user_reviews');
        Schema::dropIfExists('transactions');
    }
}
