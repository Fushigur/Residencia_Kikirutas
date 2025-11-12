<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Ruta extends Model
{
    protected $fillable = [
        'fecha','estado','chofer_id','nombre','notas','distancia_km','costo_estimado'
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function chofer(): BelongsTo {
        return $this->belongsTo(User::class, 'chofer_id');
    }

    public function pedidos(): BelongsToMany {
        return $this->belongsToMany(Pedido::class, 'pedido_ruta')->withTimestamps();
    }
}
