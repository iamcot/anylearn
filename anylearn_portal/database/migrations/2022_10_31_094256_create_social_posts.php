<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSocialPosts extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('social_posts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type')->index();
            $table->bigInteger('ref_id')->nullable();
            $table->bigInteger('user_id')->index();
            $table->bigInteger('post_id')->nullable()->index();
            $table->text('content')->nullable();
            $table->string('image')->nullable();
            $table->string('day')->index();
            $table->tinyInteger('status')->default(1);
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
        Schema::dropIfExists('social_posts');
    }
}
