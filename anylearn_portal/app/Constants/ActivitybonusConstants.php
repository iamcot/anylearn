<?php

namespace App\Constants;

class ActivitybonusConstants
{
    const Activitybonus_Update_Avatar ='Activitybonus_Update_Avatar';
    const Activitybonus_Update_Banner ='Activitybonus_Update_Banner';
    const Activitybonus_Update_Email ='Activitybonus_Update_Email';
    const Activitybonus_Update_Address ='Activitybonus_Update_Address';
    const Activitybonus_Course_Favourite ='Activitybonus_Course_Favourite';
    const Activitybonus_Course_Share ='Activitybonus_Course_Share';
    const Activitybonus_Course_Evaluate ='Activitybonus_Course_Evaluate';
    const Activitybonus_Course_Feedback ='Activitybonus_Course_Feedback';
    const Activitybonus_Referral ='Activitybonus_Referral';
    const TYPE_CONFIG = 'config';
    const Activitybonus_Bonus = 'bonus';


    public static $activitybonuses = [
        self::Activitybonus_Update_Avatar => 5,
        self::Activitybonus_Update_Banner => 5,
        self::Activitybonus_Update_Email => 10,
        self::Activitybonus_Update_Address => 10,
        self::Activitybonus_Course_Favourite => 5,
        self::Activitybonus_Course_Share => 10,
        self::Activitybonus_Course_Evaluate => 5,
        self::Activitybonus_Course_Feedback => 10,
        self::Activitybonus_Referral => 20,
    ];
}
