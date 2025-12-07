<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Producto;

class ProductoSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            //PAVOS
            ['nombre' => 'INICIADOR PAVO TRITURADO',         'precio' => 291.55, 'activo' => true],
            ['nombre' => 'CRECIMIENTO PAVO PELET',           'precio' => 284.14, 'activo' => true],
            ['nombre' => 'FINALIZADOR PAVO PELET',           'precio' => 243.77, 'activo' => true],
            ['nombre' => 'MANTENEDOR PAVO PELET',            'precio' => 243.77, 'activo' => true],

            //POLLOS ENGORDA
            ['nombre' => 'INICIADOR POLLO S/P MIGAJA',       'precio' => 257.83, 'activo' => true],
            ['nombre' => 'FINALIZADOR POLLO S/P TRIT',       'precio' => 221.75, 'activo' => true],
            ['nombre' => 'ECONOMICO TRASPATIO TRIT',         'precio' => 212.51, 'activo' => true],

            //POSTURA
            ['nombre' => 'INICIO POLLITA AS MIGAJA',         'precio' => 258.59, 'activo' => true],
            ['nombre' => 'CRECIMIENTO POLLA TRITURADO AS',   'precio' => 243.93, 'activo' => true],
            ['nombre' => 'POSTURA 18% AG TRITURADO / PELET', 'precio' => 238.45, 'activo' => true],
            ['nombre' => 'POSTURA 16.5% AG TRITURADO / PELET','precio' => 221.75, 'activo' => true],

            //CERDOS
            ['nombre' => 'INICIADOR CERDO PELET',            'precio' => 256.21, 'activo' => true],
            ['nombre' => 'CRECIMIENTO CERDO PELET',          'precio' => 241.98, 'activo' => true],
            ['nombre' => 'FINALIZADOR CERDO PELET',          'precio' => 228.02, 'activo' => true],
            ['nombre' => 'MANTENEDOR CERDO PELET',           'precio' => 214.79, 'activo' => true],

            //MATERIA PRIMA
            ['nombre' => 'MAÍZ GRANO',                       'precio' => 178.96, 'activo' => true],
            ['nombre' => 'PASTA DE SOYA',                    'precio' => 222.01, 'activo' => true],
            ['nombre' => 'MAÍZ MOLIDO',                      'precio' => 243.80, 'activo' => true],
            ['nombre' => 'SALVADILLO',                       'precio' => 183.90, 'activo' => true],
        ];

        foreach ($items as $item) {
            Producto::updateOrCreate(
                ['nombre' => $item['nombre']],
                [
                    'precio' => $item['precio'],
                    'activo' => $item['activo'],
                ]
            );
        }
    }
}
