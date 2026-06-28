<?php

namespace App\Mail;

use App\Models\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class VoucherEventEmail extends Mailable
{
    use Queueable, SerializesModels;

    public $data;

    /**
     * Create a new message instance.
     *
     * @return void
     */
    public function __construct($data)
    {
        $this->data = $data;
    }

    /**
     * Build the message.
     *
     * @return $this
     */
    public function build()
    {
        $notifM = new Notification();
        $content = $notifM->buildContent($this->data['template'], $this->data['data']);
        return $this->subject("Bạn có một mã quà tặng từ anyLEARN")->view('email.voucher_event')->with('content', $content);
    
    }
}
