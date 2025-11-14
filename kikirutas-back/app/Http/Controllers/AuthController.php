<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    /* ==================== LOGIN ==================== */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
            'expected' => ['nullable', Rule::in(['admin', 'operator', 'user'])],
        ]);

        /** @var User|null $user */
        $user = User::with('role')->where('email', $data['email'])->first();

        if (!$user) {
            return response()->json(['message' => 'Correo no registrado.'], 422);
        }
        if (!Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Contraseña incorrecta.'], 422);
        }

        // Normaliza a 'admin' | 'operator' | 'user'
        $roleName = $user->role_name;         // accessor del modelo
        $roleText = $user->role_readable;     // accessor legible: Admin | Operador | Usuaria

        // Si el front envió el botón (expected) y no coincide con el rol real, avisamos
        if (!empty($data['expected']) && $data['expected'] !== $roleName) {
            return response()->json([
                'message' => "Tu cuenta es '{$roleText}'. Debes usar el botón '{$roleText}'.",
            ], 422);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'role'     => $roleName,
                'roleText' => $roleText,
            ],
        ]);
    }

    /* ==================== REGISTER ==================== */
    public function register(Request $request)
    {
        // Permitimos registro solo para user/operator desde el front
        $validated = $request->validate([
            'name'                   => ['required', 'string', 'max:120'],
            'email'                  => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'               => ['required', 'string', 'min:8', 'confirmed'], // requiere password_confirmation
            // Soportamos varias formas de indicar rol:
            'role'                   => ['nullable', Rule::in(['user', 'operator'])],
            'role_id'                => ['nullable', 'integer', Rule::in([2, 3])],   // 2=operator, 3=user
            'nombreRol'              => ['nullable', 'string'],                      // "Operador" | "Usuaria"
        ]);

        // Resolver role_id de forma robusta
        $roleId = $this->resolveRoleId(
            $request->input('role_id'),
            $request->input('role'),
            $request->input('nombreRol')
        );

        // Bloquea que alguien intente registrarse como admin
        if ($roleId === 1) {
            return response()->json(['message' => 'No está permitido registrarse como Admin.'], 422);
        }

        /** @var User $user */
        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id'  => $roleId ?? 3, // por defecto: Usuaria
        ]);

        $user->load('role');
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => [
                'id'       => $user->id,
                'name'     => $user->name,
                'email'    => $user->email,
                'role'     => $user->role_name,
                'roleText' => $user->role_readable,
            ],
        ], 201);
    }

    /* ==================== ME ==================== */
    public function me(Request $request)
    {
        /** @var User $u */
        $u = $request->user()->load('role');

        return response()->json([
            'id'       => $u->id,
            'name'     => $u->name,
            'email'    => $u->email,
            'role'     => $u->role_name,
            'roleText' => $u->role_readable,
        ]);
    }

    /* ==================== LOGOUT ==================== */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->noContent();
    }

    /* ==================== Helpers ==================== */

    /**
     * Resuelve role_id a partir de posibles inputs.
     * - role_id (numérico) → 2 u 3
     * - role (string) → 'operator' | 'user'
     * - nombreRol (string) → 'Operador' | 'Usuaria' (o variantes)
     * - fallback: 3 (Usuaria)
     */
    private function resolveRoleId($roleId, ?string $role, ?string $nombreRol): ?int
    {
        // 1) Si ya viene role_id válido (2/3), úsalo
        if (in_array((int)$roleId, [2, 3], true)) {
            return (int)$roleId;
        }

        // 2) Si viene role (user/operator)
        if ($role) {
            $v = strtolower(trim($role));
            if (str_contains($v, 'oper')) return 2;
            if (str_contains($v, 'user') || str_contains($v, 'usu')) return 3;
        }

        // 3) Si viene nombreRol (Operador/Usuaria)
        if ($nombreRol) {
            $v = strtolower(trim($nombreRol));
            if (str_starts_with($v, 'oper')) return 2;   // Operador, Operadora, Operator
            if (str_starts_with($v, 'usu'))  return 3;   // Usuaria, Usuario, User
        }

        // 4) Intento por tabla roles.nombre (admin/operador/usuaria)
        if ($role) {
            $mapText = strtolower(trim($role));
            $guess = $this->guessRoleNombre($mapText);
            if ($guess) {
                $id = Role::where('nombre', $guess)->value('id');
                if ($id) return (int)$id;
            }
        }
        if ($nombreRol) {
            $mapText = strtolower(trim($nombreRol));
            $guess = $this->guessRoleNombre($mapText);
            if ($guess) {
                $id = Role::where('nombre', $guess)->value('id');
                if ($id) return (int)$id;
            }
        }

        // 5) Fallback: Usuaria
        return 3;
    }

    /**
     * Mapea textos variados a los nombres exactos de tu tabla `roles.nombre`
     * ('admin' | 'operador' | 'usuaria')
     */
    private function guessRoleNombre(string $v): ?string
    {
        if (str_contains($v, 'adm')) return 'admin';
        if (str_contains($v, 'oper') || str_contains($v, 'driver') || str_contains($v, 'chofer')) return 'operador';
        if (str_contains($v, 'user') || str_contains($v, 'usu')) return 'usuaria';
        return null;
    }
}
