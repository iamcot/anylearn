<?php

use Doctrine\DBAL\Schema\Table;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class ModifyClass extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('items', function (Blueprint $table) {
            $table->string('subtype', 50)->after('type')->nullable();
            $table->bigInteger('item_id')->nullable();
            $table->bigInteger('user_location_id')->after('item_id')->nullable();
        });
        Schema::create('user_locations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->index();
            $table->string('title');
            $table->string('ward_code', 10)->index();
            $table->string('district_code', 10)->index();
            $table->string('province_code', 10)->index();
            $table->string('ward_path');
            $table->string('longitude')->nullable();
            $table->string('latitude')->nullable();
            $table->string('address');
            $table->string('image')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->tinyInteger('is_head')->default(0);
            $table->timestamps();
        });
        Schema::create('class_plans', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->string('title')->nullable();
            $table->date('start')->nullable();
            $table->bigInteger('user_location_id')->nullable();
            $table->string('extra_info')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::table('schedules', function (Blueprint $table) {
            $table->bigInteger('class_plan_id')->nullable();
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
            $table->dropColumn('subtype');
            $table->dropColumn('item_id');
            $table->dropColumn('user_location_id');
        });
        Schema::dropIfExists('user_locations');
        Schema::dropIfExists('class_plans');
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn('class_plan_id');
        });
    }
}
