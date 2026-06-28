<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddRuleMaxToVoucherGroups extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('voucher_groups', function (Blueprint $table) {
            $table->string('rule_max')->nullable()->after('rule_min');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('voucher_groups', function (Blueprint $table) {
            $table->dropColumn('rule_max');
        });
    }
}
