<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        // Valida (password_confirmation es el campo de confirmación)
        $validated = $request->validate([
            'name'      => ['required','string','max:255'],
            'email'     => ['required','email', Rule::unique('users','email')],
            'password'  => ['required','string','min:8','confirmed'],
            // Opcionales: distintas formas de indicar el rol
            'role_id'   => ['nullable','integer','in:1,2,3'],
            'role'      => ['nullable','string'],
            'nombreRol' => ['nullable','string'],
        ]);

        // 1) numérico directo, 2) por texto (role/nombreRol), 3) default Usuaria (id 3)
        $roleId = (int) $request->input('role_id');
        if (!$roleId) {
            $roleId = $this->mapRoleTextToId($request->input('role', $request->input('nombreRol', '')));
        }
        if (!$roleId) {
            // fallback robusto: busca por nombre 'Usuaria' en tabla roles o usa 3
            $roleId = Role::where('nombre', 'Usuaria')->value('id') ?: 3;
        }

        $user = User::create([
            'name'     => $request->input('name'),
            'email'    => $request->input('email'),
            'password' => Hash::make($request->input('password')),
            'role_id'  => $roleId,
        ]);

        $token = $user->createToken('api')->plainTextToken;

        // Devuelve datos coherentes para tu front
        $user->load('role:id,nombre'); // => $user->role->nombre
        return response()->json([
            'ok'    => true,
            'token' => $token,
            'user'  => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role_id'   => $user->role_id,
                // formas que tu front ya entiende:
                'rol'       => [
                    'idRol'     => $user->role_id,
                    'nombre'    => $user->role?->nombre,
                    'nombreRol' => $user->role?->nombre,
                ],
                'role'      => [
                    'id'        => $user->role_id,
                    'nombre'    => $user->role?->nombre,
                ],
                'nombreRol' => $user->role?->nombre,
            ],
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => ['required','email'],
            'password' => ['required','string'],
        ]);

        $user = User::where('email', $request->email)->first();
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciales inválidas'], 422);
        }

        $token = $user->createToken('api')->plainTextToken;

        $user->load('role:id,nombre');
        return response()->json([
            'ok'    => true,
            'token' => $token,
            'user'  => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role_id'   => $user->role_id,
                'rol'       => [
                    'idRol'     => $user->role_id,
                    'nombre'    => $user->role?->nombre,
                    'nombreRol' => $user->role?->nombre,
                ],
                'role'      => [
                    'id'        => $user->role_id,
                    'nombre'    => $user->role?->nombre,
                ],
                'nombreRol' => $user->role?->nombre,
            ],
        ]);
    }

    private function mapRoleTextToId(?string $raw): ?int
    {
        $v = strtolower(trim((string)$raw));
        if ($v === '') return null;

        // acepta diferentes formas
        if (str_contains($v, 'admin')) return 1;
        if (str_contains($v, 'operad') || str_contains($v, 'operator') || str_contains($v, 'chofer') || str_contains($v, 'driver')) return 2;
        if (str_contains($v, 'usuario') || str_contains($v, 'usuaria') || str_contains($v, 'user')) return 3;

        // también intentamos por nombre exacto en la tabla roles
        $id = Role::whereRaw('LOWER(nombre) = ?', [$v])->value('id');
        return $id ? (int)$id : null;
    }
}
