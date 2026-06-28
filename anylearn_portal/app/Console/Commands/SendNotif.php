<?php

namespace App\Console\Commands;

use App\Constants\NotifConstants;
use App\Models\Notification;
use App\Models\User;
use Exception;
use Illuminate\Console\Command;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;

class SendNotif extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'firenotif {userIds} {message} {--type=id} {--route=} {--copy=} {--routearg=}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send notif via firebase';

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
        // $notSendNotifs = Notification::where('is_send', 0)->get();
        try {
            $userIds = $this->argument('userIds');
            $message = $this->argument('message');
            $type = $this->option('type');
            $route = $this->option('route');
            $routeArg = $this->option('routearg');
            $copy = $this->option('copy');
    
            $notifM = new Notification();
            if ($userIds == 'ALL') {
                $users = User::all();
            } else {
                if ($type == 'phone') {
                    $users = User::whereIn('phone', explode(",", $userIds))->get();
                } else {
                    $users = User::whereIn('id', explode(",", $userIds))->get();
                }
            }
         
            $data = ['message' => $message];
            if (!empty($routeArg)) {
                $data['args'] = $routeArg;
            }
            foreach($users as $user) {
                $notifM->createNotif(NotifConstants::SYSTEM_NOTIF, $user->id, $data , $copy, $route);
                print("Sent message to user " . $user->id . " | " .  $user->phone . " | " . $user->name . "\n");
            }
            print("--All done! --\n");
        } catch (Exception $e) {
            print($e);
        }
        
    }
}
