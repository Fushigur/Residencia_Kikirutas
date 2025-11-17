<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventario extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'gallinas',
        'sacos',
        'kg_por_saco',
        'consumo_gr_por_gallina_dia',
        'dias_seguridad',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

        public function inventario()
    {
        return $this->hasOne(Inventario::class);
    }

}
