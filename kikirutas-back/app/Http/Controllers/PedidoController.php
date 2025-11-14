<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use Illuminate\Http\Request;

class PedidoController extends Controller
{
    public function index(Request $req)
    {
        $q = Pedido::query();

        if ($estado = $req->query('estado')) {
            $q->where('estado', $estado);
        }
        if ($search = $req->query('q')) {
            $q->where(function ($qq) use ($search) {
                $qq->where('producto', 'like', "%$search%")
                   ->orWhere('solicitante_nombre', 'like', "%$search%")
                   ->orWhere('solicitante_comunidad', 'like', "%$search%");
            });
        }

        $per = (int)($req->query('per_page', 20));
        return $q->orderByDesc('id')->paginate($per);
    }

    public function store(Request $req)
    {
        $data = $req->validate([
            'producto'               => 'required|string|max:120',
            'cantidad'               => 'nullable|integer|min:1',
            'fecha'                  => 'nullable|date',
            'solicitante_nombre'     => 'nullable|string|max:120',
            'solicitante_comunidad'  => 'nullable|string|max:120',
            'telefono'               => 'nullable|string|max:30',
            'notas'                  => 'nullable|string',
        ]);

        $p = Pedido::create($data);
        return response()->json($p, 201);
    }

    public function show($id)
    {
        $p = Pedido::with('rutas:id,fecha,estado,nombre')->findOrFail($id);
        return $p;
    }

    public function update(Request $req, $id)
    {
        $p = Pedido::findOrFail($id);
        $data = $req->validate([
            'producto'               => 'sometimes|string|max:120',
            'cantidad'               => 'sometimes|integer|min:1',
            'estado'                 => 'sometimes|in:pendiente,en_ruta,entregado,cancelado',
            'fecha'                  => 'sometimes|date|nullable',
            'solicitante_nombre'     => 'sometimes|string|max:120|nullable',
            'solicitante_comunidad'  => 'sometimes|string|max:120|nullable',
            'telefono'               => 'sometimes|string|max:30|nullable',
            'notas'                  => 'sometimes|string|nullable',
        ]);
        $p->update($data);
        return $p->refresh();
    }

    public function destroy($id)
    {
        Pedido::findOrFail($id)->delete();
        return response()->noContent();
    }

    public function setEstado(Request $req, $id)
    {
        $p = Pedido::findOrFail($id);
        $data = $req->validate([
            'estado' => 'required|in:pendiente,en_ruta,entregado,cancelado',
        ]);
        $p->estado = $data['estado'];
        $p->save();
        return $p;
    }

    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }


}
