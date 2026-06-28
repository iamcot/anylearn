<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddFav extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('item_user_actions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->bigInteger('user_id')->index();
            $table->string('type')->index();
            $table->string('value');
            $table->text('extra_value')->nullable();
            $table->timestamps();
        });

        Schema::create('articles', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->bigInteger('category')->nullable()->index();
            $table->string('type')->index();
            $table->string('title');
            $table->string('image')->nullable();
            $table->string('video')->nullable();
            $table->text('short_content')->nullable();
            $table->longText('content')->nullable();
            $table->bigInteger('view')->default(0);
            $table->bigInteger('like')->default(0);
            $table->tinyInteger('status')->default(1)->index();
            $table->tinyInteger('is_hot')->default(0)->index();
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
        Schema::dropIfExists('item_user_actions');
        Schema::dropIfExists('articles');
    }
}
