<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('roles')->upsert([
            ['id' => 1, 'nombre' => 'admin',    'created_at' => now(), 'updated_at' => now()],
            ['id' => 2, 'nombre' => 'operador', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 3, 'nombre' => 'usuaria',  'created_at' => now(), 'updated_at' => now()],
        ], ['id'], ['nombre', 'updated_at']);
    }
}
