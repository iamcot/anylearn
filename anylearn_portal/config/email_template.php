<?php

use App\Constants\ConfigConstants;

return [
    ConfigConstants::MAIL_TEMPLATE_REGISTER => [
        'title' => 'Chỉnh sửa nội dung mail đăng ký mới (bỏ trống nếu dùng mặc định trong code)',
        'key' =>  ConfigConstants::MAIL_TEMPLATE_REGISTER,
        'value' => '',
        'hint' => '<p>Hiện tại hỗ trợ các biến sau:</p><ul><li>{username}</li></ul>'
    ],
    ConfigConstants::MAIL_TEMPLATE_PARTNER_REGISTER => [
        'title' => 'Chỉnh sửa nội dung mail cho ĐỐI TÁC đăng ký mới (bỏ trống nếu dùng mặc định trong code)',
        'key' =>  ConfigConstants::MAIL_TEMPLATE_PARTNER_REGISTER,
        'value' => '',
        'hint' => '<p>Hiện tại hỗ trợ các biến sau:</p><ul><li>{username}</li></ul>'
    ],
];
