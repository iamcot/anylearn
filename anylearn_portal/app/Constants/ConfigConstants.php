<?php

namespace App\Constants;

class ConfigConstants
{
    const FOUNDATION_TAG = 'foundation';

    const GUIDE_TOC = 'guide_toc';
    const GUIDE_PAYMENT_TERM = 'guide_payment_term';
    const GUIDE_MEMBER  = 'guide_member';
    const GUIDE_TEACHER = 'guide_teacher';
    const GUIDE_SCHOOL = 'guide_school';
    const GUIDE_ABOUT = 'guide_about';
    const GUIDE_TOC_TEACHER = 'guide_toc_teacher';
    const GUIDE_TOC_SCHOOL = 'guide_toc_school';
    const GUIDE_PRIVACY = 'guide_privacy';
    const GUIDE_CHECKOUT = 'guide_checkout';

    const GUIDE_TOC_PARTNER = 'guide_toc_partner';
    const GUIDE_DEL_ACCOUNT = 'guide_del_account';
    const GUIDE_RETURN_TERM = 'guide_return_term';
    const GUIDE_DISPUTE_RESOLUTION  = 'guide_dispute_resolution';

    const SUPPORT_SCHOOL = 'support_school';
    const SUPPORT_TEACHER = 'support_teacher';
    const SUPPORT_MEMBER = 'support_member';
    const FAQ = 'faq';

    const CONTRACT_TEACHER = 'contract_teacher';
    const CONTRACT_SCHOOL = 'contract_school';

    const CONFIG_IOS_TRANSACTION = 'ios_transaction';
    const CONFIG_DISABLE_ANYPOINT = 'disable_anypoint';
    const CONFIG_FRIEND_TREE = 'friend_tree';
    const CONFIG_NUM_COURSE = 'num_course';
    const CONFIG_NUM_TEACHER = 'num_teacher';
    const CONFIG_NUM_SCHOOL = 'num_school';
    const CONFIG_FEE_TEACHER = 'fee_teacher';
    const CONFIG_FEE_SCHOOL = 'fee_school';
    const CONFIG_FEE_MEMBER = 'fee_member';
    const CONFIG_COMMISSION = 'commission';
    const CONFIG_DISCOUNT = 'discount';
    const CONFIG_BONUS_RATE = 'bonus_rate';
    const CONFIG_NUM_CONFIRM_GOT_BONUS = 'num_confirm';
    const CONFIG_COMMISSION_FOUNDATION = 'bonus_foundation';
    const CONFIG_COMMISSION_COMPANY = 'bonus_company';
    const CONFIG_COMMISSION_AUTHOR = 'bonus_author';
    const CONFIG_COMMISSION_SCHOOL = 'bonus_school';
    const CONFIG_COMMISSION_REF_SELLER = 'bonus_ref_seller';
    const CONFIG_COMMISSION_REF_VOUCHER = 'bonus_ref_voucher';
    const CONFIG_TEACHER_BANNER = 'teacher_banner';
    const CONFIG_SCHOOL_BANNER = 'school_banner';

    const CONFIG_OPENAPI_PRODUCTS = 'openapi_products';

    const ZALO_CODE = 'zalo_code';
    const ZALO_REFRESH = 'zalo_refresh';
    const ZALO_TOKEN = 'zalo_token';
    const ZALO_TOKEN_EXP = 'zalo_token_exp';

    const CONFIG_HOME_POPUP = 'home_popup';
    const CONFIG_HOME_POPUP_WEB = 'home_popup_web';
    const CONFIG_HOME_SPECIALS_CLASSES = 'home_special_classes';
    const CONFIG_APP_BANNERS = 'home_app_banners';

    const CONFIG_NUM_ITEM_DISPLAY = 12;
    const CONFIG_NUM_PARTNER_DISPLAY = 12;
    const CONFIG_NUM_CATEGORY_DISPLAY = 6;
    const CONFIG_NUM_LAST_SEARCH_DISPLAY = 8;
    const CONFIG_NUM_VOUCHER_DISPLAY = 3;
    const CONFIG_NUM_PAGINATION = 12;

    const TYPE_GUIDE = 'guide';
    const TYPE_CONFIG = 'config';
    const TYPE_ZALO = 'zalo';
    const TYPE_EMAIL = 'email';

    const TRANSACTION_DEPOSIT = 'deposit';
    const TRANSACTION_WITHDRAW = 'withdraw';
    const TRANSACTION_EXCHANGE = 'exchange';
    const TRANSACTION_COMMISSION = 'commission';
    const TRANSACTION_ORDER = 'order';
    const TRANSACTION_FOUNDATION = 'foundation';
    const TRANSACTION_DEPOSIT_REFUND = 'deposit_refund';
    const TRANSACTION_COMMISSION_ADD = 'commission_add';
    const TRANSACTION_PARTNER = 'partner';

    const TRANSACTION_FIN_SALARY =  'fin_salary';
    const TRANSACTION_FIN_OFFICE = 'fin_office';
    const TRANSACTION_FIN_SALE = 'fin_sale';
    const TRANSACTION_FIN_MARKETING =  'fin_marketing';
    const TRANSACTION_FIN_ASSETS =  'fin_assets';
    const TRANSACTION_FIN_OTHERS =  'fin_others';

    const TRANSACTION_STATUS_PENDING = 0;
    const TRANSACTION_STATUS_DONE = 1;
    const TRANSACTION_STATUS_REJECT = 99;

    public static $guideTitle = [
        self::GUIDE_ABOUT => 'Giới thiệu',
        self::GUIDE_MEMBER => 'HDSD - Thành viên',
        self::GUIDE_TEACHER => 'HDSD - Giảng viên',
        self::GUIDE_SCHOOL => 'HDSD - Trung tâm',
        self::GUIDE_CHECKOUT => 'HDSD - Thanh Toán',
        self::GUIDE_TOC => 'TOC - Điều khoản',
        self::GUIDE_DEL_ACCOUNT => 'TOC - Xóa tài khoản',
        self::GUIDE_TOC_SCHOOL => 'Chính sách cho Trung tâm',
        self::GUIDE_TOC_TEACHER => 'Chính sách cho Giảng viên',
        self::GUIDE_TOC_PARTNER => 'Chính sách cho Đối tác',
        self::GUIDE_PRIVACY => 'Chính sách bảo mật',
        self::GUIDE_PAYMENT_TERM => 'Chính sách thanh toán',
        self::GUIDE_RETURN_TERM => 'Chính sách đổi - trả',
        self::GUIDE_DISPUTE_RESOLUTION => 'Giải quyết tranh chấp',
        self::CONTRACT_TEACHER => 'Mẫu HĐ Giảng Viên',
        self::CONTRACT_SCHOOL => 'Mẫu HĐ Trường Học',
        self::SUPPORT_MEMBER => 'Hỗ trợ thành viên',
        self::SUPPORT_SCHOOL => 'Hỗ trợ trường học',
        self::SUPPORT_TEACHER => 'Hỗ trợ chuyên gia',
        self::FAQ => 'FAQ',
    ];

    const MAIL_TEMPLATE_REGISTER = 'mail_template_register';
    const MAIL_TEMPLATE_PARTNER_REGISTER = 'mail_template_partner_register';


    public static $mailConfigs = [
        self::MAIL_TEMPLATE_REGISTER,
        self::MAIL_TEMPLATE_PARTNER_REGISTER,

    ];
}
