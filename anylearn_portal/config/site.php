<?php

use App\Constants\ConfigConstants;

return [
    ConfigConstants::CONFIG_IOS_TRANSACTION => [
        'title' => 'Giao dịch trên iOS',
        'hint' => 'Tắt giao dịch trên iOS để review app. 0: tắt; 1: mở',
        'type' => 'number',
        'value' => 0
    ],
    ConfigConstants::CONFIG_DISABLE_ANYPOINT => [
        'title' => 'Ẩn anyPoint',
        'hint' => 'Ẩn các thông tin về anyPoint trên giao diện người dùng. 1: tắt; 0: mở',
        'type' => 'number',
        'value' => 0
    ],
    ConfigConstants::CONFIG_FRIEND_TREE => [
        'title' => 'Số cấp của cây thành viên',
        'hint' => 'Chỉ đếm gián tiếp',
        'type' => 'number',
        'value' => 3
    ],
    ConfigConstants::CONFIG_NUM_COURSE => [
        'title' => 'Số khóa học nổi bật',
        'hint' => 'S/lg hiển thị trên trang chủ',
        'type' => 'number',
        'value' => 6
    ],
    ConfigConstants::CONFIG_NUM_TEACHER => [
        'title' => 'Số chuyên gia nổi bật',
        'hint' => 'S/lg hiển thị trên trang chủ',
        'type' => 'number',
        'value' => 6
    ],
    ConfigConstants::CONFIG_NUM_SCHOOL => [
        'title' => 'Số trung tâm nổi bật',
        'hint' => 'S/lg hiển thị trên trang chủ',
        'type' => 'number',
        'value' => 6
    ],
    ConfigConstants::CONFIG_FEE_MEMBER => [
        'title' => 'Phí hàng tháng của người dùng',
        'hint' => '',
        'type' => 'number',
        'value' => 930000
    ],
    ConfigConstants::CONFIG_COMMISSION_REF_VOUCHER => [
        'title' => 'Tỷ lệ commission của voucher cho nguời giới thiệu',
        'hint' => 'Nhập số thập phân. vd: 0.1 (tương đương 10%)',
        'type' => 'text',
        'value' => 0.1
    ],
    ConfigConstants::CONFIG_COMMISSION_REF_SELLER => [
        'title' => 'Tỷ lệ commission của người giới thiệu người bán',
        'hint' => 'Nhập số thập phân. vd: 0.1 (tương đương 10%)',
        'type' => 'text',
        'value' => 0.1
    ],
    ConfigConstants::CONFIG_COMMISSION => [
        'title' => 'Tỷ lệ commission gián tiếp',
        'hint' => 'Nhập số thập phân. vd: 0.05 (tương đương 5%)',
        'type' => 'text',
        'value' => 0.05
    ],
    ConfigConstants::CONFIG_DISCOUNT => [
        'title' => 'Tỷ lệ commission trực tiếp mua hàng',
        'hint' => 'Nhập số thập phân. vd: 0.1 (tương đương 10%)',
        'type' => 'text',
        'value' => 0.1
    ],
    ConfigConstants::CONFIG_COMMISSION_FOUNDATION => [
        'title' => 'Tỷ lệ foundation',
        'hint' => 'Nhập số thập phân. vd: 0.05 (tương đương 5%)',
        'type' => 'text',
        'value' => 0.05
    ],
    ConfigConstants::CONFIG_COMMISSION_AUTHOR => [
        'title' => 'Tỷ lệ mặc định của tác giả nhận được',
        'hint' => 'Nhập số thập phân. vd: 0.2 (tương đương 20%)',
        'type' => 'text',
        'value' => 0.2
    ],
    ConfigConstants::CONFIG_COMMISSION_SCHOOL => [
        'title' => 'Tỷ lệ mặc định của trường học nhận được',
        'hint' => 'Nhập số thập phân. vd: 0.2 (tương đương 20%)',
        'type' => 'text',
        'value' => 0.7
    ],
    ConfigConstants::CONFIG_COMMISSION_COMPANY => [
        'title' => 'Tỷ lệ lợi nhuận công ty nhận được',
        'hint' => 'Nhập số thập phân. vd: 0.45 (tương đương 45%)',
        'type' => 'text',
        'value' => 0.45
    ],
    ConfigConstants::CONFIG_BONUS_RATE => [
        'title' => 'Tỷ lệ chuyển tiền sử dụng về điểm thưởng',
        'hint' => 'vd: tỷ lệ 1000 thì tiêu 1000 vnd được 1 điểm',
        'type' => 'number',
        'value' => 1000
    ],
    ConfigConstants::CONFIG_NUM_CONFIRM_GOT_BONUS => [
        'title' => '% học viên xác nhận để chia bonus cho giảng viên/trung tâm',
        'hint' => 'vd: 0.2 ~ 20%',
        'type' => 'text',
        'value' => 0.2
    ],
    ConfigConstants::CONFIG_TEACHER_BANNER => [
        'title' => 'Đường dẫn banner trang giảng viên',
        'hint' => 'Upload lên S3 và dán link vào',
        'type' => 'text',
        'value' => ''
    ],
    ConfigConstants::CONFIG_SCHOOL_BANNER => [
        'title' => 'Đường dẫn banner trang trung tâm',
        'hint' => 'Upload lên S3 và dán link vào',
        'type' => 'text',
        'value' => ''
    ],
    ConfigConstants::CONFIG_OPENAPI_PRODUCTS => [
        'title' => 'Sản phẩm cho API (VNPay)',
        'hint' => 'Để trống sẽ lấy hot class. Nhập IDs khoá học, cách nhau bằng dấy phẩy',
        'type' => 'text',
        'value' => ''
    ],
];
