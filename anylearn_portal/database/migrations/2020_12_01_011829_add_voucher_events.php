<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddVoucherEvents extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('voucher_events', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type')->index();
            $table->tinyInteger('status')->index()->default(1);
            $table->string('title');
            $table->integer('trigger')->index();
            $table->string('targets');
            $table->integer('qtt')->default(1);
            $table->timestamps();
        });

        Schema::create('voucher_event_logs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('voucher_event_id')->index();
            $table->bigInteger('user_id')->index();
            $table->integer('trigger');
            $table->integer('target');
            $table->string('data')->nullable();
            $table->bigInteger('voucher_id')->nullable()->index();
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
        Schema::dropIfExists('voucher_event_logs');
        Schema::dropIfExists('voucher_events');
    }
}
