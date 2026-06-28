<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddSexToUsers extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('cert_id')->nullable();
            $table->string('sex')->nullable();
            $table->date('cert_exp')->nullable();
            $table->text('cert_location')->nullable();
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
            $table->dropColumn('cert_id');
            $table->dropColumn('sex');
            $table->dropColumn('cert_exp');
            $table->dropColumn('cert_location');
        });
    }
}
