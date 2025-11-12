<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1) Asegurar tabla roles y sembrar base (admin, operador, usuaria)
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('nombre')->unique();
                $table->timestamps();
            });
        }

        $now = now();
        foreach ([
            ['id' => 1, 'nombre' => 'admin'],
            ['id' => 2, 'nombre' => 'operador'],
            ['id' => 3, 'nombre' => 'usuaria'],
        ] as $r) {
            DB::table('roles')->updateOrInsert(
                ['id' => $r['id']],
                ['nombre' => $r['nombre'], 'created_at' => $now, 'updated_at' => $now]
            );
        }

        // 2) Agregar columna role_id solo si no existe
        if (!Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->foreignId('role_id')->default(1)->after('id');
            });
        }

        // 3) Crear FK (ignora si ya existe)
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('role_id')
                    ->references('id')->on('roles')
                    ->cascadeOnUpdate()
                    ->restrictOnDelete();
            });
        } catch (\Throwable $e) {
            // La FK ya existe; continuar.
        }

        // 4) name -> nullable y tamaño 120 (con fallback si no tienes doctrine/dbal)
        if (Schema::hasColumn('users', 'name')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->string('name', 120)->nullable()->change();
                });
            } catch (\Throwable $e) {
                // Fallback SQL crudo (MySQL)
                try {
                    DB::statement("ALTER TABLE `users` MODIFY `name` VARCHAR(120) NULL");
                } catch (\Throwable $e2) {
                    // Si falla, lo dejamos como esté.
                }
            }
        }

        // 5) Asegurar email único (ignora si ya hay índice)
        try {
            DB::statement('ALTER TABLE `users` ADD UNIQUE `users_email_unique` (`email`)');
        } catch (\Throwable $e) {
            // Índice ya existe; continuar.
        }
    }

    public function down(): void
    {
        // Quitar FK y columna si existen
        if (Schema::hasColumn('users', 'role_id')) {
            try {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['role_id']);
                });
            } catch (\Throwable $e) {
                // Si no existe la FK, continuar.
            }

            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('role_id');
            });
        }

        // No eliminamos la tabla roles para no perder datos semilla.
    }
};
