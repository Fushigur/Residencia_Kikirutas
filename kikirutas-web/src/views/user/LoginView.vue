<template>
  <section class="flex justify-center">
    <div class="card w-full max-w-xl p-6">
      <h1 class="text-2xl font-bold text-crema">Ingresar</h1>
      <p class="text-sm text-crema/70 mt-1">
        Acceso para navegar por las vistas de KikiRutas.
      </p>

      <form class="mt-6 grid gap-4" @submit.prevent>
        <label class="grid gap-1">
          <span class="text-sm text-crema/80">Correo</span>
          <input class="rounded-md bg-black/30 border border-brand/40 px-3 py-2 text-crema outline-none focus:border-maiz"
                 type="email" autocomplete="email" />
        </label>

        <label class="grid gap-1">
          <span class="text-sm text-crema/80">Contraseña</span>
          <input class="rounded-md bg-black/30 border border-brand/40 px-3 py-2 text-crema outline-none focus:border-maiz"
                 type="password" autocomplete="current-password" />
        </label>

        <div class="flex flex-wrap items-center gap-3 mt-2">
          <button type="button" class="btn-maiz" @click="loginAs('user')">Entrar como Usuaria</button>
          <button type="button" class="btn-chile" @click="loginAs('admin')">Entrar como Admin</button>
        </div>

        <p class="text-xs text-crema/60 mt-2">
          Luego conectamos con tu backend real. Por ahora marca rol en el store y redirige.
        </p>

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
</script>
