<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('productos', function (Blueprint $t) {
            $t->increments('id_producto');
            $t->string('nombre', 100);
            $t->decimal('presentacion_kg', 6, 2)->default(40.00); // saco=40kg
            $t->decimal('precio', 10, 2)->nullable();
            $t->boolean('activo')->default(true);
            $t->timestamps();
            $t->index(['activo','nombre']);
        });
    }
    public function down(): void { Schema::dropIfExists('productos'); }
};
