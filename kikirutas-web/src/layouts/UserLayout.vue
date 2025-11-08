<template>
  <div class="p-6 max-w-5xl mx-auto">
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">KikiRutas — Usuaria</h1>
      <nav class="flex gap-4">
        <RouterLink :to="{ name:'u.inicio' }">Inicio</RouterLink>
        <RouterLink :to="{ name:'u.pedido.nuevo' }">Nuevo pedido</RouterLink>
        <RouterLink :to="{ name:'u.historial' }">Historial</RouterLink>
        <RouterLink :to="{ name:'u.alertas' }">Alertas</RouterLink>
        <RouterLink :to="{ name:'u.perfil' }">Perfil</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
<script setup lang="ts"></script>
