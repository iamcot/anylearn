<?php

namespace App\Mail;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class MailToPartnerRegisterNew extends Mailable
{
    use SerializesModels;

    public $data;


    public function __construct($data)
    {
        $this->data = $data;
    }

    public function build()
    {
        return $this->subject('[anyLEARN] Đăng ký khóa học mới từ khách hàng')->view('email.mail_to_partner_register_new',$this->data);
    }
}
