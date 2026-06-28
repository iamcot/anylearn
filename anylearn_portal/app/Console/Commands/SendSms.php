<?php

namespace App\Console\Commands;

use App\Services\SmsServices;
use Illuminate\Console\Command;

class SendSms extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sendsms {phone} {content} {--isreal=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command to send sms';

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
        $content = $this->argument('content');
        $isReal = $this->option('isreal');

        $smsServ = new SmsServices('get');
        echo sprintf("\n--Send sms to %s, content: %s", $phone, $content);
        $smsCall = $smsServ->to($phone)->content($content);
        if ($isReal == 1) {
            $smsCall = $smsCall->isReal();
        } else {
            $smsCall = $smsCall->isTest();
        }
        $result = $smsCall->send();
        echo sprintf("\nSent result: %b", $result['result']);
        if (!$result['result']) {
            echo sprintf("\nError: %s", $result['error']);
        } else {
            echo sprintf("\SMS ID: %s", $result['data']);
        }
    }
}
