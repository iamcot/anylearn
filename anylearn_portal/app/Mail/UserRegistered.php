<?php

namespace App\Mail;

use App\Constants\ConfigConstants;
use App\Constants\UserConstants;
use App\Models\Configuration;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;

class UserRegistered extends Mailable
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
        $userId = $this->data['userid'];
        $user = User::find($userId);
        $configM = new Configuration();
        if ($user->role == UserConstants::ROLE_MEMBER) {
            $templateEmail = $configM->get(ConfigConstants::MAIL_TEMPLATE_REGISTER);
            if (!empty($templateEmail)) {
                return $this->subject('Chào mừng đến với anyLEARN - Học không giới hạn!')
                    ->view('email.raw', ['content' => $this->buildContent($templateEmail, ['username' => $user->name])]);
            } else {
                return $this->subject('Chào mừng đến với anyLEARN - Học không giới hạn!')
                    ->view('email.user_member_register')
                    ->with($this->data);
            }
        } else {
            $templateEmail = $configM->get(ConfigConstants::MAIL_TEMPLATE_PARTNER_REGISTER);
            if (!empty($templateEmail)) {
                return $this->subject('Chào mừng đến với anyLEARN - Học không giới hạn!')
                    ->view('email.raw', ['content' => $this->buildContent($templateEmail, ['username' => $user->name])]);
            } else {
                return $this->subject('Chào mừng đến với anyLEARN - Học không giới hạn!')
                    ->view('email.user_register')
                    ->with($this->data);
            }
        }
    }

    public function buildContent($template, $data)
    {
        $keys = [];
        foreach ($data as $key => $value) {
            if (!is_object($value)) {
                $keys[] = '{' . $key . '}';
            }
        }

        return str_replace(
            $keys,
            array_values($data),
            $template
        );
    }
}
