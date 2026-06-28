<?php

namespace App\Console\Commands;

use App\Services\ZaloServices;
use Illuminate\Console\Command;

class TestZNS extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sendzns {phone} {--istest=1}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test Send ZNS';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $phone = $this->argument('phone');
        $isTest = $this->option('istest');
        $znsService = new ZaloServices(true, $isTest);
        // $znsService->sendZNS(ZaloServices::ZNS_ORDER_CONFIRMED, $phone, [
        //     'created_at' => time(),
        //     'student' => 'Người học B',
        //     'price' => 1000000,
        //     'class' => 'Khóa học X',
        //     'id' => 123,
        //     'name' => 'Người mua A'
        // ]);
       
        $znsService->sendZNS(ZaloServices::ZNS_OTP, $phone, '123456');
        // dd($znsService);
    }
}
