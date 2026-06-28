<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddTableI18nContents extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('i18n_contents', function ($table) {
            $table->bigIncrements('id');
            $table->string('locale');
            $table->string('tbl');
            $table->bigInteger('content_id');
            $table->string('col');
            $table->longText('i18n_content');
            $table->tinyInteger('status')->default(1);
            $table->timestamps();
            $table->unique(['tbl', 'content_id', 'col', 'locale']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('i18n_contents');
    }
}
