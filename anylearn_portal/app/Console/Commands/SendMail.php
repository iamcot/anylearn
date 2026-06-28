<?php

namespace App\Console\Commands;

use App\Mail\UserRegistered;
use App\Models\User;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendMail extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sendmail';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test send an email';

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
        // throw new Exception();
        $user = User::find(1);
        print("Start Send Email To User $user->name");
        Mail::to("info.anylearn@gmail.com")
        ->bcc(env('MAIL_ADMIN_BCC', 'info.anylearn@gmail.com'))
        ->send(new UserRegistered(['userid' => 1]));
        print("\nEmail Sent!!!");
    }
}