<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\{Role,User,Pedido,Ruta};

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = Role::firstOrCreate(['nombre'=>'admin']);
        $oper  = Role::firstOrCreate(['nombre'=>'operador']);

        $u = User::firstOrCreate(
            ['email'=>'admin@gmail.com'],
            ['name'=>'Admin','password'=>Hash::make('password'), 'role_id'=>$admin->id]
        );

        $p1 = Pedido::factory()->create([
            'producto'=>'Alimento A-20 kg','cantidad'=>5,
            'solicitante_nombre'=>'María Poot','solicitante_comunidad'=>'Kancabchén',
        ]);
        $p2 = Pedido::factory()->create([
            'producto'=>'Alimento B-40 kg','cantidad'=>2,
            'solicitante_nombre'=>'Juana Canul','solicitante_comunidad'=>'Dziuché',
        ]);

        $ruta = Ruta::create([
            'fecha'=>now()->toDateString(),
            'estado'=>'borrador',
            'chofer_id'=>$u->id,
            'nombre'=>'Ruta de prueba',
        ]);

        $ruta->pedidos()->sync([$p1->id,$p2->id]);
    }
}
