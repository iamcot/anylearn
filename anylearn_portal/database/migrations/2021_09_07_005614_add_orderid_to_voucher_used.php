<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddOrderidToVoucherUsed extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('vouchers_used', function (Blueprint $table) {
            $table->bigInteger('order_id')->nullable()->index();
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->string('value')->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('vouchers_used', function (Blueprint $table) {
            $table->dropColumn('order_id');
        });
        Schema::table('vouchers', function (Blueprint $table) {
            $table->integer('value')->default(0)->change();
        });
    }
}
