<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderNotification extends Notification
{
    use Queueable;

    protected $data; // Estructura: titulo, mensaje, tipo, severidad, cta (opcional)

    /**
     * Create a new notification instance.
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'titulo' => $this->data['titulo'],
            'mensaje' => $this->data['mensaje'],
            'tipo' => $this->data['tipo'] ?? 'info',
            'severidad' => $this->data['severidad'] ?? 'info', // info, warning, urgent
            'ctaPrimaria' => $this->data['ctaPrimaria'] ?? null,
            'ctaSecundaria' => $this->data['ctaSecundaria'] ?? null,
            'meta' => $this->data['meta'] ?? [],
        ];
    }
}
