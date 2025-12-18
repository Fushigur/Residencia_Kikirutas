<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pedido extends Model
{
    use HasFactory;

    protected $table = 'pedidos';

    protected $fillable = [
        'producto',
        'cantidad',
        'estado',              // pendiente | en_ruta | entregado | cancelado
        'fecha',               // DATETIME/DATE
        'solicitante_nombre',
        'solicitante_comunidad',
        'solicitante_municipio',
        'direccion_entrega',
        'lat',
        'lng',
        'telefono',
        'notas',
    ];

    protected $casts = [
        'fecha' => 'datetime',
    ];

    public function rutas()
    {
        // pivote por defecto: pedido_ruta (ruta_id, pedido_id)
        return $this->belongsToMany(Ruta::class, 'pedido_ruta', 'pedido_id', 'ruta_id')
            ->withTimestamps();
    }
}
