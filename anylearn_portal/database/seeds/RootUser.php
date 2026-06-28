<?php

use App\Constants\UserConstants;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RootUser extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('users')->insert(
            [
                'name' => 'Admin',
                'phone' => '1900113', 
                'refcode' => '1900113',
                'password' => Hash::make('admin@abc123'),
                'email' => 'admin@anylearn.vn',
                'role' => UserConstants::ROLE_ADMIN,
                'status' => UserConstants::STATUS_ACTIVE,
            ]
        );
        
        DB::table('users')->insert(
            [
                'name' => 'Editor',
                'phone' => '1900001', 
                'refcode' => '1900001',
                'password' => Hash::make('mod@abc123'),
                'email' => 'editor@anylearn.vn',
                'role' => UserConstants::ROLE_MOD,
                'status' => UserConstants::STATUS_ACTIVE,
            ]
        );

        DB::table('users')->insert(
            [
                'name' => 'TestSchool',
                'phone' => '1900002', 
                'refcode' => '1900002',
                'password' => Hash::make('abc123'),
                'email' => 'TestSchool@anylearn',
                'role' => UserConstants::ROLE_SCHOOL,
                'status' => UserConstants::STATUS_ACTIVE,
            ]
        );

        DB::table('users')->insert(
            [
                'name' => 'TestTeacher',
                'phone' => '1900003', 
                'refcode' => '1900003',
                'password' => Hash::make('abc123'),
                'email' => 'TestSchool@anylearn',
                'role' => UserConstants::ROLE_TEACHER,
                'status' => UserConstants::STATUS_ACTIVE,
            ]
        );
    }
}
