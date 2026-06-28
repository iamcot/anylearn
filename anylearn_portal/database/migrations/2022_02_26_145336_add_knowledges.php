<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddKnowledges extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('knowledge_categories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->string('url')->unique();
            $table->string('description')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('knowledges', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('knowledge_category_id')->index();
            $table->string('title');
            $table->string('url')->unique();
            $table->string('description')->nullable();
            $table->text('content')->nullable();
            $table->text('content_bot')->nullable();
            $table->integer('thumb_up')->default(0);
            $table->integer('thumb_down')->default(0);
            $table->tinyInteger('status')->default(1);
            $table->bigInteger('view')->default(0);
            $table->tinyInteger('is_top_question')->default(0);
            $table->timestamps();
        });

        Schema::create('knowledge_topics', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->string('url')->unique();
            $table->string('image')->nullable();
            $table->string('description')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('knowledge_topic_category_links', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('knowledge_topic_id');
            $table->unsignedBigInteger('knowledge_category_id');
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
        Schema::dropIfExists('knowledge_topic_category_links');
        Schema::dropIfExists('knowledges');
        Schema::dropIfExists('knowledge_categories');
        Schema::dropIfExists('knowledge_topics');
    }
}
