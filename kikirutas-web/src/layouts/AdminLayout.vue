<template>
  <div class="min-h-screen bg-neutral-950 text-gray-100">
    <header class="border-b border-white/10">
      <div class="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
        <h1 class="text-lg font-semibold">KikiRutas — Administración</h1>
        <nav class="flex items-center gap-4 text-sm">
          <RouterLink class="hover:underline" :to="{ name:'a.resumen' }">Resumen</RouterLink>
          <RouterLink class="hover:underline" :to="{ name:'a.pedidos' }">Pedidos</RouterLink>
          <RouterLink class="hover:underline" :to="{ name:'a.rutas' }">Rutas</RouterLink>
          <RouterLink class="hover:underline" :to="{ name:'a.usuarios' }">Usuarios</RouterLink>
          <RouterLink class="hover:underline" :to="{ name:'a.productos' }">Productos</RouterLink>
          <RouterLink class="hover:underline" :to="{ name:'a.reportes' }">Reportes</RouterLink>
          <button @click="logout" class="ml-2 rounded bg-red-600 px-3 py-1.5 text-sm hover:bg-red-500">
            Salir
          </button>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const router = useRouter()
const auth = useAuthStore()
const logout = () => {
  auth.logout()
  router.push({ name: 'login' })
}
</script>
