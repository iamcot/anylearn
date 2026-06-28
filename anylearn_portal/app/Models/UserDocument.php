<?php

namespace App\Models;

use App\Constants\UserConstants;
use App\Constants\UserDocConstants;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class UserDocument extends Model
{
    protected $fillable = [
        'user_id', 'type', 'store', 'data', 'file_ext',
    ];
   
    public function hasDoc()
    {
        $role = Auth::user()->role;
        if (UserConstants::ROLE_TEACHER == $role) {
            return $this->where('type', UserDocConstants::TYPE_TEACHER_DOC)->count() == 0;
        } elseif (UserConstants::ROLE_SCHOOL == $role) {
            return $this->where('type', UserDocConstants::TYPE_SCHOOL_DOC)->count() == 0;
        }
        return false;
    }

    public function addDocLocal($fileObj) {
        $user = Auth::user();
        $data = [
            'user_id' => $user->id,
            'store' => UserDocConstants::STORE_LOCAL,
            'data' => $fileObj['path'],
            'file_ext' => !empty($fileObj['file_ext']) ? $fileObj['file_ext'] : '',
        ];
        if ($user->role == UserConstants::ROLE_SCHOOL) {
            $data['type'] = UserDocConstants::TYPE_SCHOOL_DOC;
        } elseif ($user->role == UserConstants::ROLE_TEACHER) {
            $data['type'] = UserDocConstants::TYPE_TEACHER_DOC;
        } else {
            $data['type'] = UserDocConstants::TYPE_FILE;
        }
        $db = $this->create($data);
        if ($db && in_array($user->role, [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])  ) {
            return User::find($user->id)->update(['update_doc' => 1]);
        }
        return false;
    }

    public function addDocWeb($fileObj, $userApi = null) {
        $user = $userApi ?? Auth::user();
        $data = [
            'user_id' => $user->id,
            'store' => UserDocConstants::STORE_WEB,
            'data' => $fileObj['url'],
            'file_ext' => !empty($fileObj['file_ext']) ? $fileObj['file_ext'] : '',
        ];
        if ($user->role == UserConstants::ROLE_SCHOOL) {
            $data['type'] = UserDocConstants::TYPE_SCHOOL_DOC;
        } elseif ($user->role == UserConstants::ROLE_TEACHER) {
            $data['type'] = UserDocConstants::TYPE_TEACHER_DOC;
        } else {
            $data['type'] = UserDocConstants::TYPE_FILE;
        }
        $db = $this->create($data);
        if ($db && in_array($user->role, [UserConstants::ROLE_SCHOOL, UserConstants::ROLE_TEACHER])  ) {
            return User::find($user->id)->update(['update_doc' => 1]);
        }
        return false;
    }

    public function getUserDocs($userId) {

    }
}
