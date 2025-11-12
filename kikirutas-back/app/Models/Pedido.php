<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Pedido extends Model
{
    protected $fillable = [
        'producto','cantidad','estado','fecha',
        'solicitante_nombre','solicitante_comunidad','telefono','notas'
    ];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    public function rutas(): BelongsToMany {
        return $this->belongsToMany(Ruta::class, 'pedido_ruta')->withTimestamps();
    }
}
