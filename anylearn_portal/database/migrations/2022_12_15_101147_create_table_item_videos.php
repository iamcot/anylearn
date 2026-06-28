<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTableItemVideos extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('item_video_chapters', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->integer('chapter_no');
            $table->string('title');
            $table->string('description');
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });
        Schema::create('item_video_lessons', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->bigInteger('item_video_chapter_id')->index();
            $table->integer('lesson_no');
            $table->string('title');
            $table->string('description')->nullable();
            $table->string('length')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->tinyInteger('is_free')->default(0);
            $table->string('type')->index();
            $table->text('type_value')->nullable();
            $table->timestamps();
        });
        Schema::create('item_video_lesson_user_links', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_video_lesson_id')->index();
            $table->bigInteger('user_id')->index();
            $table->string('checkpoint')->nullable();
            $table->tinyInteger('complete')->default(0);
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
        Schema::dropIfExists('item_video_chapters');
        Schema::dropIfExists('item_video_lessons');
        Schema::dropIfExists('item_video_lesson_user_links');
    }
}
