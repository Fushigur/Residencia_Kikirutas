<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\RutaController;

Route::get('/health', fn () => response()->noContent());

// ── Auth ───────────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('login',    [AuthController::class, 'login'])->name('auth.login');
    Route::post('register', [AuthController::class, 'register'])->name('auth.register');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me',      [AuthController::class, 'me'])->name('auth.me');
        Route::post('logout', [AuthController::class, 'logout'])->name('auth.logout');
    });
});

// ── Protegido con Sanctum ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Rutas (si usas middleware de rol, puedes activar: ->middleware('role:admin,operator'))
    Route::get('rutas',              [RutaController::class, 'index'])->name('rutas.index');
    Route::post('rutas',             [RutaController::class, 'store'])->name('rutas.store');
    Route::get('rutas/{ruta}',       [RutaController::class, 'show'])->name('rutas.show');
    Route::put('rutas/{ruta}',       [RutaController::class, 'update'])->name('rutas.update');
    Route::delete('rutas/{ruta}',    [RutaController::class, 'destroy'])->name('rutas.destroy');

    // Asignación / desasignación de pedidos a rutas
    Route::post('rutas/{id}/pedidos/{pid}',   [RutaController::class, 'assignPedido'])->name('rutas.assignPedido');
    Route::delete('rutas/{id}/pedidos/{pid}', [RutaController::class, 'unassignPedido'])->name('rutas.unassignPedido');

    // Pedidos
    Route::get('pedidos',               [PedidoController::class, 'index'])->name('pedidos.index');
    Route::get('pedidos/{pedido}',      [PedidoController::class, 'show'])->name('pedidos.show');
    Route::put('pedidos/{pedido}',      [PedidoController::class, 'update'])->name('pedidos.update');
    Route::delete('pedidos/{pedido}',   [PedidoController::class, 'destroy'])->name('pedidos.destroy');
    Route::patch('pedidos/{id}/estado', [PedidoController::class, 'setEstado'])->name('pedidos.setEstado');
});

Route::get('/health', function () {
    return response()->json([
        'ok'   => true,
        'app'  => config('app.name'),
        'env'  => config('app.env'),
        'time' => now()->toISOString(),
    ], 200);
});