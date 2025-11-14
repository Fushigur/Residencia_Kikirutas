<?php

namespace App\Http\Controllers;

use App\Models\Ruta;
use App\Models\Pedido;
use Illuminate\Http\Request;

class RutaController extends Controller
{
    public function index(Request $req)
    {
        $q = Ruta::with(['chofer:id,name,email', 'pedidos']);
        if ($fecha = $req->query('fecha')) {
            $q->whereDate('fecha', $fecha);
        }
        if ($estado = $req->query('estado')) {
            $q->where('estado', $estado);
        }
        return $q->orderByDesc('fecha')->orderBy('id')->paginate(20);
    }

    public function store(Request $req)
    {
        $data = $req->validate([
            'fecha'        => 'required|date',
            'estado'       => 'nullable|in:borrador,en_curso,cerrada',
            'chofer_id'    => 'nullable|exists:users,id',
            'nombre'       => 'nullable|string|max:120',
            'notas'        => 'nullable|string',
            'distancia_km' => 'nullable|numeric',
            'costo_estimado'=> 'nullable|numeric',
        ]);
        $ruta = Ruta::create($data);
        return response()->json($ruta->load('pedidos'), 201);
    }

    public function show($id)
    {
        return Ruta::with(['chofer:id,name,email','pedidos'])->findOrFail($id);
    }

    public function update(Request $req, $id)
    {
        $ruta = Ruta::findOrFail($id);
        $data = $req->validate([
            'fecha'        => 'sometimes|date',
            'estado'       => 'sometimes|in:borrador,en_curso,cerrada',
            'chofer_id'    => 'sometimes|nullable|exists:users,id',
            'nombre'       => 'sometimes|nullable|string|max:120',
            'notas'        => 'sometimes|nullable|string',
            'distancia_km' => 'sometimes|nullable|numeric',
            'costo_estimado'=> 'sometimes|nullable|numeric',
        ]);
        $ruta->update($data);
        return $ruta->load('pedidos');
    }

    public function destroy($id)
    {
        Ruta::findOrFail($id)->delete();
        return response()->noContent();
    }

    public function assignPedido($id, $pid)
    {
        $ruta = Ruta::findOrFail($id);
        $pedido = Pedido::findOrFail($pid);

        $ruta->pedidos()->syncWithoutDetaching([$pedido->id]);
        return response()->json([
            'ok' => true,
            'ruta' => $ruta->load('pedidos')
        ]);
    }

    public function unassignPedido($id, $pid)
    {
        $ruta = Ruta::findOrFail($id);
        $ruta->pedidos()->detach($pid);
        return response()->json([
            'ok' => true,
            'ruta' => $ruta->load('pedidos')
        ]);
    }
}
