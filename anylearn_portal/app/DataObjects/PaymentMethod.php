<?php namespace App\DataObjects;

class PaymentMethod {
    public $name;
    public $icon;
    public $desc;

    function __construct($name, $icon, $desc) {
        $this->name = $name;
        $this->icon = $icon;
        $this->desc = $desc;
    }
}