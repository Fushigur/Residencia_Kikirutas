<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('pedido_ruta', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('ruta_id');
            $table->unsignedBigInteger('pedido_id');
            $table->timestamps();

            $table->unique(['ruta_id','pedido_id']);
            $table->foreign('ruta_id')->references('id')->on('rutas')->cascadeOnDelete();
            $table->foreign('pedido_id')->references('id')->on('pedidos')->cascadeOnDelete();
        });
    }
    public function down(): void {
        Schema::dropIfExists('pedido_ruta');
    }
};
