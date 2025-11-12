<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $req) {
        $data = $req->validate([
            'name'=>'nullable|string|max:120',
            'email'=>'required|email|unique:users,email',
            'password'=>'required|min:6',
            'role_id'=>'nullable|exists:roles,id'
        ]);

        $user = User::create([
            'name'=>$data['name'] ?? null,
            'email'=>$data['email'],
            'password'=>Hash::make($data['password']),
            'role_id'=>$data['role_id'] ?? 2,
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json(['user'=>$user->load('role'),'token'=>$token], 201);
    }

    public function login(Request $req) {
        $req->validate(['email'=>'required|email','password'=>'required']);

        $user = User::where('email',$req->email)->first();

        if (!$user || !Hash::check($req->password, $user->password)) {
            throw ValidationException::withMessages(['email'=>['Credenciales inválidas.']]);
        }

        $token = $user->createToken('auth')->plainTextToken;
        return ['user'=>$user->load('role'), 'token'=>$token];
    }

    public function me(Request $req) {
        return $req->user()->load('role');
    }

    public function logout(Request $req) {
        $req->user()->currentAccessToken()->delete();
        return response()->json(['message'=>'Sesión cerrada']);
    }
}
