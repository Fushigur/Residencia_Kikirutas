<template>
  <div class="min-h-screen bg-neutral-950 text-gray-100">
    <!-- HEADER (sticky en móvil) -->
    <header class="sticky top-0 z-10 border-b border-white/10 backdrop-blur md:static">
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

        <!-- Nav desktop -->
        <nav class="ml-auto hidden md:flex items-center gap-2">
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

        <!-- Botón salir móvil -->
        <button class="md:hidden btn-danger ml-auto" @click="logout">Salir</button>
      </div>
    </header>

    <!-- CONTENT -->
    <main class="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-10">
      <router-view />
    </main>

    <!-- Bottom Tabs (solo móvil) -->
    <nav class="bottom-nav md:hidden grid grid-cols-6">
      <RouterLink :to="{ name: 'a.resumen' }" class="tab" :class="{ active: isActive('a.resumen') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z"/></svg>
        <span class="tab-label">Resumen</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.pedidos' }" class="tab" :class="{ active: isActive('a.pedidos') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        <span class="tab-label">Pedidos</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.rutas' }" class="tab" :class="{ active: isActive('a.rutas') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M4 17l6-6 4 4 6-6"/><circle cx="4" cy="17" r="2"/><circle cx="10" cy="11" r="2"/><circle cx="14" cy="15" r="2"/><circle cx="20" cy="9" r="2"/></svg>
        <span class="tab-label">Rutas</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.usuarios' }" class="tab" :class="{ active: isActive('a.usuarios') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z"/></svg>
        <span class="tab-label">Usuarios</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.productos' }" class="tab" :class="{ active: isActive('a.productos') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M3 7l9-4 9 4-9 4-9-4zm0 6l9 4 9-4M3 7v10l9 4 9-4V7"/></svg>
        <span class="tab-label">Productos</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.reportes' }" class="tab" :class="{ active: isActive('a.reportes') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M3 3h3v18H3zM9 9h3v12H9zM15 5h3v16h-3zM21 13h3v8h-3z" transform="translate(-3)"/></svg>
        <span class="tab-label">Reportes</span>
      </RouterLink>
    </nav>
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
.btn-ghost:hover { background: rgba(255, 255, 255, .12); }
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
.btn-danger:hover { background: #ef4444; /* red-500 */ }

/* Logo con leve realce para que siempre “se vea” */
.logo { filter: drop-shadow(0 0 12px rgba(255, 255, 255, .12)); }

/* --- Móvil: bottom tabs --- */
.bottom-nav{
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 20;
  background: rgba(18,18,18,.96);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255,255,255,.08);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 4px);
}
@media (min-width:768px){
  .bottom-nav{ display: none !important; }
}
.tab{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:.15rem; padding:.45rem 0 .55rem;
  color:#d6e6df; text-decoration:none; font-size:11px;
}
.tab .icon{ width:22px; height:22px; fill: currentColor; }
.tab.active{ color:#fff; }
.tab:active{ filter:brightness(1.15); }
.tab-label{ line-height:1; }
</style>
