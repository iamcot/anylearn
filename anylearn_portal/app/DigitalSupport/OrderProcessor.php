<?php namespace App\DigitalSupport;

use App\DataObjects\ServiceResponse;
use Exception;

class OrderProcessor
{
    private static $instance = null;

    private static function createProcessor($partnerID) 
    {
        $digitalPartners = config('activation_apis'); 
        foreach ($digitalPartners as $dp) {
            if ($partnerID == $dp['partnerID'] && class_exists($dp['processor'])) {
                $processor = new $dp['processor'];
                if ($processor instanceof OrderingPartnerInterface) {
                    return $processor;
                }
                throw new Exception('The processor must implement DigitalPartnerInterface');   
            }
        }
        return null;
    }
    
    public static function getInstance($partnerID)
    {
        if (null === self::$instance) {
            self::$instance = self::createProcessor($partnerID);
            if (null === self::$instance) { 
                throw new Exception("There are no processors for partnerID [$partnerID]");
            }
        }
        return self::$instance;  
    }

    public static function orderItemFromPartnerAPI($orderData, $partnerID) 
    {
        try {
            return self::getInstance($partnerID)->orderItemFromPartnerAPI($orderData); 
        } catch (Exception $e) {
            return new ServiceResponse(false, 'PROCESSING_FAILED');
        }
    }
}