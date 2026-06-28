<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateItemCodesNotifTemplatesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('item_codes_notif_templates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->text('email_template')->nullable();
            $table->text('notif_template')->nullable();
            $table->unsignedBigInteger('item_id')->index()->nullable();
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
        Schema::dropIfExists('item_codes_notif_templates');
    }
}
