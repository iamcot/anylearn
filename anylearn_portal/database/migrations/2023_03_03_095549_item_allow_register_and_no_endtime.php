<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ItemAllowRegisterAndNoEndtime extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('items', function (Blueprint $table) {
            $table->tinyInteger('allow_re_register')->default(0);
            $table->string('cycle_type')->nullable();
            $table->integer('cycle_amount')->nullable();
            $table->tinyInteger('activiy_trial')->nullable();
            $table->tinyInteger('activiy_test')->nullable();
            $table->tinyInteger('activiy_visit')->nullable();
        });

        Schema::create('item_activities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->string('type');
            $table->bigInteger('user_id')->index();
            $table->string('date')->nullable();
            $table->string('note')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('item_schedule_plans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->bigInteger('user_location_id')->nullable()->index();
            $table->string('title');
            $table->string('weekdays');
            $table->string('date_start');
            $table->string('date_end')->nullable();
            $table->string('time_start');
            $table->string('time_end')->nullable();
            $table->text('info')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::table('schedules', function (Blueprint $table) {
            $table->bigInteger('user_id')->nullable();
        });

        Schema::table('order_details', function (Blueprint $table) {
            $table->bigInteger('item_schedule_plan_id')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('allow_re_register');
            $table->dropColumn('cycle_type');
            $table->dropColumn('cycle_amount');
            $table->dropColumn('activiy_trial');
            $table->dropColumn('activiy_test');
            $table->dropColumn('activiy_visit');
        });

        Schema::dropIfExists('item_activities');
        Schema::dropIfExists('item_schedule_plans');
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn('user_id');
        });
        Schema::table('order_details', function (Blueprint $table) {
            $table->dropColumn('item_schedule_plan_id');
        });
    }
}
