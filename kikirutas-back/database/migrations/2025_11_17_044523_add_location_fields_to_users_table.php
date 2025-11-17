<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('comunidad')->nullable()->after('email');
            $table->string('municipio')->nullable()->after('comunidad');
            $table->string('estado')->nullable()->after('municipio');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['comunidad', 'municipio', 'estado']);
        });
    }
};
