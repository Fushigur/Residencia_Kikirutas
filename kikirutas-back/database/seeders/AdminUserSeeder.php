<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'admin@gmail.com';

        $user = DB::table('users')->where('email', $email)->first();

        if ($user) {
            DB::table('users')->where('id', $user->id)->update([
                'name'       => 'Admin',
                'role_id'    => 1,
                'password'   => Hash::make('Password289'),
                'updated_at' => now(),
            ]);
        } else {
            DB::table('users')->insert([
                'name'       => 'Admin',
                'email'      => $email,
                'role_id'    => 1,
                'password'   => Hash::make('Password289'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
