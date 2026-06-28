<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTemplateToVoucherEvent extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('voucher_events', function (Blueprint $table) {
            $table->text('notif_template')->nullable();
            $table->text('email_template')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('voucher_events', function (Blueprint $table) {
            $table->dropColumn('notif_template');
            $table->dropColumn('email_template');
        });
    }
}
