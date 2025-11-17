<?php

namespace App\Http\Controllers;

use App\Models\Inventario;
use Illuminate\Http\Request;

class InventarioController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();
        $inv  = $user->inventario;

        if (!$inv) {
            // Valores por defecto para una granja "vacía"
            return response()->json([
                'gallinas'                 => 0,
                'sacos'                    => 0,
                'kgPorSaco'                => 40,
                'consumoGrPorGallinaDia'   => 110,
                'diasSeguridad'            => 5,
            ]);
        }

        return response()->json([
            'gallinas'                 => $inv->gallinas,
            'sacos'                    => $inv->sacos,
            'kgPorSaco'                => $inv->kg_por_saco,
            'consumoGrPorGallinaDia'   => $inv->consumo_gr_por_gallina_dia,
            'diasSeguridad'            => $inv->dias_seguridad,
        ]);
    }

    public function upsert(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'gallinas'               => ['required', 'integer', 'min:0'],
            'sacos'                  => ['required', 'integer', 'min:0'],
            'kgPorSaco'              => ['required', 'integer', 'min:1'],
            'consumoGrPorGallinaDia' => ['required', 'integer', 'min:1'],
            'diasSeguridad'          => ['required', 'integer', 'min:0'],
        ]);

        $attrs = [
            'gallinas'                   => $data['gallinas'],
            'sacos'                      => $data['sacos'],
            'kg_por_saco'                => $data['kgPorSaco'],
            'consumo_gr_por_gallina_dia' => $data['consumoGrPorGallinaDia'],
            'dias_seguridad'             => $data['diasSeguridad'],
        ];

        $inv = $user->inventario;

        if ($inv) {
            $inv->update($attrs);
        } else {
            $inv = Inventario::create($attrs + ['user_id' => $user->id]);
        }

        return response()->json([
            'gallinas'                 => $inv->gallinas,
            'sacos'                    => $inv->sacos,
            'kgPorSaco'                => $inv->kg_por_saco,
            'consumoGrPorGallinaDia'   => $inv->consumo_gr_por_gallina_dia,
            'diasSeguridad'            => $inv->dias_seguridad,
        ]);
    }
}
