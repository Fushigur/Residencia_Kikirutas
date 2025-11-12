<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ruta extends Model
{
    use HasFactory;

    protected $table = 'rutas';

    protected $fillable = [
        'fecha',
        'estado',          // borrador | en_curso | cerrada
        'chofer_id',
        'nombre',
        'notas',
        'distancia_km',
        'costo_estimado',
    ];

    protected $casts = [
        'fecha' => 'date',
    ];

    public function pedidos()
    {
        return $this->belongsToMany(Pedido::class, 'pedido_ruta', 'ruta_id', 'pedido_id')
            ->withTimestamps();
    }

    public function chofer()
    {
        return $this->belongsTo(User::class, 'chofer_id');
    }
}
