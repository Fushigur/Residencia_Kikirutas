<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('rutas', function (Blueprint $table) {
            $table->id();
            $table->date('fecha')->index();
            $table->enum('estado', ['borrador','en_curso','cerrada'])->default('borrador');
            $table->unsignedBigInteger('chofer_id')->nullable();
            $table->string('nombre', 120)->nullable();
            $table->text('notas')->nullable();
            $table->decimal('distancia_km', 8,2)->nullable();
            $table->decimal('costo_estimado', 10,2)->nullable();
            $table->timestamps();

            $table->foreign('chofer_id')->references('id')->on('users')->nullOnDelete();
        });
    }
    public function down(): void {
        Schema::dropIfExists('rutas');
    }
};
