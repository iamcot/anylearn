<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTagsAndAsk extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('tag')->index();
            $table->bigInteger('item_id')->index();
            $table->integer('status')->default(0)->index();
            $table->string('type')->index()->default('article');
            $table->timestamps();
        });
        Schema::create('asks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->bigInteger('ask_id')->index()->nullable();
            $table->string('type')->default('answer')->index();
            $table->tinyInteger('is_selected_answer')->index()->default(0);
            $table->integer('like')->default(0);
            $table->integer('unlike')->default(0);
            $table->tinyInteger('is_pro_answer')->default(0);
            $table->tinyInteger('status')->index()->default(1);
            $table->string('title')->nullable();
            $table->longText('content');
            $table->timestamps();
        });
        Schema::create('ask_votes', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('ask_id')->index();
            $table->bigInteger('user_id')->index();
            $table->string('type')->index();
            $table->timestamps();
        });
        Schema::table('items', function (Blueprint $table) {
            $table->string('tags')->nullable();
        });
        Schema::table('articles', function (Blueprint $table) {
            $table->string('tags')->nullable();
        });

        Schema::table('items', function (Blueprint $table) {
            $table->string('nolimit_time')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('tags');
        Schema::dropIfExists('asks');
        Schema::dropIfExists('ask_votes');
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('tags');
        });
        Schema::table('articles', function (Blueprint $table) {
            $table->dropColumn('tags');
        });
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('nolimit_time');
        });
    }
}
