<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class correctTreeNum extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'treenum';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Correct tree num of all users';

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
        $userM = new User();
        print("=== start correctTreeNum === \n");
        $userM->correctTreeNum();
        print("\n=== finish correctTreeNum === \n");

    }
}
