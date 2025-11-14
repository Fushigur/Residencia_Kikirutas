<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        // Normalizador: admin | operator | user
        $norm = static function ($r) {
            $v = strtolower((string) $r);
            return match (true) {
                str_starts_with($v, 'adm')   => 'admin',
                str_starts_with($v, 'oper')  => 'operator',
                default                       => 'user',
            };
        };

        // Soporta numérico y texto
        $byId = [
            (string)($user->role_id ?? $user->idRol ?? '') => true, // mapea abajo
        ];
        $roleFromId = null;
        if (isset($byId['1'])) $roleFromId = 'admin';
        if (isset($byId['2'])) $roleFromId = 'operator';
        if (isset($byId['3'])) $roleFromId = 'user';

        $userRole = $roleFromId
            ?? $norm(
                $user->role?->nombre   // relación "role"
                ?? $user->rol?->nombre // relación "rol"
                ?? $user->nombreRol    // texto directo
                ?? $user->role         // string "role"
                ?? ''                  // default
            );

        $required = array_map($norm, $roles ?: ['user']);

        if (!in_array($userRole, $required, true)) {
            return response()->json(['message' => 'No autorizado.'], 403);
        }

        return $next($request);
    }
}
