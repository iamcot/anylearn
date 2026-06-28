<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddNotifications extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->string('type')->index();
            $table->string('title')->nullable();
            $table->text('content');
            $table->string('route')->nullable();
            $table->text('extra_content')->nullable();
            $table->tinyInteger('is_send')->default(0)->index();
            $table->timestamp('send')->nullable();
            $table->timestamp('read')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('notif_token')->after('api_token')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
        Schema::dropIfExists('notifications');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('notif_token');
        });
    }
}
