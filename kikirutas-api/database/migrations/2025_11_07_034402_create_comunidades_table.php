<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('comunidades', function (Blueprint $t) {
            $t->bigIncrements('id_comunidad');
            $t->unsignedInteger('id_municipio');
            $t->string('nombre', 160);
            $t->geometry('geom')->nullable();   // MULTIPOLYGON (cárgalo con SRID 4326)
            $t->point('centroide')->nullable(); // POINT (cárgalo con SRID 4326)
            $t->boolean('activo')->default(true);
            $t->timestamps();

            $t->foreign('id_municipio')->references('id_municipio')->on('municipios')->restrictOnDelete();
            $t->index(['id_municipio','nombre']);
            $t->spatialIndex('geom');
            $t->spatialIndex('centroide');
        });
    }
    public function down(): void { Schema::dropIfExists('comunidades'); }
};
