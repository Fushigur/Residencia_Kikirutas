<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Campos de contacto
            $table->string('telefono', 20)->nullable()->after('email');
            $table->string('sexo', 20)->nullable()->after('telefono');
            $table->unsignedTinyInteger('edad')->nullable()->after('sexo');

            // Si quieres agregar apellidos después, se puede aquí también.
            // $table->string('apellido_paterno', 120)->nullable()->after('name');
            // $table->string('apellido_materno', 120)->nullable()->after('apellido_paterno');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['telefono', 'sexo', 'edad']);
        });
    }
};
