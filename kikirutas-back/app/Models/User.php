<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'comunidad',
        'municipio',
        'estado',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new \App\Notifications\ResetPasswordNotification($token));
    }

    public function role()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    // normalizado: admin | operator | user
    public function getRoleNameAttribute(): string
    {
        return (string)($this->role->nombre ?? 'user');
    }

    // legible: Admin | Operador | Usuaria
    public function getRoleReadableAttribute(): string
    {
        return match ($this->role_name) {
            'admin'    => 'Admin',
            'operator' => 'Operador',
            default    => 'Usuaria',
        };
    }
}
