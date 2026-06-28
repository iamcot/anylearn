<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddSaleToUsers extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->bigInteger('sale_id')->nullable()->index();
        });
        Schema::table('items', function (Blueprint $table) {
            $table->bigInteger('sale_id')->nullable()->index();
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->bigInteger('sale_id')->nullable()->index();
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
            $table->dropIfExists('sale_id');
        });
        Schema::table('items', function (Blueprint $table) {
            $table->dropIfExists('sale_id');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropIfExists('sale_id');
        });
    }
}
