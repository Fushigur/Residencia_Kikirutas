<template>
  <div class="p-6 max-w-6xl mx-auto">
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold">KikiRutas — Admin</h1>
      <nav class="flex gap-4">
        <RouterLink :to="{ name:'a.resumen' }">Resumen</RouterLink>
        <RouterLink :to="{ name:'a.pedidos' }">Pedidos</RouterLink>
        <RouterLink :to="{ name:'a.rutas' }">Rutas</RouterLink>
        <RouterLink :to="{ name:'a.usuarias' }">Usuarias</RouterLink>
        <RouterLink :to="{ name:'a.productos' }">Productos</RouterLink>
        <RouterLink :to="{ name:'a.reportes' }">Reportes</RouterLink>
      </nav>
    </header>
    <RouterView />
  </div>
</template>
<script setup lang="ts"></script>
