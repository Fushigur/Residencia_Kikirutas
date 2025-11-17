<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventarios', function (Blueprint $table) {
            $table->id();

            // 1 a 1 con users
            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->onDelete('cascade');

            $table->unsignedInteger('gallinas')->default(0);
            $table->unsignedInteger('sacos')->default(0);
            $table->unsignedInteger('kg_por_saco')->default(40);
            $table->unsignedInteger('consumo_gr_por_gallina_dia')->default(110);
            $table->unsignedInteger('dias_seguridad')->default(5);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventarios');
    }
};
