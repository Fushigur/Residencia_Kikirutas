<!-- src/views/operator/OperatorLayout.vue -->
<template>
  <section class="container mx-auto max-w-7xl px-4 py-6 space-y-6">
    <!-- Header con color y acentos -->
    <div
      class="relative rounded-2xl border border-white/10 bg-gradient-to-br from-brand/10 via-maiz/5 backdrop-blur px-4 py-4 shadow-lg"
    >
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-semibold text-crema">
            Panel del operador
          </h1>
          <p class="text-xs md:text-sm text-crema/70 mt-0.5">
            Gestiona tus rutas y pedidos del día.
          </p>
        </div>

<nav class="flex items-center gap-2">
  <RouterLink
    :to="{ name: 'op.hoy' }"
    class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm
           bg-maiz text-gray-900 ring-1 ring-maiz
           hover:bg-amber-400 hover:ring-amber-400"
  >
    Rutas de hoy
  </RouterLink>

  <!-- Botón Salir (chile) -->
  <button
    type="button"
    @click="handleLogout"
    class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm
           bg-red-500 text-white ring-1 ring-red-500
           hover:bg-red-600 hover:ring-red-600"
  >
    Salir
  </button>
</nav>
      </div>

      <!-- Línea de acento inferior -->
      <div
        class="pointer-events-none absolute inset-x-3 -bottom-px h-px
               bg-gradient-to-r from-transparent via-maiz/50"
      />
    </div>

    <!-- Contenido -->
    <RouterView />
  </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  auth.logout()
  router.push({ name: 'login' }).catch(() => router.push('/login'))
}
</script>
