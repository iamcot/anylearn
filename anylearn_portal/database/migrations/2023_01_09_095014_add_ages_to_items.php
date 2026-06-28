<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddAgesToItems extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('items', function (Blueprint $table) {
            $table->tinyInteger('ages_min')->nullable();
            $table->tinyInteger('ages_max')->nullable();
            $table->integer('seats')->nullable();
        });

        Schema::create('item_extras', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_id')->index();
            $table->string('title');
            $table->integer('price')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('order_item_extras', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('order_detail_id')->index();
            $table->bigInteger('item_id')->index();
            $table->string('title');
            $table->integer('price')->nullable();
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
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('ages_min');
            $table->dropColumn('ages_max');
            $table->dropColumn('seats');
        });
        Schema::dropIfExists('item_extras');
        Schema::dropIfExists('order_item_extras');
    }
}
