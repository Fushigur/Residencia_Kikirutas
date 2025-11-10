<template>
  <div class="p-6">
    <header class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold">Panel del operador</h1>

      <nav class="flex gap-2">
        <RouterLink
          :to="{ name: 'op.hoy' }"
          class="rounded bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
        >
          Rutas de hoy
        </RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>

<script setup lang="ts">
// No poner aquí botones/título del mapa.
// Eso vive en RouteMapView.vue
</script>
