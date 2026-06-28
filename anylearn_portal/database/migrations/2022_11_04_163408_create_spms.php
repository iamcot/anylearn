<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateSpms extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('spms', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('spm_key')->index();
            $table->string('event')->index();
            $table->string('session_id')->index();
            $table->string('day')->index();
            $table->string('user_id')->nullable()->index();
            $table->string('spma')->index();
            $table->string('spmb')->index();
            $table->string('spmc')->index();
            $table->string('spmd')->index();
            $table->string('spm_pre')->nullable();
            $table->string('p_url')->nullable();
            $table->string('p_ref')->nullable();
            $table->string('p_title')->nullable();
            $table->text('p_meta_desc')->nullable();
            $table->string('p_meta_robots')->nullable();
            $table->string('p_canonical')->nullable();
            $table->string('p_lang')->nullable();
            $table->string('os')->nullable();
            $table->string('ip')->nullable();
            $table->string('country')->nullable();
            $table->string('browser')->nullable();
            $table->string('screen')->nullable();
            $table->string('user_type')->nullable();
            $table->string('logfrom')->nullable();
            $table->text('extra')->nullable();
            $table->timestamps();
        });

        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('tracker_agents');
        Schema::dropIfExists('tracker_connections');
        Schema::dropIfExists('tracker_cookies');
        Schema::dropIfExists('tracker_devices');
        Schema::dropIfExists('tracker_domains');
        Schema::dropIfExists('tracker_errors');
        Schema::dropIfExists('tracker_events');
        Schema::dropIfExists('tracker_events_log');
        Schema::dropIfExists('tracker_geoip');
        Schema::dropIfExists('tracker_system_classes');
        Schema::dropIfExists('tracker_sql_query_bindings_parameters');
        Schema::dropIfExists('tracker_sql_query_bindings');
        Schema::dropIfExists('tracker_sql_queries_log');
        Schema::dropIfExists('tracker_sql_queries');
        Schema::dropIfExists('tracker_sessions');
        Schema::dropIfExists('tracker_routes');
        Schema::dropIfExists('tracker_route_paths');
        Schema::dropIfExists('tracker_route_path_parameters');
        Schema::dropIfExists('tracker_referers_search_terms');
        Schema::dropIfExists('tracker_referers');
        Schema::dropIfExists('tracker_query_arguments');
        Schema::dropIfExists('tracker_queries');
        Schema::dropIfExists('tracker_paths');
        Schema::dropIfExists('tracker_log');
        Schema::dropIfExists('tracker_languages');
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('spms');
    }
}
