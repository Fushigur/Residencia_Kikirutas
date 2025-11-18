<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index()
    {
        // Devuelve todos los productos activos/inactivos, ordenados por nombre
        return Producto::orderBy('nombre')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255', 'unique:productos,nombre'],
            'precio' => ['required', 'numeric', 'min:0.01'],
            'activo' => ['sometimes', 'boolean'],
        ]);

        $producto = Producto::create([
            'nombre' => $data['nombre'],
            'precio' => $data['precio'],
            'activo' => $data['activo'] ?? true,
        ]);

        return response()->json($producto, 201);
    }

    public function update(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);

        $data = $request->validate([
            'nombre' => ['sometimes', 'string', 'max:255', 'unique:productos,nombre,' . $producto->id],
            'precio' => ['sometimes', 'numeric', 'min:0.01'],
            'activo' => ['sometimes', 'boolean'],
        ]);

        $producto->update($data);

        return response()->json($producto);
    }

    public function destroy($id)
    {
        $producto = Producto::findOrFail($id);
        $producto->delete();

        return response()->noContent();
    }
}
