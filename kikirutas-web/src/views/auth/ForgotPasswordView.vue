<template>
  <section class="min-h-screen grid place-items-center px-4 bg-gray-50">
    <div
      class="w-full max-w-md bg-white rounded-3xl shadow-card border border-gray-100 p-8 md:p-10 transition-all hover:shadow-xl">

      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center p-3 bg-brand/5 rounded-2xl mb-4">
          <img src="@/assets/img/Logo.png" alt="KikiRutas" class="h-12 w-12 object-contain" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Recuperar contraseña</h1>
        <p class="text-gray-500 text-sm mt-2">
          Te enviaremos un enlace a tu correo para que puedas crear una nueva contraseña.
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="onSubmit">

        <label class="block space-y-1.5">
          <span class="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">Correo Electrónico</span>
          <div class="relative group">
            <input v-model.trim="email" type="email" required
              class="w-full rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-gray-900 outline-none transition-all focus:bg-white focus:border-brand focus:ring-4 focus:ring-brand/5 placeholder-gray-400"
              placeholder="nombre@ejemplo.com">
          </div>
        </label>

        <button :disabled="loading"
          class="w-full rounded-xl bg-brand font-bold text-white px-6 py-3.5 shadow-lg shadow-brand/20 hover:bg-red-900 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="loading" class="flex justify-center items-center gap-2">
            <svg class="animate-spin h-5 w-5 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            Enviando...
          </span>
          <span v-else>Enviar enlace de recuperación</span>
        </button>

        <div v-if="msg"
          class="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm text-center">
          {{ msg }}
        </div>

        <div v-if="err" class="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
          {{ err }}
        </div>

        <div class="text-center pt-2">
          <RouterLink :to="{ name: 'login' }"
            class="text-sm font-semibold text-gray-500 hover:text-brand transition-colors">
            &larr; Volver al inicio de sesión
          </RouterLink>
        </div>

      </form>
    </div>
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
  loading.value = true; msg.value = ''; err.value = ''
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    msg.value = 'Correo enviado. Revisa tu bandeja de entrada.'
  } catch (e: any) {
    err.value = e?.response?.data?.message || 'No se pudo enviar el correo. Verifica que esté registrado.'
  } finally {
    loading.value = false
  }
}
</script>