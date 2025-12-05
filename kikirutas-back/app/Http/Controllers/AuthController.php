<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;

class AuthController extends Controller
{
    /* ==================== LOGIN ==================== */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
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

        if (!$user->activo) {
            return response()->json(['message' => 'Tu cuenta ha sido desactivada. Contacta al administrador.'], 403);
        }

        $roleName = $user->role_name;      // 'admin' | 'operator' | 'user'
        $roleText = $user->role_readable;  // 'Admin' | 'Operador' | 'Usuaria'

        if (!empty($data['expected']) && $data['expected'] !== $roleName) {
            return response()->json([
                'message' => "Tu cuenta es '{$roleText}'. Debes usar el botón '{$roleText}'.",
            ], 422);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'edad' => $user->edad,
                'telefono' => $user->telefono,
                'role' => $roleName,
                'sexo' => $user->sexo,
                'roleText' => $roleText,
                // Datos de ubicación (si existen en la tabla users)
                'comunidad' => $user->comunidad,
                'municipio' => $user->municipio,
                'estado' => $user->estado,
            ],
        ]);
    }

    /* ==================== REGISTER ==================== */
    public function register(Request $request)
    {
        // Por si el front manda otros nombres de campo (ej. comunidadNombre, localidad, etc.)
        $request->merge([
            'comunidad' => $request->input('comunidad')
                ?? $request->input('comunidadNombre')
                ?? $request->input('localidad'),
            'municipio' => $request->input('municipio')
                ?? $request->input('municipioNombre'),
            'estado' => $request->input('estado')
                ?? $request->input('estadoNombre'),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'], // password_confirmation
            'role' => ['nullable', Rule::in(['user', 'operator'])],
            'role_id' => ['nullable', 'integer', Rule::in([2, 3])],   // 2=operator, 3=user
            'nombreRol' => ['nullable', 'string'],

            'telefono' => ['nullable', 'string', 'max:20'],
            'sexo' => ['nullable', 'string', 'max:20'],
            'edad' => ['nullable', 'integer', 'min:10', 'max:120'],

            // Campos opcionales de ubicación
            'comunidad' => ['nullable', 'string', 'max:120'],
            'municipio' => ['nullable', 'string', 'max:120'],
            'estado' => ['nullable', 'string', 'max:120'],
        ]);

        $roleId = $this->resolveRoleId(
            $request->input('role_id'),
            $request->input('role'),
            $request->input('nombreRol')
        );

        if ($roleId === 1) {
            return response()->json(['message' => 'No está permitido registrarse como Admin.'], 422);
        }

        /** @var User $user */
        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $roleId ?? 3, // por defecto Usuaria

            // contacto
            'telefono' => $validated['telefono'] ?? null,
            'sexo' => $validated['sexo'] ?? null,
            'edad' => $validated['edad'] ?? null,

            // ubicación
            'comunidad' => $validated['comunidad'] ?? null,
            'municipio' => $validated['municipio'] ?? null,
            'estado' => $validated['estado'] ?? null,
        ]);

        $user->load('role');
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role_name,
                'roleText' => $user->role_readable,
                'telefono' => $user->telefono,
                'sexo' => $user->sexo,
                'edad' => $user->edad,
                'comunidad' => $user->comunidad,
                'municipio' => $user->municipio,
                'estado' => $user->estado,
            ],
        ], 201);

    }

    /* ==================== ME ==================== */
    public function me(Request $request)
    {
        /** @var User $u */
        $u = $request->user()->load('role');

        return response()->json([
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role_name,
            'roleText' => $u->role_readable,

            // Nuevos campos
            'telefono' => $u->telefono,
            'sexo' => $u->sexo,
            'edad' => $u->edad,

            'comunidad' => $u->comunidad,
            'municipio' => $u->municipio,
            'estado' => $u->estado,
        ]);
    }

    /* ==================== UPDATE PROFILE ==================== */
    public function updateProfile(Request $request)
    {
        /** @var User $u */
        $u = $request->user();

        // Validamos solo lo que sí puede cambiar la usuaria
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:120'],
            'telefono' => ['nullable', 'string', 'max:20'],
            'sexo' => ['nullable', 'string', 'max:20'],
            'edad' => ['nullable', 'integer', 'min:10', 'max:120'],
            // si en un futuro quieres permitir cambio de comunidad/municipio/estado,
            // los agregamos aquí y manejamos la lógica de aprobación aparte.
        ]);

        if (array_key_exists('name', $data)) {
            $u->name = $data['name'];
        }
        if (array_key_exists('telefono', $data)) {
            $u->telefono = $data['telefono'];
        }
        if (array_key_exists('sexo', $data)) {
            $u->sexo = $data['sexo'];
        }
        if (array_key_exists('edad', $data)) {
            $u->edad = $data['edad'];
        }

        $u->save();

        // Regresamos el usuario en el mismo formato que login/me
        $u->load('role');

        return response()->json([
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role_name,
            'roleText' => $u->role_readable,
            'telefono' => $u->telefono,
            'sexo' => $u->sexo,
            'edad' => $u->edad,
            'comunidad' => $u->comunidad,
            'municipio' => $u->municipio,
            'estado' => $u->estado,
        ]);
    }



    /* ==================== LOGOUT ==================== */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->noContent();
    }

    /* ==================== FORGOT PASSWORD ==================== */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            // En desarrollo, con MAIL_MAILER=log, el enlace se verá en storage/logs/laravel.log
            return response()->json(['message' => __($status)], 200);
        }

        return response()->json(['message' => __($status)], 422);
    }

    /* ==================== RESET PASSWORD ==================== */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                /** @var User $user */
                $user->forceFill([
                    'password' => Hash::make($request->password),
                ])->save();

                // Invalida tokens anteriores por seguridad
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 200);
        }

        return response()->json(['message' => __($status)], 422);
    }

    /* ==================== Helpers ==================== */
    private function resolveRoleId($roleId, ?string $role, ?string $nombreRol): ?int
    {
        if (in_array((int) $roleId, [2, 3], true)) {
            return (int) $roleId;
        }

        if ($role) {
            $v = strtolower(trim($role));
            if (str_contains($v, 'oper'))
                return 2;
            if (str_contains($v, 'user') || str_contains($v, 'usu'))
                return 3;
        }

        if ($nombreRol) {
            $v = strtolower(trim($nombreRol));
            if (str_starts_with($v, 'oper'))
                return 2;
            if (str_starts_with($v, 'usu'))
                return 3;
        }

        if ($role) {
            $guess = $this->guessRoleNombre(strtolower(trim($role)));
            if ($guess) {
                $id = Role::where('nombre', $guess)->value('id');
                if ($id)
                    return (int) $id;
            }
        }

        if ($nombreRol) {
            $guess = $this->guessRoleNombre(strtolower(trim($nombreRol)));
            if ($guess) {
                $id = Role::where('nombre', $guess)->value('id');
                if ($id)
                    return (int) $id;
            }
        }

        return 3;
    }

    private function guessRoleNombre(string $v): ?string
    {
        if (str_contains($v, 'adm'))
            return 'admin';
        if (str_contains($v, 'oper') || str_contains($v, 'driver') || str_contains($v, 'chofer'))
            return 'operador';
        if (str_contains($v, 'user') || str_contains($v, 'usu'))
            return 'usuaria';
        return null;
    }

    /* ==================== OPERADORES ==================== */
    public function operators(Request $request)
    {
        // Operadores = usuarios con role_id = 2
        $q = User::query()
            ->where('role_id', 2);

        // (Opcional) filtros por estado / municipio / comunidad
        if ($request->filled('estado')) {
            $q->where('estado', $request->input('estado'));
        }
        if ($request->filled('municipio')) {
            $q->where('municipio', $request->input('municipio'));
        }
        if ($request->filled('comunidad')) {
            $q->where('comunidad', $request->input('comunidad'));
        }

        $ops = $q->orderBy('name')->get([
            'id',
            'name',
            'email',
            'telefono',
            'comunidad',
            'municipio',
            'estado',
        ]);

        return response()->json($ops);
    }

}
