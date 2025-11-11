<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('comunidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('municipio_id')
                  ->constrained('municipios')
                  ->cascadeOnDelete();

            $table->string('nombre');

            // Reemplazo del point():
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();

            $table->timestamps();

            $table->unique(['municipio_id', 'nombre']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comunidades');
    }
};
