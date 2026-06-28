<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddVoucherGroups extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('voucher_groups', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type')->default('money');
            $table->string('generate_type')->default('manual');
            $table->string('prefix')->nullable();
            $table->integer('qtt')->default(1);
            $table->string('value');
            $table->integer('status')->default(1)->index();
            $table->text("ext")->nullable();
            $table->timestamps();
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->bigInteger('voucher_group_id')->after('id')->index();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn('voucher_group_id');
        });
        Schema::dropIfExists('voucher_groups');
    }
}
