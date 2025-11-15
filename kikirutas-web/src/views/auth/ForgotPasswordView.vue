<template>
  <section class="min-h-screen grid place-items-center px-4">
    <form class="w-full max-w-md space-y-4 bg-white/5 p-6 rounded-xl border border-white/10"
          @submit.prevent="onSubmit">
      <h1 class="text-xl font-semibold text-crema">Recuperar contraseña</h1>

      <label class="grid gap-1">
        <span class="text-sm text-crema/80">Correo</span>
        <input v-model.trim="email" type="email" required
               class="rounded-md bg-black/30 border border-white/20 px-3 py-2 text-crema outline-none">
      </label>

      <button :disabled="loading" class="rounded bg-maiz px-3 py-2 disabled:opacity-50">
        {{ loading ? 'Enviando…' : 'Enviar enlace' }}
      </button>

      <p v-if="msg" class="text-sm text-emerald-300">{{ msg }}</p>
      <p v-if="err" class="text-sm text-rose-300">{{ err }}</p>

      <RouterLink :to="{ name: 'login' }" class="text-sm text-maiz underline">Volver a ingresar</RouterLink>
    </form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api'

const email = ref('')
const loading = ref(false)
const msg = ref('')
const err = ref('')

async function onSubmit() {
  loading.value = true; msg.value=''; err.value=''
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    msg.value = 'Te enviamos un enlace para restablecer tu contraseña.'
  } catch (e: any) {
    err.value = e?.response?.data?.message || e?.message || 'No se pudo enviar el correo'
  } finally {
    loading.value = false
  }
}
</script>
