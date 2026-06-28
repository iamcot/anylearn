<?php

namespace App\Validators;

use App\Models\User;
use Illuminate\Contracts\Validation\Rule;

class UniquePhone implements Rule
{
    public function passes($attribute, $value)
    {
        if (empty($value)) {
            return false;
        }
        $exists = User::where('phone', $value)->where('is_registered', 1)->first();
        if ($exists) {
            return false;
        }
        return true;
    }

    public function message()
    {
        return 'SDT đã tồn tại';
    }
}
