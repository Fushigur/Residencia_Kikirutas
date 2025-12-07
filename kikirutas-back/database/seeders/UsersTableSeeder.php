<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Limpio por si quieres resembrar siempre iguales (opcional)
        // DB::table('users')->truncate();

        $users = [
            // Admin → admin@gmail.com / Admin123*
            [
                'id'         => 1,
                'name'       => 'Admin',
                'email'      => 'admin@gmail.com',
                'password'   => Hash::make('Admin123*'),
                'role_id'    => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Operador → operador@gmail.com / Operador123*
            [
                'id'         => 2,
                'name'       => 'Operador',
                'email'      => 'operador@gmail.com',
                'password'   => Hash::make('Operador123*'),
                'role_id'    => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Usuaria → usuaria@gmail.com / Usuaria123*
            [
                'id'         => 3,
                'name'       => 'Usuaria',
                'email'      => 'usuaria@gmail.com',
                'password'   => Hash::make('Usuaria123*'),
                'role_id'    => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        // upsert por email (clave natural)
        DB::table('users')->upsert($users, ['email'], ['name','password','role_id','updated_at']);
    }
}
