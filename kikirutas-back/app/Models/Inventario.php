<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventario extends Model
{
    use HasFactory;

    protected $table = 'inventarios';

    protected $fillable = [
        'producto',
        'precio',
        'activo',
    ];

    // Si necesitas relación con User, descomenta esto:
    // public function user()
    // {
    //     return $this->belongsTo(User::class);
    // }

    // Elimina esta relación circular - causa problemas
    // public function inventario()
    // {
    //     return $this->hasOne(Inventario::class);
    // }
    
    public $timestamps = false;
}