<?php namespace App\DigitalSupport;

interface OrderingPartnerInterface 
{
    /**
     * Validate order data before processing.
     *
     * @param array $orderData
     * @return array|false The validated order data if validation passes, false otherwise.
     */
    public function validateOrderData(array $orderData);

    /**
     * Submit an order request to the partner's API.
     *
     * @param array $orderData
     * @return string JSON-encoded response from the API.
     */
    public function submitOrderRequest(array $orderData);

    /**
     * Process the response from the partner's API.
     *
     * @param string $returnData JSON-encoded response from the API.
     * @return ServiceResponse A response object representing the processed data.
     */
    public function processReturnData(string $returnData);

    /**
     * Order an item from an agent by interacting with the partner's API.
     *
     * @param array $orderData
     * @return ServiceResponse A response object representing the result of the operation.
     */
    public function orderItemFromPartnerAPI(array $orderData);
}
