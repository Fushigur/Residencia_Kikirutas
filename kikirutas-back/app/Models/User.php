<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $fillable = ['name','email','password','role_id'];
    protected $hidden = ['password','remember_token'];

    public function role(): BelongsTo {
        return $this->belongsTo(Role::class);
    }

    public function rutasComoChofer(): HasMany {
        return $this->hasMany(Ruta::class, 'chofer_id');
    }
}
