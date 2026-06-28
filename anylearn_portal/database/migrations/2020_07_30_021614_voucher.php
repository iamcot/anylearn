<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class Voucher extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('voucher')->unique();
            $table->integer('amount')->default(1);
            $table->integer('value')->default(0);
            $table->tinyInteger('status')->index()->default(1);
            $table->integer('expired')->index();
            $table->timestamps();
        });

        Schema::create('vouchers_used', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('voucher_id')->index();
            $table->bigInteger('user_id')->index();
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
        Schema::dropIfExists('vouchers_used');
        Schema::dropIfExists('vouchers');
    }
}
