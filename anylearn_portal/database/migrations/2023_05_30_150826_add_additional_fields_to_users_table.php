<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddAdditionalFieldsToUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('business_certificate')->nullable();
            $table->date('first_issued_date')->nullable();
            $table->string('issued_by')->nullable();
            $table->string('headquarters_address')->nullable();
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
            $table->dropColumn('business_certificate');
            $table->dropColumn('first_issued_date');
            $table->dropColumn('issued_by');
            $table->dropColumn('headquarters_address');
        });
    }
}
