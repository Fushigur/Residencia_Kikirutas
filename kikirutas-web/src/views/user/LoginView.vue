<template>
  <!-- Contenedor a pantalla completa y centrado -->
  <section class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-xl rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 shadow-lg">
      <h1 class="text-2xl font-bold text-crema">Ingresar</h1>
      <p class="text-sm text-crema/70 mt-1">
        Acceso para navegar por las vistas de KikiRutas.
      </p>

      <form class="mt-6 grid gap-4" @submit.prevent>
        <label class="grid gap-1">
          <span class="text-sm text-crema/80">Correo</span>
          <input
            class="rounded-md bg-black/30 border border-brand/40 px-3 py-2 text-crema outline-none focus:border-maiz"
            type="email"
            autocomplete="email"
          />
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-crema/80">Contraseña</span>
          <input
            class="rounded-md bg-black/30 border border-brand/40 px-3 py-2 text-crema outline-none focus:border-maiz"
            type="password"
            autocomplete="current-password"
          />
        </label>

        <div class="flex flex-wrap items-center gap-3 mt-2">
          <button type="button" class="btn-maiz"  @click="loginAs('user')">Entrar como Usuaria</button>
          <button type="button" class="btn-chile" @click="loginAs('admin')">Entrar como Admin</button>

          <!-- Botón operador -->
          <div class="mt-4 flex w-full">
            <button
              type="button"
              @click="goToOperator"
              class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-4 text-sm font-medium text-white hover:bg-blue-500 transition shadow-md"
            >
              Ingresar como operador
            </button>
          </div>
        </div>

        <div class="mt-4 text-sm">
          <span class="text-crema/80">¿No tienes cuenta?</span>
          <RouterLink class="link-brand ml-2" :to="{ name: 'register' }">Crear cuenta</RouterLink>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function loginAs(role: 'user' | 'admin') {
  auth.loginAs(role)
  router.push(role === 'user' ? { name: 'u.inicio' } : { name: 'a.resumen' })
}

const goToOperator = () => {
  if (auth.isAuth && (auth.role === 'admin' || auth.role === 'operator')) {
    router.push({ name: 'op.hoy' })
    return
  }
  if (typeof (auth as any).loginAs === 'function') {
    (auth as any).loginAs('operator')
  } else {
    ;(auth as any).role = 'operator'
    ;(auth as any).isAuth = true
  }
  router.push({ name: 'op.hoy' })
}
</script>
