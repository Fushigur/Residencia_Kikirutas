<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use Illuminate\Http\Request;

class PedidoController extends Controller
{
    public function index(Request $req) {
        $q = Pedido::query();
        if ($estado = $req->query('estado')) $q->where('estado', $estado);
        return $q->latest()->paginate(20);
    }

    public function store(Request $req) {
        $data = $req->validate([
            'producto'=>'required|string|max:120',
            'cantidad'=>'required|integer|min:1',
            'fecha'=>'nullable|date',
            'solicitante_nombre'=>'nullable|string|max:120',
            'solicitante_comunidad'=>'nullable|string|max:120',
            'telefono'=>'nullable|string|max:30',
            'notas'=>'nullable|string',
        ]);
        $p = Pedido::create($data);
        return response()->json($p, 201);
    }

    public function show(Pedido $pedido) { return $pedido->load('rutas:id,fecha,estado,nombre'); }

    public function update(Request $req, Pedido $pedido) {
        $data = $req->validate([
            'producto'=>'sometimes|string|max:120',
            'cantidad'=>'sometimes|integer|min:1',
            'fecha'=>'sometimes|date|nullable',
            'solicitante_nombre'=>'sometimes|string|nullable|max:120',
            'solicitante_comunidad'=>'sometimes|string|nullable|max:120',
            'telefono'=>'sometimes|string|nullable|max:30',
            'notas'=>'sometimes|string|nullable',
        ]);
        $pedido->update($data);
        return $pedido;
    }

    public function destroy(Pedido $pedido) {
        $pedido->delete();
        return response()->noContent();
    }

    public function setEstado(Request $req, Pedido $pedido) {
        $data = $req->validate(['estado'=>'required|in:pendiente,en_ruta,entregado,cancelado']);
        $pedido->update(['estado'=>$data['estado']]);
        return $pedido;
    }
}
