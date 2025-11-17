<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\RutaController;
use App\Http\Controllers\InventarioController;


// Ping de salud para el front (health check)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'time'   => now()->toISOString(),
    ]);
});


// ---------- Auth públicas ----------
Route::prefix('auth')->group(function () {
    Route::post('login',    [AuthController::class, 'login'])->name('auth.login');
    Route::post('register', [AuthController::class, 'register'])->name('auth.register');
    Route::get('me',        [AuthController::class, 'me'])->middleware('auth:sanctum')->name('auth.me');
    Route::post('logout',   [AuthController::class, 'logout'])->middleware('auth:sanctum')->name('auth.logout');

    // Recuperación de contraseña
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->name('auth.forgot');
    Route::post('reset-password',  [AuthController::class, 'resetPassword'])->name('auth.reset');
    // Editar perfil
    Route::put('profile', [AuthController::class, 'updateProfile'])
        ->middleware('auth:sanctum')
        ->name('auth.profile.update');

});

// ---------- Rutas protegidas ----------
Route::middleware('auth:sanctum')->group(function () {
    // Rutas (Admin/Operador)
    Route::get('rutas',           [RutaController::class, 'index'])->name('rutas.index');
    Route::post('rutas',          [RutaController::class, 'store'])->name('rutas.store');
    Route::get('rutas/{ruta}',    [RutaController::class, 'show'])->name('rutas.show');
    Route::put('rutas/{ruta}',    [RutaController::class, 'update'])->name('rutas.update');
    Route::delete('rutas/{ruta}', [RutaController::class, 'destroy'])->name('rutas.destroy');

    Route::post('rutas/{id}/pedidos/{pid}',   [RutaController::class, 'assignPedido'])->name('rutas.assignPedido');
    Route::delete('rutas/{id}/pedidos/{pid}', [RutaController::class, 'unassignPedido'])->name('rutas.unassignPedido');

    // Pedidos
    Route::get('pedidos',               [PedidoController::class, 'index'])->name('pedidos.index');
    Route::post('pedidos',              [PedidoController::class, 'store'])->name('pedidos.store'); 
    Route::get('pedidos/{pedido}',      [PedidoController::class, 'show'])->name('pedidos.show');
    Route::put('pedidos/{pedido}',      [PedidoController::class, 'update'])->name('pedidos.update');
    Route::delete('pedidos/{pedido}',   [PedidoController::class, 'destroy'])->name('pedidos.destroy');
    Route::patch('pedidos/{id}/estado', [PedidoController::class, 'setEstado'])->name('pedidos.setEstado');

    // Inventario de la usuaria (Mi granja)
    Route::get('inventario', [InventarioController::class, 'show'])
        ->name('inventario.show');

    Route::put('inventario', [InventarioController::class, 'upsert'])
        ->name('inventario.upsert');
});
