<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Notifications\ResetPassword;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // URL hacia tu frontend
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $front = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
            return $front.'/restablecer?token='.$token.'&email='.urlencode($notifiable->email);
        });

        // Contenido del email en español
        ResetPassword::toMailUsing(function ($notifiable, string $token) {
            $front = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
            $url   = $front.'/restablecer?token='.$token.'&email='.urlencode($notifiable->email);

            $nombre = trim($notifiable->name ?? $notifiable->nombre ?? '');
            $greet  = $nombre ? "¡Hola, {$nombre}!" : "¡Hola!";

            return (new MailMessage)
                ->subject('Restablece tu contraseña · KikiRutas')
                ->greeting($greet)
                ->line('Recibiste este correo porque se solicitó un restablecimiento de contraseña para tu cuenta.')
                ->action('Restablecer contraseña', $url)
                ->line('Este enlace caducará en :count minutos.', [
                    'count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire')
                ])
                ->line('Si no solicitaste el cambio, no necesitas hacer nada.')
                ->salutation("Saludos,\nKikiRutas");
        });
    }
}
