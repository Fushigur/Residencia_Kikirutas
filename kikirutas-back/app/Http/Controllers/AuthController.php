<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

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

        $roleName = $user->role_name;       // 'admin' | 'operator' | 'user'
        $roleText = $user->role_readable;   // 'Admin' | 'Operador' | 'Usuaria'

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
        // Solo user/operator desde el front
        $validated = $request->validate([
            'name'                   => ['required', 'string', 'max:120'],
            'email'                  => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'               => ['required', 'string', 'min:8', 'confirmed'], // password_confirmation
            'role'                   => ['nullable', Rule::in(['user', 'operator'])],
            'role_id'                => ['nullable', 'integer', Rule::in([2, 3])],   // 2=operator, 3=user
            'nombreRol'              => ['nullable', 'string'],
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
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id'  => $roleId ?? 3, // por defecto Usuaria
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
            'token'                 => ['required', 'string'],
            'email'                 => ['required', 'email'],
            'password'              => ['required', 'string', 'min:8', 'confirmed'],
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
        if (in_array((int)$roleId, [2, 3], true)) return (int)$roleId;

        if ($role) {
            $v = strtolower(trim($role));
            if (str_contains($v, 'oper')) return 2;
            if (str_contains($v, 'user') || str_contains($v, 'usu')) return 3;
        }

        if ($nombreRol) {
            $v = strtolower(trim($nombreRol));
            if (str_starts_with($v, 'oper')) return 2;
            if (str_starts_with($v, 'usu'))  return 3;
        }

        if ($role) {
            $guess = $this->guessRoleNombre(strtolower(trim($role)));
            if ($guess) {
                $id = Role::where('nombre', $guess)->value('id');
                if ($id) return (int)$id;
            }
        }
        if ($nombreRol) {
            $guess = $this->guessRoleNombre(strtolower(trim($nombreRol)));
            if ($guess) {
                $id = Role::where('nombre', $guess)->value('id');
                if ($id) return (int)$id;
            }
        }

        return 3;
    }

    private function guessRoleNombre(string $v): ?string
    {
        if (str_contains($v, 'adm')) return 'admin';
        if (str_contains($v, 'oper') || str_contains($v, 'driver') || str_contains($v, 'chofer')) return 'operador';
        if (str_contains($v, 'user') || str_contains($v, 'usu')) return 'usuaria';
        return null;
    }
}
    