<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class Users3rdLogin extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('3rd_id')->index()->nullable();
            $table->string('3rd_token')->unique()->nullable();
            $table->string('3rd_type')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('3rd_id');
            $table->dropColumn('3rd_token');
            $table->dropColumn('3rd_type');
        });
    }
}
