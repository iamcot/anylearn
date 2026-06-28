<?php

namespace App\Constants;

class UserConstants
{
    const ROLE_ADMIN = 'admin';
    const ROLE_MOD = 'mod';
    const ROLE_CONTENT = 'content';
    const ROLE_SALE = 'sale';
    const ROLE_FIN = 'fin';
    const ROLE_MEMBER = 'member';
    const ROLE_TEACHER = 'teacher';
    const ROLE_SCHOOL = 'school';
    const ROLE_SALE_CONTENT = 'sale_content';
    const ROLE_SALE_MANAGER = 'sale_manager';
    const ROLE_FIN_PARTNER = 'fin_partner';
 
    const PRIORITY_NEW = 0;
    const PRIORITY_URGEN = 1;
    const PRIORITY_ASAP = 2;
    const PRIORITY_NEED = 3;
    const PRIORITY_SINGLE = 4;
    const PRIORITY_DONE = 99;

    const STATUS_ACTIVE = 1;
    const STATUS_INACTIVE = 0;

    const WALLET_M = 'wallet_m';
    const WALLET_C = 'wallet_c';
    const VOUCHER = 'voucher';

    const PP = 20;

    public static $memberRoles = [self::ROLE_MEMBER, self::ROLE_TEACHER, self::ROLE_SCHOOL];
    public static $saleRoles = [self::ROLE_SALE, self::ROLE_SALE_CONTENT,self::ROLE_SALE_MANAGER];
    public static $modRoles = [self::ROLE_MOD, self::ROLE_ADMIN, self::ROLE_SALE, self::ROLE_CONTENT, self::ROLE_FIN, self::ROLE_SALE_CONTENT ,self::ROLE_SALE_MANAGER];
    public static $parterRoles = [self::ROLE_FIN_PARTNER];
    public static $modparterRoles = [self::ROLE_FIN_PARTNER, self::ROLE_MOD, self::ROLE_ADMIN, self::ROLE_SALE, self::ROLE_CONTENT, self::ROLE_FIN, self::ROLE_SALE_CONTENT,self::ROLE_SALE_MANAGER];
    
    public static $salePriorityLevels = [
        self::PRIORITY_NEW => 'New',
        self::PRIORITY_URGEN => 'Urgen',
        self::PRIORITY_ASAP => 'Asap',
        self::PRIORITY_NEED => 'Need', 
        self::PRIORITY_SINGLE => 'Single', 
        self::PRIORITY_DONE => 'Done',
    ];

    public static $salePriorityColors = [
        self::PRIORITY_NEW => '#fff',
        self::PRIORITY_URGEN => 'Red',
        self::PRIORITY_ASAP => 'Orange', 
        self::PRIORITY_NEED => 'Yellow', 
        self::PRIORITY_SINGLE => 'Grey', 
        self::PRIORITY_DONE => 'Green',
    ];

    public static $statusText = [
        self::STATUS_ACTIVE => 'Hoạt động',
        self::STATUS_INACTIVE => 'Đã khóa'
    ];

    const CONTRACT_DELETED = 0;
    const CONTRACT_NEW = 1;
    const CONTRACT_SIGNED = 10;
    const CONTRACT_APPROVED = 99;

}
