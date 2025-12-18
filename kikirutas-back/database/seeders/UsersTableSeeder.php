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
                'id' => 1,
                'name' => 'Admin',
                'email' => 'admin@gmail.com',
                'password' => Hash::make('Admin123*'),
                'role_id' => 1,
                'telefono' => null,
                'sexo' => null,
                'edad' => null,
                'comunidad' => null,
                'municipio' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Operador → operador@gmail.com / Operador123*
            [
                'id' => 2,
                'name' => 'Operador',
                'email' => 'operador@gmail.com',
                'password' => Hash::make('Operador123*'),
                'role_id' => 2,
                'telefono' => null,
                'sexo' => null,
                'edad' => null,
                'comunidad' => null,
                'municipio' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Usuaria → usuaria@gmail.com / Usuaria123*
            [
                'id' => 3,
                'name' => 'Usuaria',
                'email' => 'usuaria@gmail.com',
                'password' => Hash::make('Usuaria123*'),
                'role_id' => 3,
                'telefono' => null,
                'sexo' => null,
                'edad' => null,
                'comunidad' => null,
                'municipio' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            // Asesores Heifer
            [
                'id' => 4,
                'name' => 'Manuel Canto',
                'email' => 'manuel.canto@heifer.org',
                'password' => Hash::make('Cumulonimbus_Arcus'),
                'role_id' => 1, // Admin
                'telefono' => '9992278159', // Ejemplo
                'sexo' => 'Hombre',
                'edad' => 25,
                'comunidad' => 'José María Morelos', // O el que corresponda
                'municipio' => 'José María Morelos',
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'id' => 5,
                'name' => 'Abraham Gutiérrez',
                'email' => 'habrahamgutierrez289@gmail.com',
                'password' => Hash::make('Skrillex289'),
                'role_id' => 1, // Admin
                'telefono' => '9841072890', // Ejemplo
                'sexo' => 'Hombre',
                'edad' => 22,
                'comunidad' => 'José María Morelos', // O el que corresponda
                'municipio' => 'José María Morelos',
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ];

        // upsert por email (clave natural)
        DB::table('users')->upsert($users, ['email'], [
            'name',
            'password',
            'role_id',
            'telefono',
            'sexo',
            'edad',
            'comunidad',
            'municipio',
            'updated_at'
        ]);
    }
}
