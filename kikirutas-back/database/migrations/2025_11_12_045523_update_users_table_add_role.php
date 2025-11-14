<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // agregar columna role_id si no existe
        if (!Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                // default 3 = usuaria (evita NULLs si ya hay usuarios)
                $table->foreignId('role_id')->default(3)->after('id');
            });
        }

        // FK (ignorar si ya existe)
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('role_id')
                      ->references('id')->on('roles')
                      ->cascadeOnUpdate()
                      ->restrictOnDelete();
            });
        } catch (\Throwable $e) {
            // ya existe la FK
        }

        // asegurar name nullable (sin romper si no está DBAL)
        if (Schema::hasColumn('users', 'name')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('name', 120)->nullable()->change();
                });
            } catch (\Throwable $e) {
                try {
                    DB::statement("ALTER TABLE `users` MODIFY `name` VARCHAR(120) NULL");
                } catch (\Throwable $e2) {
                    // dejamos como está
                }
            }
        }
    }

    public function down(): void
    {
        // quitar FK y columna si existen
        if (Schema::hasColumn('users', 'role_id')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['role_id']);
                });
            } catch (\Throwable $e) {}

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role_id');
            });
        }
    }
};
