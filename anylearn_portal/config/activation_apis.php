<?php 

/**
 * List of digital partners that support the API
 * Config the partnerID with the corresponding processor 
 */

use App\DigitalSupport\DigitalMonkey;

return [
    'monkey' => [
        'partnerID' => env('MONKEY_USER_ID', 418), 
        'processor' => DigitalMonkey::class,
    ], 
];