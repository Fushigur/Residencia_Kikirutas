<!-- src/layouts/AdminLayout.vue -->
<template>
  <div class="min-h-screen bg-neutral-950 text-gray-100">
    <!-- HEADER -->
    <header class="border-b border-white/10">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <!-- Logo -->
        <router-link :to="{ name: 'a.resumen' }" class="flex items-center gap-3">
          <img
            src="@/assets/img/Logo.png"
            alt="KikiRutas — Administración"
            class="h-12 rounded-full bg-white/10 p-1 logo"
          />
          <span class="hidden sm:inline text-sm text-white/70">Administración</span>
        </router-link>

        <!-- Nav (botones ghost como los de abajo) -->
        <nav class="ml-auto flex items-center gap-2">
          <router-link
            :to="{ name: 'a.resumen' }"
            class="btn-ghost"
            :class="{ active: isActive('a.resumen') }"
          >Resumen</router-link>

          <router-link
            :to="{ name: 'a.pedidos' }"
            class="btn-ghost"
            :class="{ active: isActive('a.pedidos') }"
          >Pedidos</router-link>

          <router-link
            :to="{ name: 'a.rutas' }"
            class="btn-ghost"
            :class="{ active: isActive('a.rutas') }"
          >Rutas</router-link>

          <router-link
            :to="{ name: 'a.usuarios' }"
            class="btn-ghost"
            :class="{ active: isActive('a.usuarios') }"
          >Usuarios</router-link>

          <router-link
            :to="{ name: 'a.productos' }"
            class="btn-ghost"
            :class="{ active: isActive('a.productos') }"
          >Productos</router-link>

          <router-link
            :to="{ name: 'a.reportes' }"
            class="btn-ghost"
            :class="{ active: isActive('a.reportes') }"
          >Reportes</router-link>

          <button class="btn-danger ml-2" @click="logout">Salir</button>
        </nav>
      </div>
    </header>

    <!-- CONTENT -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isActive = (name: string) => route.name === name

function logout() {
  try { auth.logout?.() } catch {}
  router.replace({ name: 'login' })
}
</script>

<style scoped>
/* Botón ghost (igual que en el panel) */
.btn-ghost {
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .12);
  padding: .5rem .8rem;
  border-radius: .6rem;
  font-size: .9rem;
  line-height: 1;
  transition: background .15s ease, border-color .15s ease, color .15s ease;
}
.btn-ghost:hover {
  background: rgba(255, 255, 255, .12);
}
.btn-ghost.active {
  background: #16a34a; /* emerald-600 */
  border-color: rgba(34, 197, 94, .5);
  color: #071a10;
}

/* Salir */
.btn-danger {
  background: #dc2626; /* red-600 */
  border-radius: .6rem;
  padding: .5rem .9rem;
  transition: background .15s ease;
}
.btn-danger:hover {
  background: #ef4444; /* red-500 */
}

/* Logo con leve realce para que siempre “se vea” */
.logo {
  filter: drop-shadow(0 0 12px rgba(255, 255, 255, .12));
}
</style>
