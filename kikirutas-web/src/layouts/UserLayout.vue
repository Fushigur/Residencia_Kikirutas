<template>
  <div class="min-h-screen flex bg-gray-50 text-gray-800 font-sans">
    <!-- Sidebar (solo desktop) -->
    <aside class="hidden md:block w-[280px] p-6 sticky top-0 h-screen overflow-y-auto border-r border-gray-200 bg-white">
      <div class="flex flex-col h-full">
        <!-- Marca -->
        <div class="flex items-center gap-3 mb-8 px-2">
          <div class="bg-brand/5 p-2 rounded-xl">
            <img :src="logoUrl" alt="KikiRutas" class="h-10 w-10 object-contain" />
          </div>
          <div>
            <p class="font-extrabold text-lg text-gray-900 tracking-tight">KikiRutas</p>
            <p class="text-xs text-gray-500 font-medium tracking-wide">Plataforma</p>
          </div>
        </div>

        <!-- Navegación -->
        <nav class="space-y-1 flex-1">
          <RouterLink :to="{ name: 'u.inicio' }" class="nav-link" :class="{ active: isActive('/usuario/inicio') }">
            <svg viewBox="0 0 24 24" class="icon"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" /></svg>
            Inicio
          </RouterLink>

          <RouterLink :to="{ name: 'u.pedido.nuevo' }" class="nav-link" :class="{ active: isActive('/usuario/pedido/nuevo') }">
            <svg fill="none" stroke="currentColor" stroke-width="2" class="icon" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            Nuevo pedido
          </RouterLink>

          <RouterLink :to="{ name: 'u.historial' }" class="nav-link" :class="{ active: isActive('/usuario/historial') }">
            <svg viewBox="0 0 24 24" class="icon"><path d="M12 8v5l3 3M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9z" /></svg>
            Historial
          </RouterLink>

          <RouterLink :to="{ name: 'u.inventario' }" class="nav-link" :class="{ active: isActive('/usuario/granja') }">
            <svg viewBox="0 0 24 24" class="icon"><path d="M3 12l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
            Mi granja
          </RouterLink>

          <RouterLink :to="{ name: 'u.alertas' }" class="nav-link" :class="{ active: isActive('/usuario/alertas') }">
            <svg viewBox="0 0 24 24" class="icon"><path d="M12 19a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V9a6 6 0 1 0-12 0v4L4 17h16l-2-4z" /></svg>
            Alertas
            <span v-if="alertasStore.noLeidasCount > 0" class="ml-auto bg-chile text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">{{ alertasStore.noLeidasCount }}</span>
          </RouterLink>

          <RouterLink :to="{ name: 'u.perfil' }" class="nav-link" :class="{ active: isActive('/usuario/perfil') }">
            <svg viewBox="0 0 24 24" class="icon"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z" /></svg>
            Perfil
          </RouterLink>
        </nav>

        <div class="mt-8 pt-4 border-t border-gray-100">
          <button class="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-semibold py-3 rounded-xl hover:bg-red-100 transition-colors" @click="onLogout">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>

    <!-- Contenido -->
    <div class="flex-1 min-w-0 flex flex-col">
      <!-- Topbar móvil -->
      <header class="md:hidden sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 shadow-sm">
        <div class="px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img :src="logoUrl" alt="KikiRutas" class="h-9 w-9" />
            <span class="font-bold text-gray-900">KikiRutas</span>
          </div>

          <div class="flex items-center gap-4">
            <RouterLink :to="{ name: 'u.alertas' }" class="relative text-gray-500 hover:text-brand transition-colors">
              <svg viewBox="0 0 24 24" class="w-6 h-6 fill-current"><path d="M12 19a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V9a6 6 0 1 0-12 0v4L4 17h16l-2-4z" /></svg>
              <span v-if="alertasStore.noLeidasCount > 0" class="absolute -top-1 -right-1 bg-chile w-2.5 h-2.5 rounded-full border-2 border-white"></span>
            </RouterLink>

            <button class="text-sm font-semibold text-red-500" @click="onLogout">Salir</button>
          </div>
        </div>
      </header>

      <main class="flex-1 p-4 pb-24 md:pb-8 md:p-8 overflow-y-auto">
        <div class="max-w-5xl mx-auto">
          <RouterView />
        </div>
      </main>
    </div>

    <!-- Bottom Tabs (solo móvil) -->
    <nav class="bottom-nav md:hidden grid grid-cols-5">
      <RouterLink :to="{ name: 'u.inicio' }" class="tab" :class="{ active: isActive('/usuario/inicio') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" /></svg>
        <span class="tab-label">Inicio</span>
      </RouterLink>

      <RouterLink :to="{ name: 'u.pedido.nuevo' }" class="tab" :class="{ active: isActive('/usuario/pedido/nuevo') }">
        <svg fill="none" stroke="currentColor" stroke-width="2" class="icon" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <span class="tab-label">Pedido</span>
      </RouterLink>

      <RouterLink :to="{ name: 'u.historial' }" class="tab" :class="{ active: isActive('/usuario/historial') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M12 8v5l3 3M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9z" /></svg>
        <span class="tab-label">Historial</span>
      </RouterLink>

      <RouterLink :to="{ name: 'u.inventario' }" class="tab" :class="{ active: isActive('/usuario/granja') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M3 12l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
        <span class="tab-label">Granja</span>
      </RouterLink>

      <RouterLink :to="{ name: 'u.perfil' }" class="tab" :class="{ active: isActive('/usuario/perfil') }">
        <svg viewBox="0 0 24 24" class="icon"><path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z" /></svg>
        <span class="tab-label">Perfil</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logoUrl from '@/assets/img/Logo.png'
import { useAlertasStore } from '@/stores/alertas'
import { onMounted } from 'vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const alertasStore = useAlertasStore()

onMounted(() => {
  alertasStore.load()
})

const isActive = (prefix: string) => route.path.startsWith(prefix)

const onLogout = () => {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
/* Sidebar Links */
.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  color: #6B7280; /* Gray-500 */
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease;
  margin-bottom: 0.25rem;
}

.nav-link:hover {
  background-color: #F9FAFB;
  color: #111827;
}

.nav-link.active {
  background-color: #FEF2F2; /* Brand-50 */
  color: #7F1D1D; /* Brand-900 */
  font-weight: 600;
}

.nav-link .icon {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

/* Mobile Bottom Nav */
.bottom-nav {
  position: fixed;
  left: 0; right: 0; bottom: 0;
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
  text-decoration: none;
  font-size: 10px;
  font-weight: 500;
  transition: color 0.2s;
}

.tab .icon {
  width: 22px;
  height: 22px;
  fill: currentColor;
}

.tab.active {
  color: #7F1D1D;
}
</style>
