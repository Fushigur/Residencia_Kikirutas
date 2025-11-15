<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends Notification
{
    use Queueable;

    public string $token;

    public function __construct(string $token)
    {
        $this->token = $token;
    }

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        // URL del frontend donde vive tu pantalla de "restablecer"
        $frontend = config('app.frontend_url', env('FRONT_APP_URL', 'http://localhost:5173'));

        // Enlace con token + email
        $url = rtrim($frontend, '/').'/restablecer?token='
             .$this->token.'&email='.urlencode($notifiable->email);

        // Minutos de expiración del token (según auth.php)
        $passwordBroker = config('auth.defaults.passwords', 'users');
        $minutes = (int) config("auth.passwords.$passwordBroker.expire", 5);

        return (new MailMessage)
            ->subject('Restablecer contraseña')
            ->greeting('¡Hola!')
            ->line('Recibiste este correo porque se solicitó un restablecimiento de contraseña para tu cuenta.')
            ->action('Restablecer contraseña', $url)
            ->line("Este enlace de restablecimiento expira en {$minutes} minutos.")
            ->line('Si no solicitaste el cambio, no es necesario hacer nada.')
            // No agregamos un texto extra de fallback: el layout ya incluye uno automáticamente
            ->salutation("Saludos,\n".config('app.name'));
    }
}
