<?php namespace App\PaymentGateway;

interface PaymentInterface {

    public function validate($input);

    public function processPayment();
    
    public function processReturnData($response);

    public function processFeedbackData($response, $from);

    public function prepareNotifyResponse($data, $feedbackResult);

}