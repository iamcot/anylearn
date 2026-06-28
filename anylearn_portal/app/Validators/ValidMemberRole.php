<?php namespace App\Validators;

use App\Constants\UserConstants;
use App\Models\User;
use Illuminate\Contracts\Validation\Rule;

class ValidMemberRole implements Rule
{
    public function passes($attribute, $value)
    {
        if (empty($value)) {
            return false;
        }
       return in_array($value, UserConstants::$memberRoles);
    }

    public function message()
    {
        return 'Phải chọn 1 trong các vai trò trên';
    }
}