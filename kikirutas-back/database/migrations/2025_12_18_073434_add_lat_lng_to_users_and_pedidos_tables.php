<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Añadir a usuarios (su ubicación base)
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('lat', 10, 8)->nullable()->after('municipio');
            $table->decimal('lng', 11, 8)->nullable()->after('lat');
        });

        // Añadir a pedidos (la ubicación de entrega específica del pedido)
        Schema::table('pedidos', function (Blueprint $table) {
            $table->decimal('lat', 10, 8)->nullable()->after('direccion_entrega');
            $table->decimal('lng', 11, 8)->nullable()->after('lat');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng']);
        });
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropColumn(['lat', 'lng']);
        });
    }
};
