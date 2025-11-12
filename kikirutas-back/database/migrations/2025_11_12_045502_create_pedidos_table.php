<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('pedidos', function (Blueprint $table) {
            $table->id();
            $table->string('producto', 120);
            $table->unsignedInteger('cantidad')->default(1);
            $table->enum('estado', ['pendiente','en_ruta','entregado','cancelado'])->default('pendiente');
            $table->dateTime('fecha')->nullable();
            $table->string('solicitante_nombre', 120)->nullable();
            $table->string('solicitante_comunidad', 120)->nullable();
            $table->string('telefono', 30)->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('pedidos');
    }
};
