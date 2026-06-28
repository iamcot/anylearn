<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    protected $fillable = [
        'user_id', 'status', 'type', 'cert_id', 'cert_place', 'cert_date',
        'tax', 'ref', 'ref_title', 'address', 'commission', 'email', 'dob', 'dob_place',
        'bank_name', 'bank_branch', 'bank_no', 'bank_account', 'signed',
    ];

    public static function makeContent($template, $user, $contract)
    {
        $contractArray = [
            '{name}' => $user->name,
            '{phone}' => $user->phone,
            '{refcode}' => $user->refcode,
        ];
        foreach (json_decode(json_encode($contract), true) as $key => $value) {
            if (in_array($key, ['dob', 'cert_date', 'created_at', 'updated_at'])) {
                $contractArray["{" . $key . "}"] = date('d/m/Y', strtotime($value));
            } elseif ($key == 'commission') {
                $contractArray["{commission}"] = ((1 - $value)* 100) . "%";
            } elseif ($key == 'signed' && !empty($value)) {
                $contractArray["{signed}"] = '<img src="' . $value . '" style="width:100px;">';
            } else {
                $contractArray["{" . $key . "}"] = $value;
            }
        }
        return strtr($template, $contractArray);
    }

    public static function makeTeacherContent($template, $user, $contract)
    {
        return strtr($template, [
            '{id}' => $contract->id,
            '{name}' => $user->name,
            '{dob}' => $contract->dob,
            '{dob_place}' => $contract->dob_place,
            '{cert_id}' => $contract->cert_id,
            '{cert_place}' => $contract->cert_place,
            '{address}' => $contract->address,
            '{phone}' => $user->phone,
            '{email}' => $contract->email,
            '{bank_name}' => $contract->bank_name,
            '{bank_no}' => $contract->bank_no,
            '{bank_account}' => $contract->bank_account,
        ]);
    }

    public static function makeSchoolContent($template, $user, $contract)
    {
        return strtr($template, [
            '{id}' => $contract->id,
            '{name}' => $user->name,
            '{refcode}' => $user->refcode,
            '{tax}' => $contract->tax,
            '{ref}' => $contract->ref,
            '{ref_title}' => $contract->ref_title,
            '{cert_id}' => $contract->cert_id,
            '{cert_date}' => $contract->cert_date,
            '{address}' => $contract->address,
            '{phone}' => $user->phone,
            '{email}' => $contract->email,
            '{bank_name}' => $contract->bank_name,
            '{bank_no}' => $contract->bank_no,
            '{bank_account}' => $contract->bank_account,
        ]);
    }
}
