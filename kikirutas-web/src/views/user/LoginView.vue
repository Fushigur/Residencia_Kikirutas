<template>
  <main class="max-w-xl mx-auto p-6 space-y-4">
    <h2 class="text-3xl font-bold">Ingresar</h2>
    <p class="text-sm opacity-80">Acceso de prueba para navegar por las vistas.</p>

    <div class="flex gap-3">
      <button class="px-4 py-2 rounded bg-emerald-500" @click="go('user')">Entrar como Usuaria</button>
      <button class="px-4 py-2 rounded bg-sky-500" @click="go('admin')">Entrar como Admin</button>
    </div>

    <p class="text-xs opacity-70">
      *Luego conectamos con tu backend real. Por ahora solo marca el rol en el store y redirige.
    </p>
  </main>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function go(role: 'user' | 'admin') {
  auth.loginAs(role)
  router.push(role === 'admin' ? { name: 'a.resumen' } : { name: 'u.inicio' })
}
</script>
