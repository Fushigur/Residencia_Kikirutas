<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckUserActive
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user() && !$request->user()->activo) {
            // Opcional: revocar tokens si quieres forzar logout inmediato
            // $request->user()->currentAccessToken()->delete();
            return response()->json(['message' => 'Tu cuenta ha sido desactivada.'], 403);
        }
        return $next($request);
    }
}
