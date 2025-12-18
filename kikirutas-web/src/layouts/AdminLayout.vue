<template>
  <div class="min-h-screen bg-crema text-gray-800 font-sans">
    <!-- HEADER -->
    <header class="sticky top-0 z-20 bg-surface/90 backdrop-blur border-b border-gray-200 shadow-sm lg:static">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <!-- Logo -->
        <router-link :to="{ name: 'a.resumen' }" class="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div class="bg-brand/5 p-1.5 rounded-full">
            <img src="@/assets/img/Logo_letras.png" alt="KikiRutas" class="h-10 w-10 object-contain logo" />
          </div>
          <div class="leading-tight hidden sm:block">
            <p class="font-bold text-gray-900">KikiRutas</p>
            <p class="text-xs text-humo font-medium uppercase tracking-wider">Administración</p>
          </div>
        </router-link>

        <!-- Nav desktop -->
        <nav
          class="ml-auto hidden lg:flex items-center gap-1.5 bg-gray-100/50 p-1.5 rounded-xl border border-gray-200/50">
          <router-link :to="{ name: 'a.resumen' }" class="nav-item"
            :class="{ active: isActive('a.resumen') }">Resumen</router-link>
          <router-link :to="{ name: 'a.pedidos' }" class="nav-item"
            :class="{ active: isActive('a.pedidos') }">Pedidos</router-link>
          <router-link :to="{ name: 'a.rutas' }" class="nav-item"
            :class="{ active: isActive('a.rutas') }">Rutas</router-link>
          <router-link :to="{ name: 'a.usuarios' }" class="nav-item"
            :class="{ active: isActive('a.usuarios') }">Usuarios</router-link>
          <router-link :to="{ name: 'a.productos' }" class="nav-item"
            :class="{ active: isActive('a.productos') }">Productos</router-link>
          <router-link :to="{ name: 'a.reportes' }" class="nav-item"
            :class="{ active: isActive('a.reportes') }">Reportes</router-link>
        </nav>

        <button class="flex ml-4 btn-logout" @click="logout">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Salir</span>
        </button>
      </div>
    </header>

    <!-- CONTENT -->
    <main class="max-w-7xl mx-auto px-4 py-8 pb-24 lg:pb-12">
      <router-view />
    </main>

    <!-- Bottom Tabs (solo móvil) - Rediseñado Light -->
    <nav class="bottom-nav lg:hidden grid grid-cols-6">
      <RouterLink :to="{ name: 'a.resumen' }" class="tab" :class="{ active: isActive('a.resumen') }">
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M4 4h7v7H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 13h7v7H4z" />
        </svg>
        <span class="tab-label">Resumen</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.pedidos' }" class="tab" :class="{ active: isActive('a.pedidos') }">
        <svg fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
          class="icon" viewBox="0 0 24 24">
          <path
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <span class="tab-label">Pedidos</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.rutas' }" class="tab" :class="{ active: isActive('a.rutas') }">
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M4 17l6-6 4 4 6-6" />
          <circle cx="4" cy="17" r="2" />
          <circle cx="10" cy="11" r="2" />
          <circle cx="14" cy="15" r="2" />
          <circle cx="20" cy="9" r="2" />
        </svg>
        <span class="tab-label">Rutas</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.usuarios' }" class="tab" :class="{ active: isActive('a.usuarios') }">
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z" />
        </svg>
        <span class="tab-label">Usuarios</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.productos' }" class="tab" :class="{ active: isActive('a.productos') }">
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M3 7l9-4 9 4-9 4-9-4zm0 6l9 4 9-4M3 7v10l9 4 9-4V7" />
        </svg>
        <span class="tab-label">Productos</span>
      </RouterLink>

      <RouterLink :to="{ name: 'a.reportes' }" class="tab" :class="{ active: isActive('a.reportes') }">
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M3 3h3v18H3zM9 9h3v12H9zM15 5h3v16h-3zM21 13h3v8h-3z" transform="translate(-3)" />
        </svg>
        <span class="tab-label">Reportes</span>
      </RouterLink>
    </nav>
    <GlobalAlert />
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GlobalAlert from '@/components/GlobalAlert.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isActive = (name: string) => route.name === name

function logout() {
  try { auth.logout?.() } catch { }
  router.replace({ name: 'login' })
}
</script>

<style scoped>
/* Nav Items */
.nav-item {
  color: #6B7280;
  /* Gray-500 */
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;
  text-decoration: none;
}

.nav-item:hover {
  background-color: #FFFFFF;
  color: #111827;
  /* Gray-900 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.nav-item.active {
  background-color: #FFFFFF;
  color: #7F1D1D;
  /* Brand */
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

/* Logout Button */
.btn-logout {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #EF4444;
  border-radius: 0.5rem;
  transition: all 0.2s;
  background-color: #FEF2F2;
}

.btn-logout:hover {
  background-color: #FEE2E2;
  color: #DC2626;
}

/* Bottom Mobile Tabs (Light) */
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid #E5E7EB;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 4px);
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.5rem 0 0.6rem;
  color: #9CA3AF;
  /* Gray-400 */
  text-decoration: none;
  font-size: 10px;
  font-weight: 500;
  transition: color 0.2s;
}

.tab .icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
  stroke: currentColor;
}

.tab.active {
  color: #7F1D1D;
  /* Brand */
}

.tab:active {
  transform: scale(0.95);
}
</style>
