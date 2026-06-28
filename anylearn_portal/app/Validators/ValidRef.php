<?php namespace App\Validators;

use App\Models\User;
use Illuminate\Contracts\Validation\Rule;

class ValidRef implements Rule
{
    public function passes($attribute, $value)
    {
        if (empty($value)) {
            return true;
        }
        $count = User::where('refcode', $value)->count();
        return $count > 0;
    }

    public function message()
    {
        return 'Mã giới thiệu không hợp lệ';
    }
}