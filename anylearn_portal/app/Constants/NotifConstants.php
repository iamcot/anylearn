<?php

namespace App\Constants;

class NotifConstants
{
    /** User notif */
    const NEW_USER = 'new_user';
    const NEW_FRIEND = 'new_friend';
    const CONTRACT_NEW = 'contract_new';
    const CONTRACT_APPROVED = 'contract_approved';
    const CONTRACT_DELETED = 'contract_deleted';
    const CONTRACT_SIGNED = 'contract_signed';
    const UPDATE_INFO_REMIND = 'update_info_remind';
    const REGISTER_CLASS_REMIND = 'register_class_remind';

    /** Course process */
    const COURSE_CREATED = 'course_created';
    const COURSE_APPROVED = 'course_approved';
    const COURSE_REJECTED = 'course_rejected';
    const COURSE_REGISTERED = 'course_registered';
    const COURSE_JOINED = 'course_joined';
    const COURSE_HAS_REGISTERED = 'course_has_registered';
    const COURSE_HAS_NEW = 'course_has_new';
    const COURSE_HAS_CHANGED = 'course_has_changed';
    const COURSE_SHARE = 'course_share';
    const COURSE_REGISTER_APPROVE = 'course_register_approve';
    const COURSE_REGISTER_PENDING = 'course_register_pending';
    const COURSE_REGISTER_REJECT = 'course_register_reject';
    const COURSE_RETURN = 'course_return';
    const COURSE_REFUND = 'course_refund';


    const COURSE_CERT_SENT = 'course_cert_sent';
    const COURSE_ACTIVATION_API = 'course_activation_api';
    const COURSE_ACTIVATION_MANUAL = 'course_activation_manual';

    /** Transaction */
    const TRANS_DEPOSIT_SENT = 'trans_deposit_sent';
    const TRANS_DEPOSIT_APPROVED = 'trans_deposit_approved';
    const TRANS_DEPOSIT_REJECTED = 'trans_deposit_rejected';
    const TRANS_WITHDRAW_SENT = 'trans_withdraw_sent';
    const TRANS_WITHRAW_APPROVED = 'trans_withdraw_approved';
    const TRANS_EXCHANGE_APPROVED = 'trans_exchange_approved';
    const TRANS_WITHRAW_REJECTED = 'trans_withdraw_rejected';
    const TRANS_DEPOSIT_REFUND = 'trans_deposit_return';
    const TRANS_COMMISSION_RECEIVED = 'trans_commission_received';
    const TRANS_FOUNDATION = 'trans_foundation';
    const TRANSACTIONN_UPDATE = 'transaction_update';

    /** Reminder */
    const REMIND_CONFIRM = 'remind_confirm';
    const REMIND_COURSE_JOIN = 'remind_course_join';
    const REMIND_COURSE_GOING_JOIN = 'remind_course_going_join';
    const REMIND_COURSE_GOING = 'remind_course_going';

    /** Ask forum */
    const ASK_NEW_ANSWER = 'ask_new_answer';
    const ASK_NEW_COMMENT = 'ask_new_comment';
    const ASK_ANSWER_SELECTED = 'ask_answer_selected';

    /** Voucher */
    const VOUCHER_MONEY_SENT = 'voucher_money_sent';
    const VOUCHER_CLASS_SENT = 'voucher_class_sent';
    const VOUCHER_PARTNER_SENT = 'voucher_partner_sent';

    const SYSTEM_NOTIF = 'system_notif';

    const SMS = 'sms';

    const SMS_OTP = 'sms_otp';
}
