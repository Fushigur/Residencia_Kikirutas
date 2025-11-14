<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesTableSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // Semilla base (IDs fijos: 1 admin, 2 operador, 3 usuaria)
        $rows = [
            ['id' => 1, 'nombre' => 'admin',    'created_at' => $now, 'updated_at' => $now],
            ['id' => 2, 'nombre' => 'operador', 'created_at' => $now, 'updated_at' => $now],
            ['id' => 3, 'nombre' => 'usuaria',  'created_at' => $now, 'updated_at' => $now],
        ];

        // upsert por id; si existe, actualiza nombre/updated_at
        DB::table('roles')->upsert($rows, ['id'], ['nombre','updated_at']);
    }
}
