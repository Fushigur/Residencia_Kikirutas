<template>
  <div class="min-h-screen bg-app text-neutral-100">
    <!-- Header (sticky en móvil) -->
    <header class="sticky top-0 z-10 md:static">
      <div class="mx-auto max-w-7xl px-4 pt-4">
        <div
          class="relative rounded-2xl border border-white/10 bg-gradient-to-br from-brand/10 via-maiz/5 backdrop-blur px-4 py-4 shadow-lg"
        >
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl md:text-3xl font-semibold text-crema">Panel del operador</h1>
              <p class="text-xs md:text-sm text-crema/70 mt-0.5">
                Gestiona tus rutas y pedidos del día.
              </p>
            </div>

            <!-- Acciones (desktop) -->
            <nav class="hidden md:flex items-center gap-2">
              <RouterLink
                :to="{ name: 'op.hoy' }"
                class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm
                       bg-maiz text-gray-900 ring-1 ring-maiz
                       hover:bg-amber-400 hover:ring-amber-400"
              >
                Rutas de hoy
              </RouterLink>

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

            <!-- Botón salir (móvil) -->
            <button
              type="button"
              @click="handleLogout"
              class="md:hidden inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm
                     bg-red-500 text-white ring-1 ring-red-500
                     hover:bg-red-600 hover:ring-red-600"
            >
              Salir
            </button>
          </div>

          <!-- Línea de acento inferior -->
          <div
            class="pointer-events-none absolute inset-x-3 -bottom-px h-px
                   bg-gradient-to-r from-transparent via-maiz/50"
          />
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
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z"/>
        </svg>
        <span class="tab-label">Hoy</span>
      </RouterLink>

      <!-- Se muestran solo si existen en el router -->
      <RouterLink
        v-if="hasRutas"
        :to="{ name: 'op.rutas' }"
        class="tab"
        :class="{ active: isActiveName('op.rutas') }"
      >
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M4 17l6-6 4 4 6-6"/>
          <circle cx="4" cy="17" r="2"/>
          <circle cx="10" cy="11" r="2"/>
          <circle cx="14" cy="15" r="2"/>
          <circle cx="20" cy="9" r="2"/>
        </svg>
        <span class="tab-label">Rutas</span>
      </RouterLink>

      <RouterLink
        v-if="hasMapa"
        :to="{ name: 'op.mapa' }"
        class="tab"
        :class="{ active: isActiveName('op.mapa') }"
      >
        <svg viewBox="0 0 24 24" class="icon">
          <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zM9 3v15M15 6v15"/>
        </svg>
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

// Mostrar tabs extra solo si existen esas rutas en la app
const hasRutas = computed(() => router.hasRoute('op.rutas'))
const hasMapa  = computed(() => router.hasRoute('op.mapa'))
</script>

<style scoped>
/* Reutilizamos la estética del layout de usuaria */
:root{
  --panel:#121212;
  --appBg:#0B0B0B;
}

/* Fondo general */
.bg-app{
  background:
    radial-gradient(1200px 200px at 50% -80px, rgba(34,167,136,.15), transparent 60%),
    var(--appBg);
}

/* --- Móvil: bottom tabs --- */
.bottom-nav{
  position: fixed;
  left: 0; right: 0; bottom: 0;
  z-index: 20;
  background: rgba(18,18,18,.96);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255,255,255,.08);
  padding: .25rem 0 calc(env(safe-area-inset-bottom, 0px) + 4px);
  display: flex;
  justify-content: space-around;
}
@media (min-width:768px){
  .bottom-nav{ display: none !important; }
}

.tab{
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap: .15rem; padding: .4rem .5rem;
  color: #d6e6df; text-decoration:none; font-size: 11px;
}
.tab .icon{ width:22px; height:22px; fill: currentColor; }
.tab.active{ color:#fff; }
.tab:active{ filter:brightness(1.15); }
.tab-label{ line-height:1; }
</style>
