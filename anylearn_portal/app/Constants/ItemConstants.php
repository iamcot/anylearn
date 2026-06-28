<?php

namespace App\Constants;

class ItemConstants
{
    const TYPE_COURSE = 'course';
    const TYPE_CLASS = 'class';
    const TYPE_PRODUCT = 'product';

    const SUBTYPE_ONLINE = 'online';
    const SUBTYPE_DIGITAL = 'digital';
    const SUBTYPE_OFFLINE = 'offline';
    const SUBTYPE_EXTRA = 'extra';
    const SUBTYPE_VIDEO = 'video';
    const SUBTYPE_PRESCHOOL = 'preschool';

    const ACTIVATION_SUPPORT_MANUAL = 'manual';
    const ACTIVATION_SUPPORT_API = 'api';

    const STATUS_INACTIVE = 0;
    const STATUS_ACTIVE = 1;

    const STATUS_CONFIRMED = 1;
    const STATUS_UNCONFIRMED = 0;
    
    const STATUS_ONGOING = 'ongoing';
    const STATUS_UPCOMING = 'upcoming';
    const STATUS_COMPLETED = 'completed';

    const USERSTATUS_INACTIVE = 0;
    const USERSTATUS_ACTIVE = 1;
    const USERSTATUS_DONE = 99;

    const COURSE_SYSTEM_USERID  = 1;
    const NEW_COURSE_SERIES = -1;

    const CONFIRMABLE_SUBTYPES = [
        ItemConstants::SUBTYPE_EXTRA,
        ItemConstants::SUBTYPE_OFFLINE,
        ItemConstants::SUBTYPE_ONLINE,
        ItemConstants::SUBTYPE_PRESCHOOL,
    ];

    const UNCONFIRMABLE_SUBTYPES = [
        ItemConstants::SUBTYPE_DIGITAL,
        ItemConstants::SUBTYPE_VIDEO,
    ];

    public static $locationTypes = [
        'online' => 'Online',
        'offline' => 'Offline',
    ];
}
