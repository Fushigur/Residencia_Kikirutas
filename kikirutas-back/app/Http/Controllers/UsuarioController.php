<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    public function index()
    {
        return User::orderBy('id', 'desc')->get();
    }

    public function store(Request $req)
    {
        $data = $req->validate([
            'name' => 'required|string|max:120',
            'email' => 'required|email|unique:users,email',
            'telefono' => 'nullable|string|max:20',
            'comunidad' => 'nullable|string|max:120',
            'role_id' => 'required|integer|in:1,2,3'
        ]);

        $data['password'] = bcrypt('12345678');

        $u = User::create($data);

        return response()->json($u, 201);
    }

    public function update(Request $req, $id)
    {
        $u = User::findOrFail($id);

        $data = $req->validate([
            'name' => 'sometimes|string|max:120',
            'email' => 'sometimes|email|unique:users,email,' . $u->id,
            'telefono' => 'sometimes|nullable|string|max:20',
            'comunidad' => 'sometimes|nullable|string|max:120',
            'role_id' => 'sometimes|integer|in:1,2,3',
            'activo' => 'sometimes|boolean',
        ]);

        $u->update($data);

        return $u;
    }
}
