<?php

namespace App\Http\Controllers;

use App\Models\Pedido;
use App\Models\Ruta;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\OrderNotification;

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
            'direccion_entrega' => 'nullable|string|max:255',
            'lat' => 'nullable|numeric',
            'lng' => 'nullable|numeric',
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

        // Rellenar lat/lng desde el usuario si no vienen
        if (empty($data['lat']) && $user) {
            $data['lat'] = $user->lat ?? null;
        }
        if (empty($data['lng']) && $user) {
            $data['lng'] = $user->lng ?? null;
        }

        $pedido = new Pedido();
        $pedido->producto = $data['producto'];
        $pedido->cantidad = $data['cantidad'] ?? 1;
        $pedido->fecha = $data['fecha'] ?? now()->toDateTimeString();
        $pedido->solicitante_nombre = $data['solicitante_nombre'] ?? null;
        $pedido->solicitante_comunidad = $data['solicitante_comunidad'] ?? null;
        $pedido->solicitante_municipio = $data['solicitante_municipio'] ?? null;
        $pedido->direccion_entrega = $data['direccion_entrega'] ?? null;
        $pedido->lat = $data['lat'] ?? null;
        $pedido->lng = $data['lng'] ?? null;
        $pedido->telefono = $data['telefono'] ?? null;
        $pedido->notas = $data['notas'] ?? null;
        $pedido->estado = 'pendiente';

        $pedido->save();

        if ($user) {
            $user->notify(new OrderNotification([
                'titulo' => 'Pedido Creado',
                'mensaje' => "Tu pedido de {$pedido->cantidad} saco(s) de {$pedido->producto} fue registrado.",
                'tipo' => 'pedido',
                'severidad' => 'info',
                'ctaPrimaria' => ['label' => 'Ver historial', 'routeName' => 'u.historial'],
                'meta' => ['pedido_id' => $pedido->id]
            ]));
        }

        // --- NOTIFICAR A LOS ADMINISTRADORES ---
        $admins = User::where('role_id', 1)->get();
        Notification::send($admins, new OrderNotification([
            'titulo' => '¡Nuevo Pedido!',
            'mensaje' => "{$pedido->solicitante_nombre} ha solicitado {$pedido->cantidad} de {$pedido->producto}.",
            'tipo' => 'pedido',
            'severidad' => 'info',
            'ctaPrimaria' => ['label' => 'Ver pedidos', 'routeName' => 'a.pedidos'],
            'meta' => ['pedido_id' => $pedido->id]
        ]));

        // Intentar asignar automáticamente este pedido a una ruta existente
        try {
            $this->autoAssignToNearestRuta($pedido);
        } catch (\Exception $e) {
            \Log::error("Error en autoasignación de ruta: " . $e->getMessage());
        }

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
            'solicitante_municipio' => 'sometimes|string|max:120|nullable',
            'direccion_entrega' => 'sometimes|string|max:255|nullable',
            'telefono' => 'sometimes|string|max:30|nullable',
            'notas' => 'sometimes|string|nullable',
        ]);

        $p->update($data);

        return $p->refresh();
    }

    /**
     * Eliminar un pedido
     */
    public function destroy(Request $req, $id)
    {
        $p = Pedido::findOrFail($id);
        $user = $req->user();

        // Si no es admin, validar propiedad y estado
        if ($user && $user->role_id !== 1) { // 1 = Admin
            // 1. Validar que el pedido sea suyo
            if ($p->solicitante_nombre !== $user->name) {
                return response()->json(['message' => 'No tienes permiso para eliminar este pedido.'], 403);
            }

            // 2. Validar que no esté entregado o en ruta (solo borrar si está pendiente)
        }

        // --- LIMPIEZA TOTAL ("de todooooo") ---

        // 1. Desvincular de rutas
        $p->rutas()->detach();

        // 2. Borrar notificaciones relacionadas (de cualquier usuario)
        // Buscamos en el JSON de la columna 'data'
        DB::table('notifications')
            ->where('data', 'like', '%"pedido_id":' . $p->id . '%')
            ->delete();

        // 3. Borrar el pedido
        $p->delete();

        return response()->noContent();
    }

    /**
     * Cambiar sólo el estado del pedido
     */
    /**
     * Cambiar sólo el estado del pedido
     */
    public function setEstado(Request $req, $id)
    {
        $p = Pedido::findOrFail($id);

        $data = $req->validate([
            'estado' => 'required|in:pendiente,en_ruta,entregado,cancelado',
        ]);

        $oldState = $p->estado;
        $p->estado = $data['estado'];
        $p->save();

        if ($oldState !== $p->estado) {
            $this->notifyOrderStatusChange($p);
        }

        return $p;
    }

    protected function notifyOrderStatusChange(Pedido $p)
    {
        // Buscar usuaria por nombre (si existe)
        if (!$p->solicitante_nombre)
            return;

        $user = \App\Models\User::where('name', $p->solicitante_nombre)->first();
        if (!$user)
            return;

        $titulo = 'Actualización de Pedido';
        $mensaje = "Tu pedido de {$p->producto} ha cambiado a: {$p->estado}";
        $tipo = 'pedido';
        $severidad = 'info';
        // Ajusta la ruta a donde quieras dirigir al usuario
        $cta = ['label' => 'Ver historial', 'routeName' => 'u.historial'];

        if ($p->estado === 'en_ruta') {
            $titulo = '¡Tu pedido va en camino!';
            $mensaje = "El pedido {$p->producto} (x{$p->cantidad}) va en camino a tu comunidad.";
            $tipo = 'entrega';
        } elseif ($p->estado === 'entregado') {
            $titulo = 'Pedido Entregado';
            $mensaje = "Tu pedido de {$p->producto} ha sido marcado como entregado. ¡Gracias!";
            $tipo = 'pedido';
            // Podrías poner success, pero tu front usa info/warning/urgent
            // 'info' o 'warning' para resaltar
        } elseif ($p->estado === 'cancelado') {
            $titulo = 'Pedido Cancelado';
            $mensaje = "Lamentamos informarte que tu pedido de {$p->producto} fue cancelado.";
            $severidad = 'urgent';
        }

        $user->notify(new \App\Notifications\OrderNotification([
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'tipo' => $tipo,
            'severidad' => $severidad,
            'ctaPrimaria' => $cta,
            'meta' => ['pedido_id' => $p->id]
        ]));
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
            ->whereIn('estado', ['borrador', 'en_curso']);

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
        if ($ruta->estado === 'en_curso') {
            $pedido->estado = 'en_ruta';
            $pedido->save();
        }
    }

}