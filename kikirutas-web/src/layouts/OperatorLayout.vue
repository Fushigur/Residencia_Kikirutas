<template>
  <div class="min-h-screen bg-crema text-gray-800 font-sans">
    <!-- Header (sticky en móvil) -->
    <header class="sticky top-0 z-20 md:static">
      <div class="mx-auto max-w-7xl px-4 pt-4">
        <!-- Card Blanca Flotante Header -->
        <div class="relative rounded-2xl bg-surface border border-gray-100 shadow-card px-5 py-4 flex items-center justify-between">
          
          <div class="flex items-center gap-4">
             <div class="bg-maiz/10 p-2 rounded-xl">
               <!-- Icono o Logo -->
               <svg class="w-8 h-8 text-maiz" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
             </div>
             <div>
                <h1 class="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Panel del Operador</h1>
                <p class="text-xs md:text-sm text-gray-500 font-medium">Gestiona tus entregas del día</p>
             </div>
          </div>

          <!-- Acciones (desktop) -->
          <nav class="hidden md:flex items-center gap-3">
            <RouterLink :to="{ name: 'op.hoy' }" 
              class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all"
              :class="isActiveName('op.hoy') ? 'bg-maiz text-gray-900 shadow-lg shadow-maiz/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
            >
              Rutas de hoy
            </RouterLink>

            <button type="button" @click="handleLogout"
              class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              Salir
            </button>
          </nav>

          <!-- Botón salir (móvil) -->
          <button type="button" @click="handleLogout" class="md:hidden p-2 text-gray-400 hover:text-red-500">
             <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido -->
    <main class="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-8">
      <RouterView />
    </main>

    <!-- Bottom Tabs (solo móvil) -->
    <nav class="bottom-nav md:hidden">
      <RouterLink :to="{ name: 'op.hoy' }" class="tab" :class="{ active: isActiveName('op.hoy') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z"/></svg>
        <span class="tab-label">Hoy</span>
      </RouterLink>

      <RouterLink v-if="hasRutas" :to="{ name: 'op.rutas' }" class="tab" :class="{ active: isActiveName('op.rutas') }">
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M4 17l6-6 4 4 6-6"/><circle cx="4" cy="17" r="2"/><circle cx="10" cy="11" r="2"/><circle cx="14" cy="15" r="2"/><circle cx="20" cy="9" r="2"/>
        </svg>
        <span class="tab-label">Rutas</span>
      </RouterLink>

      <RouterLink v-if="hasMapa" :to="{ name: 'op.mapa' }" class="tab" :class="{ active: isActiveName('op.mapa') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15"/></svg>
        <span class="tab-label">Mapa</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const handleLogout = () => {
  auth.logout()
  router.push({ name: 'login' }).catch(() => router.push('/login'))
}

const isActiveName = (name: string) => route.name === name

const hasRutas = computed(() => router.hasRoute('op.rutas'))
const hasMapa  = computed(() => router.hasRoute('op.mapa'))
</script>

<style scoped>
/* Bottom Mobile Tabs (Light) */
.bottom-nav {
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-top: 1px solid #E5E7EB;
  padding: 0.5rem 0 calc(env(safe-area-inset-bottom, 0px) + 4px);
  display: flex;
  justify-content: space-around;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
}

@media (min-width:768px){
  .bottom-nav{ display: none !important; }
}

.tab {
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: .25rem; padding: .4rem .5rem;
  color: #9CA3AF; text-decoration:none; font-size: 11px; font-weight: 500;
  transition: all 0.2s;
}
.tab .icon{ width:22px; height:22px; fill: currentColor; }
.tab.active{ color: #F59E0B; /* Maiz/Amber for Operators */ }
.tab:active{ transform: scale(0.95); }
.tab-label{ line-height:1; }
</style>
