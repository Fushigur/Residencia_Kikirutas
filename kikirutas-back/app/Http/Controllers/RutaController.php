<?php

namespace App\Http\Controllers;

use App\Models\Ruta;
use App\Models\Pedido;
use Illuminate\Http\Request;

class RutaController extends Controller
{
    public function index(Request $req) {
        $q = Ruta::with(['chofer:id,name','pedidos:id,producto,estado'])
            ->orderByDesc('fecha');
        if ($fecha = $req->query('fecha')) $q->whereDate('fecha', $fecha);
        if ($estado = $req->query('estado')) $q->where('estado', $estado);
        return $q->paginate(20);
    }

    public function store(Request $req) {
        $data = $req->validate([
            'fecha'=>'required|date',
            'estado'=>'nullable|in:borrador,en_curso,cerrada',
            'chofer_id'=>'nullable|exists:users,id',
            'nombre'=>'nullable|string|max:120',
            'notas'=>'nullable|string',
            'distancia_km'=>'nullable|numeric|min:0',
            'costo_estimado'=>'nullable|numeric|min:0',
        ]);
        $ruta = Ruta::create($data);
        return response()->json($ruta->load('chofer'), 201);
    }

    public function show(Ruta $ruta) { return $ruta->load(['chofer:id,name','pedidos']); }

    public function update(Request $req, Ruta $ruta) {
        $data = $req->validate([
            'fecha'=>'sometimes|date',
            'estado'=>'sometimes|in:borrador,en_curso,cerrada',
            'chofer_id'=>'sometimes|nullable|exists:users,id',
            'nombre'=>'sometimes|nullable|string|max:120',
            'notas'=>'sometimes|nullable|string',
            'distancia_km'=>'sometimes|nullable|numeric|min:0',
            'costo_estimado'=>'sometimes|nullable|numeric|min:0',
        ]);
        $ruta->update($data);
        return $ruta->load('chofer');
    }

    public function destroy(Ruta $ruta) {
        $ruta->delete(); return response()->noContent();
    }

    public function asignarPedido(Request $req, Ruta $ruta) {
        $data = $req->validate(['pedido_id'=>'required|exists:pedidos,id']);
        $ruta->pedidos()->syncWithoutDetaching([$data['pedido_id']]);
        return $ruta->load('pedidos');
    }

    public function quitarPedido(Request $req, Ruta $ruta, Pedido $pedido) {
        $ruta->pedidos()->detach($pedido->id);
        return $ruta->load('pedidos');
    }

    public function marcarEnCurso(Ruta $ruta) { $ruta->update(['estado'=>'en_curso']); return $ruta; }
    public function marcarCerrada(Ruta $ruta) { $ruta->update(['estado'=>'cerrada']);  return $ruta; }

    public function marcarTodosEntregados(Ruta $ruta) {
        foreach ($ruta->pedidos as $p) $p->update(['estado'=>'entregado']);
        return $ruta->load('pedidos');
    }
}
