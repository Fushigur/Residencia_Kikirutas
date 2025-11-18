<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Ruta; 
use Illuminate\Http\Request;

class PedidoController extends Controller
{
    /**
     * Listado de pedidos
     * - Soporta filtros por estado (?estado=...)
     * - Búsqueda general (?q=...)
     * - Si viene ?mine=1 y hay usuario autenticado, devuelve sólo SUS pedidos
     */
    public function index(Request $req)
    {
        $q    = Pedido::query();
        $user = $req->user();

        // Si viene ?mine=1 → sólo pedidos de la usuaria actual
        // Tu login actual devuelve: user.name (ej: "Claudio Perez", "Abraham Gutierrez")
        // y eso mismo se guarda en solicitante_nombre.
        if ($req->boolean('mine') && $user) {
            $q->where('solicitante_nombre', $user->name);
        }

        // Filtro por estado
        if ($estado = $req->query('estado')) {
            $q->where('estado', $estado);
        }

        // Búsqueda general
        if ($search = $req->query('q')) {
            $q->where(function ($qq) use ($search) {
                $qq->where('producto', 'like', "%{$search}%")
                    ->orWhere('solicitante_nombre', 'like', "%{$search}%")
                    ->orWhere('solicitante_comunidad', 'like', "%{$search}%");
                // Si tu tabla tiene columna folio, podrías añadir:
                // ->orWhere('folio', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $req->query('per_page', 20);

        return $q->orderByDesc('id')->paginate($perPage);
    }

        /**
     * Resumen para el panel de la usuaria:
     * - Últimos pedidos de la beneficiaria autenticada
     * - Próxima ruta donde tenga algún pedido pendiente/en_ruta
     */
    public function dashboardUsuario(Request $req)
    {
        $user = $req->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        $nombre = $user->name;

        // Últimos 3 pedidos de la usuaria (por nombre de solicitante)
        $recientes = Pedido::where('solicitante_nombre', $nombre)
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->limit(3)
            ->get(['id', 'producto', 'cantidad', 'estado', 'fecha']);

        // Próxima ruta con al menos un pedido pendiente / en_ruta de esta usuaria
        $hoy = now()->toDateString();

        $ruta = Ruta::with('chofer:id,name')
            ->whereHas('pedidos', function ($q) use ($nombre) {
                $q->where('solicitante_nombre', $nombre)
                  ->whereIn('estado', ['pendiente', 'en_ruta']);
            })
            ->whereDate('fecha', '>=', $hoy)
            ->orderBy('fecha')
            ->orderBy('id')
            ->first();

        return response()->json([
            'pedidos_recientes' => $recientes->map(function (Pedido $p) {
                return [
                    'id'       => $p->id,
                    'producto' => $p->producto,
                    'cantidad' => $p->cantidad,
                    'estado'   => $p->estado,
                    'fecha'    => $p->fecha?->toDateString(),
                ];
            }),
            'proxima_ruta' => $ruta ? [
                'id'            => $ruta->id,
                'fecha'         => $ruta->fecha?->toDateString(),
                'estado'        => $ruta->estado,
                'chofer_nombre' => $ruta->chofer?->name,
            ] : null,
        ]);
    }


    /**
     * Crear pedido desde la API
     * - Completa solicitante_nombre y solicitante_comunidad usando el usuario autenticado si no vienen en el body
     */
    public function store(Request $req)
    {
        $data = $req->validate([
            'producto'              => 'required|string|max:120',
            'cantidad'              => 'nullable|integer|min:1',
            'fecha'                 => 'nullable|date',
            'solicitante_nombre'    => 'nullable|string|max:120',
            'solicitante_comunidad' => 'nullable|string|max:120',
            'telefono'              => 'nullable|string|max:30',
            'notas'                 => 'nullable|string',
        ]);

        $user = $req->user();

        // Rellenar nombre desde el usuario autenticado si no viene en el body
        // Nos basamos en $user->name, que es lo que devuelve tu login.
        if (empty($data['solicitante_nombre']) && $user) {
            $data['solicitante_nombre'] = $user->name ?? null;
        }

        // Rellenar comunidad desde el usuario autenticado si no viene
        // (Sólo funcionará si tu tabla users tiene columna comunidad)
        if (empty($data['solicitante_comunidad']) && $user) {
            $data['solicitante_comunidad'] = $user->comunidad ?? null;
        }

        $pedido                        = new Pedido();
        $pedido->producto              = $data['producto'];
        $pedido->cantidad              = $data['cantidad'] ?? 1;
        $pedido->fecha                 = $data['fecha'] ?? now()->toDateTimeString();
        $pedido->solicitante_nombre    = $data['solicitante_nombre'] ?? null;
        $pedido->solicitante_comunidad = $data['solicitante_comunidad'] ?? null;
        $pedido->telefono              = $data['telefono'] ?? null;
        $pedido->notas                 = $data['notas'] ?? null;
        $pedido->estado                = 'pendiente';

        $pedido->save();

        return response()->json($pedido, 201);
    }

    /**
     * Ver un pedido concreto
     */
    public function show($id)
    {
        $p = Pedido::with('rutas:id,fecha,estado,nombre')->findOrFail($id);
        return $p;
    }

    /**
     * Actualizar un pedido
     */
    public function update(Request $req, $id)
    {
        $p = Pedido::findOrFail($id);

        $data = $req->validate([
            'producto'              => 'sometimes|string|max:120',
            'cantidad'              => 'sometimes|integer|min:1',
            'estado'                => 'sometimes|in:pendiente,en_ruta,entregado,cancelado',
            'fecha'                 => 'sometimes|date|nullable',
            'solicitante_nombre'    => 'sometimes|string|max:120|nullable',
            'solicitante_comunidad' => 'sometimes|string|max:120|nullable',
            'telefono'              => 'sometimes|string|max:30|nullable',
            'notas'                 => 'sometimes|string|nullable',
        ]);

        $p->update($data);

        return $p->refresh();
    }

    /**
     * Eliminar un pedido
     */
    public function destroy($id)
    {
        Pedido::findOrFail($id)->delete();
        return response()->noContent();
    }

    /**
     * Cambiar sólo el estado del pedido
     */
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
}