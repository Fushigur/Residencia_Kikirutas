<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\RutaController;

Route::get('health', fn () => response()->json(['ok' => true, 'time' => now()->toISOString()]));

/**
 * Auth
 * - register: puedes dejarlo abierto en dev y cerrarlo en prod si quieres.
 */
Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::post('register', 'register'); // opcional cerrar en prod
    Route::post('login', 'login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('me', 'me');
        Route::post('logout', 'logout');
    });
});

/**
 * API protegida con Sanctum
 */
Route::middleware('auth:sanctum')->group(function () {
    // Pedidos
    Route::apiResource('pedidos', PedidoController::class);
    Route::patch('pedidos/{id}/estado', [PedidoController::class, 'setEstado']);

    // Rutas
    Route::apiResource('rutas', RutaController::class);
    Route::post('rutas/{id}/pedidos/{pid}', [RutaController::class, 'assignPedido']);
    Route::delete('rutas/{id}/pedidos/{pid}', [RutaController::class, 'unassignPedido']);
});
