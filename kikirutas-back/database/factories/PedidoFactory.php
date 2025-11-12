<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PedidoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'producto' => $this->faker->randomElement(['Alimento A-20 kg','Alimento B-40 kg','Maíz 50 kg']),
            'cantidad' => $this->faker->numberBetween(1,8),
            'estado'   => 'pendiente',
            'fecha'    => now(),
            'solicitante_nombre'     => $this->faker->name(),
            'solicitante_comunidad'  => $this->faker->randomElement(['Kancabchén','Dziuché','Sacalaca']),
            'telefono' => $this->faker->numerify('983########'),
            'notas'    => $this->faker->sentence(),
        ];
    }
}
