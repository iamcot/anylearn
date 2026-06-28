<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateTableSaleActivities extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('sale_activities', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('sale_id')->index();
            $table->bigInteger('member_id')->index();
            $table->string('type')->index();//chat, call, note
            $table->string('logwork')->nullable();
            $table->binary('content')->nullable();
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
        });

        Schema::table('users', function(Blueprint $table) {
            $table->string('omicall_id')->nullable();
            $table->string('omicall_pwd')->nullable();
            $table->string('contact_phone')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('sale_activities');
        Schema::table('users', function(Blueprint $table) {
            $table->dropColumn('omicall_id');
            $table->dropColumn('omicall_pwd');
            $table->dropColumn('contact_phone');
        });
    }
}
