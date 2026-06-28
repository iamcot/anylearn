<?php

namespace App\Mail;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class ActivityMail extends Mailable
{
    use SerializesModels;

    public $data;


    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        return $this->subject('[anyLEARN] Đăng ký Học Thử/Thăm Quan/Kiểm Tra mới từ khách hàng')->view('email.activity_mail',$this->data);
    }
}
