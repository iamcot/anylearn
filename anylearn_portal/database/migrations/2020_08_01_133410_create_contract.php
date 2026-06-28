<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateContract extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('contracts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('user_id')->index();
            $table->tinyInteger('status')->index();
            $table->string('type');
            $table->string('cert_id')->nullable();
            $table->date('cert_date')->nullable();
            $table->string('cert_place')->nullable();
            $table->string('email')->nullable();
            $table->string('dob')->nullable();
            $table->string('dob_place')->nullable();
            $table->string('tax')->nullable();
            $table->string('ref')->nullable();
            $table->string('ref_title')->nullable();
            $table->string('address')->nullable();
            $table->float('commission');
            $table->string('bank_name')->nullable();
            $table->string('bank_branch')->nullable();
            $table->string('bank_no')->nullable();
            $table->string('bank_account')->nullable();
            $table->string('signed')->nullable();
            $table->timestamps();
        });
        Schema::table('users', function (Blueprint $table) {
            $table->tinyInteger('is_signed')->index()->default(0)->after('status');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('contracts');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_signed');
        });
    }
}
