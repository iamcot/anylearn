<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddUserSpecs extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('user_specs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->string('description')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('user_spec_links', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_specs_id')->index();
            $table->bigInteger('user_id')->index();
            $table->string('value');
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('item_specs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('title');
            $table->string('description')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::create('item_spec_links', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('item_specs_id')->index();
            $table->bigInteger('item_id')->index();
            $table->string('value');
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
        Schema::dropIfExists('user_spec_links');
        Schema::dropIfExists('user_specs');
        Schema::dropIfExists('item_spec_links');
        Schema::dropIfExists('item_specs');
    }
}
