<template>
  <section class="min-h-screen grid place-items-center px-4">
    
    <div class="w-full max-w-md bg-white/5 border border-white/10 rounded-xl p-8 shadow-2xl backdrop-blur-sm">
      
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-maiz/10 border border-maiz/20 mb-4">
          <svg class="w-8 h-8 text-maiz" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-xl font-semibold text-crema">Recuperar contraseña</h1>
        <p class="text-crema/70 text-sm mt-2">
          Ingresa tu correo para recibir el enlace de recuperación.
        </p>
      </div>

      <form class="space-y-6" @submit.prevent="onSubmit">
        
        <div class="space-y-2">
          <label class="block text-xs font-medium text-crema/80 uppercase tracking-wide ml-1">Correo</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-5 w-5 text-crema/40 group-focus-within:text-maiz transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input 
              v-model.trim="email" 
              type="email" 
              required
              class="w-full rounded-md bg-black/30 border border-white/20 px-3 py-3 pl-10 text-crema outline-none focus:border-maiz focus:ring-1 focus:ring-maiz transition-all placeholder-white/20"
              placeholder="ejemplo@correo.com"
            >
          </div>
        </div>

        <button 
          :disabled="loading" 
          class="w-full rounded bg-maiz px-3 py-3 font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-black/80"
        >
          <span v-if="loading" class="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin"></span>
          {{ loading ? 'Enviando…' : 'Enviar enlace' }}
        </button>

        <transition enter-active-class="animate-fade-in-down">
          <div v-if="msg" class="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2 justify-center">
             <span class="text-sm text-emerald-300 text-center">{{ msg }}</span>
          </div>
        </transition>

        <transition enter-active-class="animate-fade-in-down">
          <div v-if="err" class="p-3 rounded bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 justify-center">
             <span class="text-sm text-rose-300 text-center">{{ err }}</span>
          </div>
        </transition>

        <div class="text-center pt-2">
          <RouterLink :to="{ name: 'login' }" class="text-sm text-maiz underline hover:text-maiz/80 transition-colors">
            Volver a ingresar
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