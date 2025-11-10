<template>
  <div class="min-h-[60vh] grid place-items-center">
    <div class="text-center">
      <h2 class="text-2xl font-semibold mb-2">404</h2>
      <p class="text-gray-400 mb-4">Página no encontrada.</p>
      <RouterLink :to="{ name:'login' }" class="rounded bg-slate-700 px-4 py-2 hover:bg-slate-600">Ir al login</RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
