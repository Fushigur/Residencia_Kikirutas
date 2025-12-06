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
        $q = Pedido::query();
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

        return $q->with('rutas:id,fecha,estado,nombre')->orderByDesc('id')->paginate($perPage);
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
                    'id' => $p->id,
                    'producto' => $p->producto,
                    'cantidad' => $p->cantidad,
                    'estado' => $p->estado,
                    'fecha' => $p->fecha?->toDateString(),
                ];
            }),
            'proxima_ruta' => $ruta ? [
                'id' => $ruta->id,
                'fecha' => $ruta->fecha?->toDateString(),
                'estado' => $ruta->estado,
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
            'producto' => 'required|string|max:120',
            'cantidad' => 'nullable|integer|min:1',
            'fecha' => 'nullable|date',
            'solicitante_nombre' => 'nullable|string|max:120',
            'solicitante_comunidad' => 'nullable|string|max:120',
            'solicitante_municipio' => 'nullable|string|max:120',
            'telefono' => 'nullable|string|max:30',
            'notas' => 'nullable|string',
        ]);

        $user = $req->user();

        // Rellenar nombre desde el usuario autenticado si no viene en el body
        if (empty($data['solicitante_nombre']) && $user) {
            $data['solicitante_nombre'] = $user->name ?? null;
        }

        // Rellenar comunidad y municipio desde el usuario autenticado si no viene
        if (empty($data['solicitante_comunidad']) && $user) {
            $data['solicitante_comunidad'] = $user->comunidad ?? null;
        }
        if (empty($data['solicitante_municipio']) && $user) {
            $data['solicitante_municipio'] = $user->municipio ?? null;
        }

        $pedido = new Pedido();
        $pedido->producto = $data['producto'];
        $pedido->cantidad = $data['cantidad'] ?? 1;
        $pedido->fecha = $data['fecha'] ?? now()->toDateTimeString();
        $pedido->solicitante_nombre = $data['solicitante_nombre'] ?? null;
        $pedido->solicitante_comunidad = $data['solicitante_comunidad'] ?? null;
        $pedido->solicitante_municipio = $data['solicitante_municipio'] ?? null;
        $pedido->telefono = $data['telefono'] ?? null;
        $pedido->notas = $data['notas'] ?? null;
        $pedido->estado = 'pendiente';

        $pedido->save();

        // Intentar asignar automáticamente este pedido a una ruta existente
        $this->autoAssignToNearestRuta($pedido);

        // Devolvemos el pedido con sus rutas cargadas (si se asignó)
        return response()->json(
            $pedido->load('rutas:id,fecha,estado,nombre'),
            201
        );
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
            'producto' => 'sometimes|string|max:120',
            'cantidad' => 'sometimes|integer|min:1',
            'estado' => 'sometimes|in:pendiente,en_ruta,entregado,cancelado',
            'fecha' => 'sometimes|date|nullable',
            'solicitante_nombre' => 'sometimes|string|max:120|nullable',
            'solicitante_comunidad' => 'sometimes|string|max:120|nullable',
            'telefono' => 'sometimes|string|max:30|nullable',
            'notas' => 'sometimes|string|nullable',
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

    /**
     * Asigna automáticamente un pedido recién creado a la "mejor" ruta disponible.
     *
     * Criterios:
     *  - misma fecha de reparto que el pedido
     *  - prioridad a rutas que ya pasan por la misma comunidad
     *  - sólo estados planificada | en_ruta
     */
    protected function autoAssignToNearestRuta(Pedido $pedido): void
    {
        // Si no tenemos fecha, usamos hoy
        $fechaPedido = $pedido->fecha
            ? $pedido->fecha->toDateString()
            : now()->toDateString();

        // Base: rutas del mismo día y en estado válido
        $baseQuery = Ruta::query()
            ->whereDate('fecha', $fechaPedido)
            ->whereIn('estado', ['planificada', 'en_ruta']);

        $ruta = null;

        // 1) Intentar una ruta que ya atienda la misma comunidad
        if (!empty($pedido->solicitante_comunidad)) {
            $ruta = (clone $baseQuery)
                ->whereHas('pedidos', function ($q) use ($pedido) {
                    $q->where('solicitante_comunidad', $pedido->solicitante_comunidad);
                })
                ->orderBy('fecha')
                ->orderBy('id')
                ->first();
        }

        // 2) Si no encontramos por comunidad, tomamos la primera ruta del día
        if (!$ruta) {
            $ruta = $baseQuery
                ->orderBy('fecha')
                ->orderBy('id')
                ->first();
        }

        if (!$ruta) {
            // No hay ruta compatible, se queda solo creado el pedido
            return;
        }

        // Vincular al pivote sin duplicar
        $ruta->pedidos()->syncWithoutDetaching([$pedido->id]);

        // Si la ruta ya está en curso → el pedido pasa a "en_ruta"
        if ($ruta->estado === 'en_ruta') {
            $pedido->estado = 'en_ruta';
            $pedido->save();
        }
    }

}