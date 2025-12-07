<template>
  <div class="min-h-screen flex bg-app text-neutral-100">
    <!-- Sidebar (solo desktop) -->
    <aside class="hidden md:block w-[320px] p-4">
      <div class="menu-panel relative overflow-hidden sticky top-4">
        <div class="absolute inset-0 bg-kikiba opacity-25 pointer-events-none"></div>

        <div class="relative z-10">
          <!-- Marca -->
          <div class="flex items-center gap-3 p-4 border-b border-white/10">
            <img :src="logoUrl" alt="KikiRutas" class="h-12 w-12 rounded-full bg-white/10 p-1" />
            <div class="leading-tight">
              <p class="font-semibold">KikiRutas</p>
              <p class="text-xs text-white/60">Plataforma</p>
            </div>
          </div>

          <!-- Navegación -->
          <nav class="p-3 space-y-1 text-sm">
            <RouterLink :to="{ name: 'u.inicio' }" class="link" :class="{ active: isActive('/usuario/inicio') }">
              <svg viewBox="0 0 24 24" class="icon">
                <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" />
              </svg>
              Inicio
            </RouterLink>

            <RouterLink :to="{ name: 'u.pedido.nuevo' }" class="link"
              :class="{ active: isActive('/usuario/pedido/nuevo') }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                stroke-linejoin="round" class="icon text-white">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              Nuevo pedido
            </RouterLink>

            <RouterLink :to="{ name: 'u.historial' }" class="link" :class="{ active: isActive('/usuario/historial') }">
              <svg viewBox="0 0 24 24" class="icon">
                <path d="M12 8v5l3 3M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9z" />
              </svg>
              Historial
            </RouterLink>

            <RouterLink :to="{ name: 'u.inventario' }" class="link" :class="{ active: isActive('/usuario/granja') }">
              <svg viewBox="0 0 24 24" class="icon">
                <path d="M3 12l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
              </svg>
              Mi granja
            </RouterLink>

            <RouterLink :to="{ name: 'u.alertas' }" class="link" :class="{ active: isActive('/usuario/alertas') }">
              <svg viewBox="0 0 24 24" class="icon">
                <path d="M12 19a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2zm6-6V9a6 6 0 1 0-12 0v4L4 17h16l-2-4z" />
              </svg>
              Alertas
            </RouterLink>

            <RouterLink :to="{ name: 'u.perfil' }" class="link" :class="{ active: isActive('/usuario/perfil') }">
              <svg viewBox="0 0 24 24" class="icon">
                <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z" />
              </svg>
              Perfil
            </RouterLink>
          </nav>

          <div class="p-3 pt-0">
            <button class="btn-danger w-full" @click="onLogout">Salir</button>
          </div>
        </div>
      </div>
    </aside>

    <!-- Contenido -->
    <div class="flex-1 min-w-0">
      <!-- Topbar móvil -->
      <header class="md:hidden sticky top-0 z-10 bg-panel/95 backdrop-blur border-b border-white/10">
        <div class="px-4 py-3 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img :src="logoUrl" alt="KikiRutas" class="h-12 w-12 rounded-full bg-white/10 p-1" />
            <span class="font-semibold">KikiRutas</span>
          </div>
          <button class="btn-danger" @click="onLogout">Salir</button>
        </div>
      </header>

      <main class="p-4 pb-24 md:pb-8 md:p-8">
        <div class="page-panel">
          <RouterView />
        </div>
      </main>

      <!-- Bottom Tabs (solo móvil) -->
      <nav class="bottom-nav md:hidden grid grid-cols-5">
        <RouterLink :to="{ name: 'u.inicio' }" class="tab" :class="{ active: isActive('/usuario/inicio') }">
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9z" />
          </svg>
          <span class="tab-label">Inicio</span>
        </RouterLink>

        <RouterLink :to="{ name: 'u.pedido.nuevo' }" class="tab" :class="{ active: isActive('/usuario/pedido/nuevo') }">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
            stroke-linejoin="round" class="icon text-white">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span class="tab-label">Pedido</span>
        </RouterLink>

        <RouterLink :to="{ name: 'u.historial' }" class="tab" :class="{ active: isActive('/usuario/historial') }">
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M12 8v5l3 3M3 12a9 9 0 1 0 9-9 9 9 0 0 0-9 9z" />
          </svg>
          <span class="tab-label">Historial</span>
        </RouterLink>

        <RouterLink :to="{ name: 'u.inventario' }" class="tab" :class="{ active: isActive('/usuario/granja') }">
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M3 12l9-7 9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
          </svg>
          <span class="tab-label">Granja</span>
        </RouterLink>

        <RouterLink :to="{ name: 'u.perfil' }" class="tab" :class="{ active: isActive('/usuario/perfil') }">
          <svg viewBox="0 0 24 24" class="icon">
            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-5 0-9 2.5-9 5v1h18v-1c0-2.5-4-5-9-5z" />
          </svg>
          <span class="tab-label">Perfil</span>
        </RouterLink>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logoUrl from '@/assets/img/Logo.png'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isActive = (prefix: string) => route.path.startsWith(prefix)

const onLogout = () => {
  auth.logout()
  router.push({ name: 'login' })
}
</script>

<style scoped>
:root {
  --brand: #22A788;
  --panel: #121212;
  --appBg: #0B0B0B;
}

/* Fondo general */
.bg-app {
  background:
    radial-gradient(1200px 200px at 50% -80px, rgba(34, 167, 136, .15), transparent 60%),
    var(--appBg);
}

/* Panel del contenido (recuadro negro) */
.page-panel {
  background: rgba(18, 18, 18, .92);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .45);
  backdrop-filter: blur(6px);
  padding: 1rem;
}

@media (min-width: 768px) {
  .page-panel {
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .page-panel {
    max-width: 1100px;
    margin: 0 auto;
  }
}

/* Panel del menú lateral (desktop) */
.menu-panel {
  background: rgba(18, 18, 18, .92);
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 1.25rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, .45);
  backdrop-filter: blur(6px);
}

/* Links del menú (desktop) */
.link {
  display: flex;
  align-items: center;
  gap: .65rem;
  padding: .65rem .8rem;
  border-radius: .75rem;
  color: #d6e6df;
  text-decoration: none;
}

.link:hover {
  background: rgba(34, 167, 136, .10);
  color: #fff;
}

.link.active {
  background: rgba(34, 167, 136, .18);
  color: #fff;
}

/* Iconos */
.icon {
  width: 20px;
  height: 20px;
  fill: currentColor;
}

/* Botón salir */
.btn-danger {
  background: #e5484d;
  color: white;
  font-weight: 600;
  padding: .55rem .9rem;
  border-radius: .7rem;
}

.btn-danger:hover {
  filter: brightness(1.1);
}

/* Utilidad */
.bg-panel {
  background: var(--panel);
}

/* --- Móvil: bottom tabs --- */
.bottom-nav {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  background: rgba(18, 18, 18, .96);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(255, 255, 255, .08);
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 4px);
}

/* Salvaguarda extra: nunca mostrar en >= md si alguna regla lo sobrescribe */
@media (min-width:768px) {
  .bottom-nav {
    display: none !important;
  }
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .15rem;
  padding: .5rem 0 .6rem;
  color: #d6e6df;
  text-decoration: none;
  font-size: 11px;
}

.tab .icon {
  width: 22px;
  height: 22px;
}

.tab.active {
  color: #fff;
}

.tab:active {
  filter: brightness(1.2);
}

.tab-label {
  line-height: 1;
}
</style>
