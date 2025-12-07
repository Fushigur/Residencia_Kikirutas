<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $notifications = $user->notifications()->latest()->get();

        return response()->json($notifications->map(function ($n) {
            return [
                'id' => $n->id,
                'titulo' => $n->data['titulo'] ?? 'Alerta',
                'mensaje' => $n->data['mensaje'] ?? '',
                'tipo' => $n->data['tipo'] ?? 'info',
                'severidad' => $n->data['severidad'] ?? 'info',
                'createdAt' => $n->created_at->valueOf(), // milliseconds
                'leida' => !is_null($n->read_at),
                'ctaPrimaria' => $n->data['ctaPrimaria'] ?? null,
                'ctaSecundaria' => $n->data['ctaSecundaria'] ?? null,
                'meta' => $n->data['meta'] ?? [],
            ];
        }));
    }

    public function markAsRead(Request $request, $id)
    {
        $user = auth()->user();
        $notification = $user->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['success' => true]);
    }

    public function markAllRead()
    {
        auth()->user()->unreadNotifications->markAsRead();
        return response()->json(['success' => true]);
    }

    public function destroy($id)
    {
        $user = auth()->user();
        $notification = $user->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->delete();
        }

        return response()->json(['success' => true]);
    }
}
