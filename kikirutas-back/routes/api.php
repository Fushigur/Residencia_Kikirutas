<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\PedidoController;
use App\Http\Controllers\RutaController;

Route::get('/health', fn() => ['ok'=>true, 'time'=>now()]);

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login',    [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me',     [AuthController::class, 'me']);
    Route::post('/auth/logout',[AuthController::class, 'logout']);

    Route::get('/pedidos',            [PedidoController::class, 'index']);
    Route::post('/pedidos',           [PedidoController::class, 'store']);
    Route::get('/pedidos/{pedido}',   [PedidoController::class, 'show']);
    Route::put('/pedidos/{pedido}',   [PedidoController::class, 'update']);
    Route::delete('/pedidos/{pedido}',[PedidoController::class, 'destroy']);
    Route::post('/pedidos/{pedido}/estado', [PedidoController::class, 'setEstado']);

    Route::get('/rutas',              [RutaController::class, 'index']);
    Route::post('/rutas',             [RutaController::class, 'store']);
    Route::get('/rutas/{ruta}',       [RutaController::class, 'show']);
    Route::put('/rutas/{ruta}',       [RutaController::class, 'update']);
    Route::delete('/rutas/{ruta}',    [RutaController::class, 'destroy']);

    Route::post('/rutas/{ruta}/asignar',         [RutaController::class, 'asignarPedido']);
    Route::delete('/rutas/{ruta}/quitar/{pedido}', [RutaController::class, 'quitarPedido']);
    Route::post('/rutas/{ruta}/en-curso',        [RutaController::class, 'marcarEnCurso']);
    Route::post('/rutas/{ruta}/cerrada',         [RutaController::class, 'marcarCerrada']);
    Route::post('/rutas/{ruta}/entregar-todos',  [RutaController::class, 'marcarTodosEntregados']);
});
