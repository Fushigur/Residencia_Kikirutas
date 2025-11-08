<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('municipios', function (Blueprint $t) {
            $t->increments('id_municipio');
            $t->unsignedSmallInteger('id_estado');
            $t->string('nombre', 120);
            $t->boolean('activo')->default(true);
            $t->timestamps();

            $t->foreign('id_estado')->references('id_estado')->on('estados')->restrictOnDelete();
            $t->index(['id_estado','nombre']);
        });
    }
    public function down(): void { Schema::dropIfExists('municipios'); }
};
